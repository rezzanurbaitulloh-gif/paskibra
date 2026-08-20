import { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getAIEndpoints } from "@/lib/ai/providers"

const FALLBACK_PROMPT = `Kamu adalah "Tanya Satria Bot", asisten AI resmi Paskibra Satria Cengkara SMKN 1 Kertosono.
Tugasmu:
- Menjawab pertanyaan tentang Paskibra, SMKN 1 Kertosono, profil sekolah, sejarah, struktur pengurus, galeri, prestasi, penyewaan kostum/atribut, dan kegiatan organisasi.
- Gunakan bahasa Indonesia yang santun dan ramah, jawaban singkat (maksimal 150 kata) kecuali diminta detail.
- Jika ditanya di luar topik, arahkan kembali ke topik Paskibra/Sekolah.
- Jika tidak tahu, jawab jujur dan tawarkan bantuan lain.`

export const runtime = "nodejs"
export const maxDuration = 60

async function getSystemPrompt(): Promise<string> {
  try {
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
      { auth: { persistSession: false } }
    )
    const { data } = await client.from("site_settings").select("value").eq("key", "aiPrompt").maybeSingle()
    const prompt = data?.value
    if (typeof prompt === "string" && prompt.trim()) return prompt.trim()
    if (prompt && typeof prompt === "object") {
      const p = (prompt as { prompt?: string }).prompt
      if (typeof p === "string" && p.trim()) return p.trim()
    }
  } catch {}
  return FALLBACK_PROMPT
}

export async function POST(request: NextRequest) {
  try {
    const { messages, prompt } = await request.json()

    const userPrompt = prompt || (Array.isArray(messages) && messages.length
      ? messages[messages.length - 1].content
      : "")

    if (!userPrompt) {
      return Response.json({ error: "Prompt kosong" }, { status: 400 })
    }

    const lastError: { message: string; status?: number } = { message: "Semua endpoint AI gagal" }

    const systemPrompt = await getSystemPrompt()

    const endpoints = getAIEndpoints()
    const attempts: { endpoint: (typeof endpoints)[number]; model: string }[] = []
    const maxModels = Math.max(...endpoints.map((e) => e.models.length), 0)
    for (let m = 0; m < maxModels; m++) {
      for (const endpoint of endpoints) {
        if (endpoint.models[m]) attempts.push({ endpoint, model: endpoint.models[m] })
      }
    }

    const deadline = Date.now() + 60000

    for (const { endpoint, model } of attempts) {
      if (Date.now() > deadline) {
        lastError.message = "Semua endpoint AI lambat atau tidak merespons (waktu habis 60 detik)"
        break
      }
      try {
        const response = await fetch(`${endpoint.url}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(endpoint.key ? { Authorization: `Bearer ${endpoint.key}` } : {}),
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            stream: true,
          }),
          signal: AbortSignal.timeout(20000),
        })

        if (!response.ok) {
          lastError.message = `HTTP ${response.status} dari ${endpoint.url} (${model})`
          lastError.status = response.status
          if (response.status === 429 || response.status >= 500) continue
          break
        }

        if (!response.body) {
          lastError.message = "Tidak ada response body"
          continue
        }

        const reader = response.body.getReader()
        const encoder = new TextEncoder()

        const stream = new ReadableStream({
          async start(controller) {
            const decoder = new TextDecoder()
            try {
              while (true) {
                const { done, value } = await reader.read()
                if (done) break
                const chunk = decoder.decode(value, { stream: true })
                const lines = chunk.split("\n")
                for (const line of lines) {
                  if (!line.startsWith("data: ")) continue
                  const data = line.slice(6)
                  if (data === "[DONE]") continue
                  try {
                    const parsed = JSON.parse(data)
                    const content = parsed.choices?.[0]?.delta?.content
                    if (content) {
                      controller.enqueue(encoder.encode(content))
                    }
                  } catch {
                    // abaikan chunk yang tidak valid
                  }
                }
              }
            } catch (err) {
              controller.error(err)
            } finally {
              controller.close()
            }
          },
        })

        return new Response(stream, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-cache",
          },
        })
      } catch (err) {
        lastError.message = err instanceof Error ? err.message : "Network error"
      }
    }

    return Response.json(
      { error: lastError.message },
      { status: 503 }
    )
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    )
  }
}