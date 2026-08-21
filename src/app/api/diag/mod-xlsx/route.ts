import * as XLSX from "xlsx"

export const runtime = "nodejs"

export async function GET() {
  try {
    const wb = XLSX.read("a\n1", { type: "string" })
    return Response.json({ ok: true, version: XLSX.version, sheets: wb.SheetNames.length })
  } catch (err) {
    return Response.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
