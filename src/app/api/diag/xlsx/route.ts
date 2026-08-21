import * as XLSX from "xlsx"

export const runtime = "nodejs"

export async function GET() {
  try {
    const wb = XLSX.read("a,b\n1,2", { type: "string" })
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]])
    return Response.json({ ok: true, version: XLSX.version, rows })
  } catch (err) {
    return Response.json(
      { ok: false, error: err instanceof Error ? `${err.name}: ${err.message}` : String(err) },
      { status: 500 },
    )
  }
}
