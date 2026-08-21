import { NextRequest } from "next/server"
import { getAIEndpoints } from "@/lib/ai/providers"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const provider = request.nextUrl.searchParams.get("provider")
  const model = request.nextUrl.searchParams.get("model")
  const endpoints = getAIEndpoints()
  const target = endpoints.find((e) => (provider ? e.provider === provider : true)) ?? endpoints[0]
  if (!target) return Response.json({ error: "no endpoints" })

  const start = Date.now()
  try {
    const res = await fetch(`${target.url}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(target.key ? { Authorization: `Bearer ${target.key}` } : {}),
      },
      body: JSON.stringify({
        model: model || target.models[0],
        messages: [{ role: "user", content: 'Balas hanya kata "OK"' }],
        temperature: 0,
      }),
      signal: AbortSignal.timeout(8000),
    })
    const body = await res.text()
    return Response.json({
      provider: target.provider,
      url: target.url,
      model: model || target.models[0],
      hasKey: Boolean(target.key),
      status: res.status,
      ms: Date.now() - start,
      body: body.slice(0, 300),
    })
  } catch (err) {
    return Response.json({
      provider: target.provider,
      url: target.url,
      model: model || target.models[0],
      status: 0,
      ms: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    })
  }
}
