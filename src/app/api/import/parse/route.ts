import { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"
import * as XLSX from "xlsx"
import mammoth from "mammoth"
import { getAIEndpoints } from "@/lib/ai/providers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

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

async function extractText(buffer: Buffer, filename: string): Promise<string> {
  const lower = filename.toLowerCase()

  if (lower.endsWith(".xlsx") || lower.endsWith(".xls") || lower.endsWith(".csv")) {
    const wb = XLSX.read(buffer, { type: "buffer" })
    const parts: string[] = []
    for (const sheet of wb.SheetNames) {
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheet], { header: 1, defval: "" }) as unknown[][]
      const lines = rows
        .map((row) => (Array.isArray(row) ? row.map((c) => String(c).trim()).filter(Boolean).join(" | ") : String(row).trim()))
        .filter(Boolean)
      parts.push(`[Sheet: ${sheet}]\n` + lines.join("\n"))
    }
    if (parts.length === 0) throw new Error("File Excel kosong atau tidak terbaca")
    return parts.join("\n\n")
  }

  if (lower.endsWith(".docx")) {
    const result = await mammoth.extractRawText({ buffer })
    const text = result.value.replace(/\r/g, "").trim()
    if (!text) throw new Error("File Word kosong atau tidak terbaca")
    return text
  }

  if (lower.endsWith(".doc")) {
    const text = buffer
      .toString("utf-8")
      .replace(/[^\x20-\x7E\n\r\u00C0-\u00FF]/g, " ")
      .replace(/[ \t]+/g, " ")
      .trim()
    if (!text) throw new Error("File .doc lama tidak didukung — simpan ulang sebagai .docx atau Excel")
    return text
  }

  if (lower.endsWith(".txt")) {
    return buffer.toString("utf-8")
  }

  throw new Error("Format tidak didukung. Gunakan Excel (.xlsx/.csv) atau Word (.docx)")
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

    const lastError: { message: string } = { message: "Semua endpoint AI gagal" }
    for (const endpoint of getAIEndpoints()) {
      for (const model of endpoint.models) {
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
            signal: AbortSignal.timeout(60000),
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

          const clean = rows
            .filter((r: Record<string, unknown>) => {
              const name = String(r.name || "").trim()
              const description = String(r.description || "").trim()
              return type === "anggota" ? Boolean(name) : Boolean(description && r.amount)
            })
            .map((r: Record<string, unknown>) =>
              type === "anggota"
                ? {
                    name: String(r.name || "").trim(),
                    position: String(r.position || "Anggota").trim() || "Anggota",
                    division: String(r.division || "Umum").trim() || "Umum",
                    generation: String(r.generation || "").trim(),
                    kelas: String(r.kelas || "").trim(),
                  }
                : {
                    description: String(r.description).trim(),
                    amount: Math.round(Number(r.amount)),
                    type: r.type === "income" ? "income" : "expense",
                    category: String(r.category || "Lainnya"),
                    date: String(r.date || new Date().toISOString().split("T")[0]),
                  }
            )

          if (clean.length === 0) {
            lastError.message = "Tidak ada data terdeteksi dari file"
            continue
          }

          return Response.json({ rows: clean })
        } catch (err) {
          lastError.message = err instanceof Error ? err.message : "Network error"
        }
      }
    }

    return Response.json({ error: lastError.message }, { status: 500 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan"
    return Response.json({ error: message }, { status: 500 })
  }
}
