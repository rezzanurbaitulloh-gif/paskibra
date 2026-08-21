import mammoth from "mammoth"

export const runtime = "nodejs"

export async function GET() {
  try {
    const out = await mammoth.extractRawText({ buffer: Buffer.from("<p>halo</p>") })
    return Response.json({ ok: true, value: out.value })
  } catch (err) {
    return Response.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
