import { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { extractText } from "@/lib/extractText"

export const runtime = "nodejs"
export const maxDuration = 60

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  { auth: { autoRefreshToken: false, persistSession: false } },
)

export async function POST(request: NextRequest) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "")
  if (!token) return Response.json({ error: "Tidak terautentikasi" }, { status: 401 })
  const { data: { user }, error } = await admin.auth.getUser(token)
  if (error || !user) return Response.json({ error: "Sesi tidak valid" }, { status: 401 })

  const step = request.nextUrl.searchParams.get("step") || "formdata"
  const results: Record<string, unknown> = { step }

  try {
    const formData = await request.formData()
    const file = formData.get("file")
    if (!(file instanceof File)) {
      return Response.json({ ...results, fatal: "file bukan File", ok: false })
    }
    results.formdata = `ok (${file.name}, ${file.size}B)`
    if (step === "formdata") return Response.json({ ...results, ok: true })

    const buffer = Buffer.from(await file.arrayBuffer())
    results.buffer = `ok (${buffer.length}B)`
    if (step === "buffer") return Response.json({ ...results, ok: true })

    const text = await extractText(buffer, file.name)
    results.extractText = `ok (${text.length} chars)`
    if (step === "extracttext") return Response.json({ ...results, ok: true })

    const XLSX = await import("xlsx")
    const wb = XLSX.read(buffer, { type: "buffer" })
    const sheet = wb.Sheets[wb.SheetNames[0]]
    const rows = sheet ? XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" }) : []
    results.directRows = `ok (${rows.length} rows, sheets: ${wb.SheetNames.join(",")})`
    return Response.json({ ...results, ok: true })
  } catch (err) {
    results.caught = err instanceof Error ? `${err.name}: ${err.message}` : String(err)
    return Response.json({ ...results, ok: false }, { status: 500 })
  }
}
