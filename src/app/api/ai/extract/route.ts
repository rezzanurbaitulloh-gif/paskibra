import { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getAIEndpoints } from "@/lib/ai/providers"
import { extractText, isDocumentFile } from "@/lib/extractText"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"]

const MODE_PROMPTS: Record<string, { system: string; structured: boolean }> = {
  sejarah: {
    structured: true,
    system: `Kamu adalah penulis sejarah Paskibra Satria Cengkara SMKN 1 Kertosono. Dari dokumen yang diberikan, buat timeline perjalanan organisasi.
Aturan:
- Ambil informasi kronologis dari isi dokumen. Jangan menambah fakta yang tidak ada di dokumen.
- Setiap item: year (tahun, contoh "2018"), title (judul singkat), desc (deskripsi 1-2 kalimat berbahasa Indonesia).
- Jika tahun tidak tersurat, perkirakan dari konteks.
- Maksimal 15 item, urut dari yang terlama ke terbaru.
- Keluarkan HANYA JSON array tanpa teks lain, format:
[{"year":"...","title":"...","desc":"..."}]`,
  },
  filosofi: {
    structured: true,
    system: `Kamu adalah ahli makna lambang Paskibra. Dari dokumen atau gambar yang diberikan, uraikan makna setiap elemen lambang (bentuk, warna, simbol).
Aturan:
- Setiap item: title (nama elemen, contoh "Sang Merah Putih"), desc (makna 1-2 kalimat berbahasa Indonesia).
- Jangan menambah elemen yang tidak ada di sumber.
- Maksimal 20 item.
- Keluarkan HANYA JSON array tanpa teks lain, format:
[{"title":"...","desc":"..."}]`,
  },
  sekolah: {
    structured: true,
    system: `Kamu adalah penulis profil sekolah. Dari dokumen yang diberikan, buat kartu-kartu informasi sekolah.
Aturan:
- Setiap item: title (judul singkat, contoh "Profil Sekolah"), content (isi 1-3 kalimat berbahasa Indonesia), image (biarkan "").
- Maksimal 12 item.
- Keluarkan HANYA JSON array tanpa teks lain, format:
[{"title":"...","content":"...","image":""}]`,
  },
  text: {
    structured: false,
    system: `Kamu adalah editor konten website Paskibra Satria Cengkara. Tulis ulang isi dokumen/gambar yang diberikan menjadi teks pengantar yang jelas, ringkas, dan persuasif sesuai konteks yang diminta.
Aturan:
- Maksimal 3 kalimat, bahasa Indonesia yang baik dan enak dibaca.
- Jangan menambah fakta di luar sumber.
- Keluarkan HANYA teks hasil, tanpa komentar, tanpa markup, tanpa tanda kutip pembuka/penutup.`,
  },
}

function normalizeItems(mode: string, parsed: unknown): Record<string, unknown>[] {
  const arr = Array.isArray(parsed) ? parsed : [parsed]
  const s = (v: unknown) => String(v || "").trim()

  if (mode === "sejarah") {
    return arr
      .filter((r) => s((r as Record<string, unknown>).title))
      .map((r) => {
        const row = r as Record<string, unknown>
        return { year: s(row.year), title: s(row.title), desc: s(row.desc) }
      })
      .slice(0, 15)
  }
  if (mode === "filosofi") {
    return arr
      .filter((r) => s((r as Record<string, unknown>).title))
      .map((r) => {
        const row = r as Record<string, unknown>
        return { title: s(row.title), desc: s(row.desc) }
      })
      .slice(0, 20)
  }
  if (mode === "sekolah") {
    return arr
      .filter((r) => s((r as Record<string, unknown>).title))
      .map((r) => {
        const row = r as Record<string, unknown>
        return { title: s(row.title), content: s(row.content), image: s(row.image) }
      })
      .slice(0, 12)
  }
  return []
}

function cleanJson(content: string): string | null {
  const match = content.match(/\[[\s\S]*\]/)
  return match ? match[0] : null
}

function stripCodeFence(text: string): string {
  return text
    .replace(/^```(?:json|txt|text)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim()
}

interface BuildUserContentParams {
  text?: string
  fileName?: string
  existing?: unknown
  instruction?: string
}

function buildUserContent({ text, fileName, existing, instruction }: BuildUserContentParams) {
  let parts = ""

  if (instruction && instruction.trim()) {
    parts += `Permintaan pengguna: ${instruction.trim()}\n\n`
  }
  if (existing !== undefined) {
    const existingText = typeof existing === "string" ? existing : JSON.stringify(existing)
    parts += `Data yang sedang ada saat ini:\n${existingText}\n\n`
  }
  if (text) {
    parts += `Isi dokumen${fileName ? ` (${fileName})` : ""}:\n${text.slice(0, 12000)}`
  }

  const userText = parts.trim() || (instruction && instruction.trim()) || "Analisis sumber yang diberikan."
  return { userText, parts }
}

async function callAI(
  systemPrompt: string,
  content: { text: string; imageUrl?: string },
  opts: { visionAttempt: boolean }
): Promise<{ ok: true; content: string } | { ok: false; message: string; visionBlocked: boolean }> {
  const endpoints = getAIEndpoints()
  const attempts: { endpoint: (typeof endpoints)[number]; model: string }[] = []
  const maxModels = Math.max(...endpoints.map((e) => e.models.length), 0)
  for (let m = 0; m < maxModels; m++) {
    for (const endpoint of endpoints) {
      if (endpoint.models[m]) attempts.push({ endpoint, model: endpoint.models[m] })
    }
  }
  const capped = attempts.slice(0, 40)
  if (capped.length === 0) return { ok: false, message: "Tidak ada endpoint AI tersedia", visionBlocked: false }

  let winner: { ok: true; content: string } | null = null
  let lastError = "Semua endpoint AI gagal"
  let visionBlocked = false

  const promises = capped.map(async ({ endpoint, model }) => {
    if (winner) return
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 45000)
    try {
      const messages: { role: string; content: unknown }[] = [{ role: "system", content: systemPrompt }]
      if (content.imageUrl) {
        messages.push({
          role: "user",
          content: [
            { type: "text", text: content.text },
            { type: "image_url", image_url: { url: content.imageUrl } },
          ],
        })
      } else {
        messages.push({ role: "user", content: content.text })
      }

      const response = await fetch(`${endpoint.url}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${endpoint.key}`,
        },
        body: JSON.stringify({ model, messages, temperature: 0.2, max_tokens: 4096 }),
        signal: controller.signal,
      })

      if (winner) return
      if (!response.ok) {
        lastError = `HTTP ${response.status} (${model})`
        if (opts.visionAttempt && (response.status === 400 || response.status === 404)) {
          visionBlocked = true
        }
        return
      }

      const data = await response.json()
      const reply: string = data?.choices?.[0]?.message?.content || ""
      if (!reply.trim()) {
        lastError = "AI mengembalikan jawaban kosong"
        return
      }
      winner = { ok: true, content: reply }
    } catch (err) {
      lastError = err instanceof Error ? err.message : "Network error"
    } finally {
      clearTimeout(timer)
    }
  })

  await Promise.allSettled(promises)
  if (winner) return winner
  return { ok: false, message: lastError, visionBlocked }
}

function unauthorized() {
  return Response.json({ error: "Tidak terautentikasi" }, { status: 401 })
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "")
    if (!token) return unauthorized()
    const {
      data: { user },
      error: authError,
    } = await admin.auth.getUser(token)
    if (authError || !user) return unauthorized()

    const contentType = request.headers.get("content-type") || ""
    const isMultipart = contentType.includes("multipart/form-data")

    let mode = ""
    let text: string | undefined
    let imageUrl: string | undefined
    let fileName: string | undefined
    let existing: unknown
    let instruction: string | undefined
    let context: string | undefined

    if (isMultipart) {
      const formData = await request.formData()
      mode = String(formData.get("mode") || "")
      instruction = String(formData.get("instruction") || "") || undefined
      context = String(formData.get("context") || "") || undefined
      const existingRaw = formData.get("existing")
      if (existingRaw && typeof existingRaw === "string" && existingRaw.trim()) {
        try {
          existing = JSON.parse(existingRaw)
        } catch {
          existing = existingRaw
        }
      }
      const file = formData.get("file")
      if (!(file instanceof File)) {
        return Response.json({ error: "File tidak ditemukan" }, { status: 400 })
      }
      if (file.size > 10 * 1024 * 1024) {
        return Response.json({ error: "Maksimal 10MB" }, { status: 400 })
      }
      fileName = file.name
      if (IMAGE_TYPES.includes(file.type)) {
        return Response.json(
          { error: "Untuk gambar, upload melalui komponen dan kirim imageUrl (model AI perlu URL publik)." },
          { status: 400 }
        )
      }
      if (!isDocumentFile(fileName)) {
        return Response.json(
          { error: "Format tidak didukung. Gunakan dokumen (.docx/.txt/.pdf) atau gambar." },
          { status: 400 }
        )
      }
      text = await extractText(Buffer.from(await file.arrayBuffer()), fileName)
    } else {
      const body = await request.json().catch(() => null)
      if (!body) return Response.json({ error: "Body tidak valid" }, { status: 400 })
      mode = String(body.mode || "")
      imageUrl = typeof body.imageUrl === "string" && body.imageUrl.trim() ? body.imageUrl.trim() : undefined
      text = typeof body.text === "string" ? body.text : undefined
      instruction = typeof body.instruction === "string" && body.instruction.trim() ? body.instruction.trim() : undefined
      context = typeof body.context === "string" && body.context.trim() ? body.context.trim() : undefined
      if (body.existing !== undefined && body.existing !== null) existing = body.existing
      if (!imageUrl && !text && !existing && !instruction) {
        return Response.json({ error: "Tidak ada sumber konten (file, text, atau existing)" }, { status: 400 })
      }
    }

    const prompt = MODE_PROMPTS[mode]
    if (!prompt) {
      return Response.json({ error: "Mode ekstraksi tidak valid" }, { status: 400 })
    }

    const systemPrompt = context ? `${prompt.system}\nKonteks target konten: ${context}.` : prompt.system

    const { userText } = buildUserContent({ text, fileName, existing, instruction })
    const result = await callAI(
      systemPrompt,
      { text: userText, imageUrl },
      { visionAttempt: Boolean(imageUrl) }
    )

    if (!result.ok) {
      if (result.visionBlocked) {
        return Response.json(
          { error: "Model AI yang tersedia tidak mendukung analisis gambar. Gunakan dokumen teks (.docx/.txt/.pdf) atau ketik manual." },
          { status: 400 }
        )
      }
      return Response.json({ error: result.message }, { status: 500 })
    }

    if (mode === "text") {
      return Response.json({ text: stripCodeFence(result.content) })
    }

    const json = cleanJson(result.content)
    if (!json) {
      return Response.json({ error: "AI tidak menghasilkan JSON valid — coba lagi" }, { status: 500 })
    }
    let parsed: unknown
    try {
      parsed = JSON.parse(json)
    } catch {
      return Response.json({ error: "AI menghasilkan JSON rusak — coba lagi" }, { status: 500 })
    }
    const data = normalizeItems(mode, parsed)
    if (data.length === 0) {
      return Response.json({ error: "Tidak ada konten terdeteksi dari sumber" }, { status: 500 })
    }
    return Response.json({ data })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan"
    return Response.json({ error: message }, { status: 500 })
  }
}
