import { NextRequest } from "next/server"
import { getAIEndpoints } from "@/lib/ai/providers"

const PARSER_PROMPT = `Kamu adalah parser keuangan cerdas untuk organisasi Paskibra. 
Tugasmu: ubah kalimat bebas bahasa Indonesia menjadi JSON array transaksi keuangan.
Aturan:
- Deteksi otomatis apakah transaksi adalah pemasukan (income) atau pengeluaran (expense).
- "uang", "dana", "donasi", "iuran", "bayaran", "hasil", "pemasukan" => income
- "beli", "bayar", "sewa", "print", "cetak", "konsumsi", "transport" => expense
- "pakai sisa proposal" artinya expense dibayar dari kas/sisa dana (tetap expense).
- Kategorikan: ATK, Konsumsi, Transport, Peralatan, Kostum, Sewa, Donasi, Lainnya.
- Tanggal default hari ini (YYYY-MM-DD) jika tidak disebutkan.
- Keluarkan HANYA JSON array, tanpa teks lain, format:
[{"description":"...","amount":<angka>,"type":"income|expense","category":"...","date":"YYYY-MM-DD"}]`

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text || typeof text !== "string") {
      return Response.json({ error: "Teks kosong" }, { status: 400 })
    }

    const lastError: { message: string } = { message: "Semua endpoint AI gagal" }

    const deadline = Date.now() + 20000
    const failedUrls = new Set<string>()
    for (const endpoint of getAIEndpoints()) {
      if (Date.now() >= deadline) break
      if (failedUrls.has(endpoint.url)) continue
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
                { role: "system", content: PARSER_PROMPT },
                { role: "user", content: text },
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
          const records = Array.isArray(parsed) ? parsed : [parsed]

          const clean = records
            .filter((r: Record<string, unknown>) => r.description && r.amount)
            .map((r: Record<string, unknown>) => ({
              description: String(r.description),
              amount: Math.round(Number(r.amount)),
              type: r.type === "income" ? "income" : "expense",
              category: String(r.category || "Lainnya"),
              date: String(r.date || new Date().toISOString().split("T")[0]),
            }))

          if (clean.length === 0) {
            lastError.message = "Tidak ada transaksi terdeteksi"
            continue
          }

          return Response.json({ records: clean })
        } catch (err) {
          lastError.message = err instanceof Error ? err.message : "Network error"
          if (/aborted|timeout|fetch failed|ECONN/i.test(lastError.message)) failedUrls.add(endpoint.url)
        }
      }
    }

    return Response.json({ error: lastError.message }, { status: 500 })
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}