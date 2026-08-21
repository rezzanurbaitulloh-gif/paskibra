import { PDFParse } from "pdf-parse"

export const runtime = "nodejs"

export async function GET() {
  try {
    const parser = new PDFParse({ data: new Uint8Array(0) })
    return Response.json({ ok: true, instantiated: true, keys: Object.keys(parser).length })
  } catch (err) {
    return Response.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
