import { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getAIEndpoints, markEndpointFailed, shouldSkipEndpoint } from "@/lib/ai/providers"
import { extractText } from "@/lib/extractText"
import * as XLSX from "xlsx"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

/** Fallback tanpa AI: baca langsung dari workbook Excel/CSV bila kolomnya dikenal */
function extractRowsDirect(
  buffer: Buffer,
  filename: string,
  type: string
): Record<string, string>[] | null {
  const lower = filename.toLowerCase()
  if (!(lower.endsWith(".xlsx") || lower.endsWith(".xls") || lower.endsWith(".csv"))) return null
  let wb: XLSX.WorkBook
  try {
    wb = XLSX.read(buffer, { type: "buffer" })
  } catch {
    return null
  }
  const sheet = wb.Sheets[wb.SheetNames[0]]
  if (!sheet) return null
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" })
  if (rows.length === 0) return null

  const norm = (k: string) => k.toLowerCase().replace(/[^a-z0-9]/g, "")
  const keyMap: Record<string, string> = {}
  for (const k of Object.keys(rows[0])) {
    const n = norm(k)
    if (type === "anggota") {
      if (/(nama|^name)/.test(n)) keyMap[k] = "name"
      else if (/(jabatan|posisi|^position)/.test(n)) keyMap[k] = "position"
      else if (/(divisi|bidang|^division)/.test(n)) keyMap[k] = "division"
      else if (/(generasi|angkatan|generation)/.test(n)) keyMap[k] = "generation"
      else if (/(kelas|jurusan|^class)/.test(n)) keyMap[k] = "kelas"
    } else {
      if (/(deskripsi|keterangan|uraian|description)/.test(n)) keyMap[k] = "description"
      else if (/(nominal|jumlah|total|amount|^jumlah)/.test(n)) keyMap[k] = "amount"
      else if (/(jenis|tipe|^type)/.test(n)) keyMap[k] = "type"
      else if (/(kategori|category)/.test(n)) keyMap[k] = "category"
      else if (/(tanggal|date)/.test(n)) keyMap[k] = "date"
    }
  }
  const required = type === "anggota" ? "name" : "description"
  if (!Object.values(keyMap).includes(required)) return null

  const out: Record<string, string>[] = []
  for (const r of rows) {
    const mapped: Record<string, string> = {}
    for (const [k, target] of Object.entries(keyMap)) {
      const v = r[k]
      mapped[target] = v === null || v === undefined ? "" : String(v).trim()
    }
    if (type === "anggota" ? mapped.name : mapped.description) out.push(mapped)
  }
  return out.length > 0 ? out : null
}

/** Normalisasi baris agar konsisten dengan hasil AI */
function normalizeRows(raw: Record<string, string>[], type: string): Record<string, string>[] {
  return raw
    .filter((r) => {
      const name = String(r.name || "").trim()
      const description = String(r.description || "").trim()
      return type === "anggota" ? Boolean(name) : Boolean(description && r.amount)
    })
    .map((r): Record<string, string> => {
      const row: Record<string, string> = {}
      if (type === "anggota") {
        row.name = String(r.name || "").trim()
        row.position = String(r.position || "Anggota").trim() || "Anggota"
        row.division = String(r.division || "Umum").trim() || "Umum"
        row.generation = String(r.generation || "").trim()
        row.kelas = String(r.kelas || "").trim()
      } else {
        row.description = String(r.description).trim()
        row.amount = String(Math.round(Number(r.amount)) || "")
        row.type =
          String(r.type).toLowerCase() === "income" || String(r.type).toLowerCase() === "pemasukan"
            ? "income"
            : "expense"
        row.category = String(r.category || "Lainnya")
        row.date = String(r.date || new Date().toISOString().split("T")[0])
      }
      return row
    })
}

const TYPE_PROMPTS: Record<string, string> = {
  keuangan: `Kamu adalah asisten keuangan organisasi Paskibra. Ubah data yang diberikan menjadi JSON array transaksi keuangan.
Aturan:
- Deteksi otomatis pemasukan (income) atau pengeluaran (expense). "uang", "dana", "donasi", "iuran", "bayaran", "hasil", "pemasukan" => income; "beli", "bayar", "sewa", "print", "cetak", "konsumsi", "transport" => expense.
- Kategorikan: ATK, Konsumsi, Transport, Peralatan, Kostum, Sewa, Donasi, Lainnya.
- Tanggal: gunakan tanggal pada file jika ada (YYYY-MM-DD), default hari ini jika tidak ada.
- Gabungkan nama kolom dengan isinya untuk memahami struktur data.
- Perbaiki angka/format yang salah atau tidak konsisten.
- Keluarkan HANYA JSON array, tanpa teks lain, format:
[{"description":"...","amount":<angka>,"type":"income|expense","category":"...","date":"YYYY-MM-DD"}]`,

  anggota: `Kamu adalah asisten organisasi Paskibra. Ubah data daftar anggota/pengurus yang diberikan menjadi JSON array anggota.
Aturan:
- Petakan kolom ke: name (nama), position (jabatan), division (divisi), generation (generasi), kelas (kelas/jurusan).
- Jabatan umum: Ketua, Wakil Ketua, Sekretaris, Bendahara, Koordinator Divisi, Anggota.
- Divisi umum: Paskibra, LKBB, Upacara, Humas, dll. Jika tidak ada, gunakan "Anggota" untuk jabatan dan "Umum" untuk divisi.
- Generasi: ubah menjadi format "Generasi XX" (contoh "angkatan 23", "G23", "2023" => "Generasi 23"). Jika tidak ada, isi "".
- Kelas/jurusan: ambil dari kolom kelas/jurusan jika ada, contoh "XII TKJ 2". Jika tidak ada, isi "".
- Buang baris yang kosong/duplikat.
- Keluarkan HANYA JSON array, tanpa teks lain, format:
[{"name":"...","position":"...","division":"...","generation":"...","kelas":"..."}]`,
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "")
    if (!token) {
      return Response.json({ error: "Tidak terautentikasi" }, { status: 401 })
    }
    const {
      data: { user },
      error: authError,
    } = await admin.auth.getUser(token)
    if (authError || !user) {
      return Response.json({ error: "Sesi tidak valid" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file")
    const type = String(formData.get("type") || "keuangan")
    if (!(file instanceof File)) {
      return Response.json({ error: "File tidak ditemukan" }, { status: 400 })
    }
    if (!TYPE_PROMPTS[type]) {
      return Response.json({ error: "Tipe import tidak valid" }, { status: 400 })
    }
    if (file.size > 10 * 1024 * 1024) {
      return Response.json({ error: "Maksimal 10MB" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const text = await extractText(buffer, file.name)
    const directRows = extractRowsDirect(buffer, file.name, type)
    if (directRows && directRows.length > 0) {
      return Response.json({ rows: normalizeRows(directRows, type) })
    }

    const lastError: { message: string } = { message: "Semua endpoint AI gagal" }
    const deadline = Date.now() + 20000
    const failedUrls = new Set<string>()
    for (const endpoint of getAIEndpoints()) {
      if (Date.now() >= deadline) break
      if (failedUrls.has(endpoint.url)) continue
      if (shouldSkipEndpoint(endpoint.url)) continue
      for (const model of endpoint.models) {
        if (Date.now() >= deadline) break
        try {
          const response = await fetch(`${endpoint.url}/chat/completions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${endpoint.key}`,
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: "system", content: TYPE_PROMPTS[type] },
                {
                  role: "user",
                  content: `Data dari file "${file.name}":\n\n${text.slice(0, 12000)}`,
                },
              ],
              temperature: 0.1,
            }),
            signal: AbortSignal.timeout(Math.min(6000, Math.max(2000, deadline - Date.now()))),
          })

          if (!response.ok) {
            lastError.message = `HTTP ${response.status}`
            if (response.status === 429 || response.status >= 500) continue
            break
          }

          const data = await response.json()
          const content: string = data?.choices?.[0]?.message?.content || ""
          const jsonMatch = content.match(/\[[\s\S]*\]/)
          if (!jsonMatch) {
            lastError.message = "AI tidak menghasilkan JSON valid"
            continue
          }

          const parsed = JSON.parse(jsonMatch[0])
          const rows = Array.isArray(parsed) ? parsed : [parsed]

          const clean = normalizeRows(
            rows.map((r: Record<string, unknown>) =>
              Object.fromEntries(Object.entries(r).map(([k, v]) => [k, String(v ?? "")]))
            ),
            type
          )

          if (clean.length === 0) {
            lastError.message = "Tidak ada data terdeteksi dari file"
            continue
          }

          return Response.json({ rows: clean })
        } catch (err) {
          lastError.message = err instanceof Error ? err.message : "Network error"
          if (/aborted|timeout|fetch failed|ECONN/i.test(lastError.message)) {
            failedUrls.add(endpoint.url)
            markEndpointFailed(endpoint.url)
          }
        }
      }
    }

    return Response.json({ error: lastError.message }, { status: 500 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan"
    return Response.json({ error: message }, { status: 500 })
  }
}
