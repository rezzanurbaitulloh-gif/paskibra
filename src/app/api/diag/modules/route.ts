import { NextRequest } from "next/server"

export const runtime = "nodejs"

export async function GET(_request: NextRequest) {
  const results: Record<string, string> = {}
  for (const mod of ["xlsx", "mammoth", "pdf-parse", "@/lib/extractText"]) {
    try {
      const m = await import(mod)
      results[mod] = `ok (${Object.keys(m).slice(0, 5).join(",")})`
    } catch (err) {
      results[mod] = err instanceof Error ? `${err.name}: ${err.message.slice(0, 200)}` : String(err)
    }
  }
  return Response.json({ node: process.version, region: process.env.VERCEL_REGION || "local", results })
}
