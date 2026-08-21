import { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getAIEndpoints } from "@/lib/ai/providers"

export const runtime = "nodejs"
export const maxDuration = 60

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  { auth: { autoRefreshToken: false, persistSession: false } },
)

export async function GET(request: NextRequest) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "")
  if (!token) return Response.json({ error: "Tidak terautentikasi" }, { status: 401 })
  const { data: { user }, error } = await admin.auth.getUser(token)
  if (error || !user) return Response.json({ error: "Sesi tidak valid" }, { status: 401 })

  const endpoints = getAIEndpoints()
  const results = await Promise.all(
    endpoints.map(async (e) => {
      const start = Date.now()
      try {
        const res = await fetch(`${e.url}/models`, {
          headers: e.key ? { Authorization: `Bearer ${e.key}` } : {},
          signal: AbortSignal.timeout(5000),
        })
        return {
          provider: e.provider,
          url: e.url,
          models: e.models,
          hasKey: Boolean(e.key),
          status: res.status,
          ms: Date.now() - start,
        }
      } catch (err) {
        return {
          provider: e.provider,
          url: e.url,
          models: e.models,
          hasKey: Boolean(e.key),
          status: 0,
          error: err instanceof Error ? err.message.slice(0, 80) : "unknown",
          ms: Date.now() - start,
        }
      }
    }),
  )

  return Response.json({
    env: {
      AI_ENDPOINTS: Boolean(process.env.AI_ENDPOINTS),
      NARA_KEYS: (process.env.NARA_KEYS || process.env.NEXT_PUBLIC_NARA_KEYS || "").split(",").filter(Boolean).length,
      SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      SERVICE_ROLE: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      node: process.version,
      region: process.env.VERCEL_REGION || "local",
    },
    endpointCount: endpoints.length,
    endpoints: results,
  })
}
