import * as XLSX from "xlsx"
import mammoth from "mammoth"

export const SUPPORTED_EXT = [
  ".docx", ".doc", ".txt", ".pdf", ".xlsx", ".xls", ".csv",
]

export function isDocumentFile(filename: string): boolean {
  const lower = filename.toLowerCase()
  return SUPPORTED_EXT.some((ext) => lower.endsWith(ext))
}

export async function extractText(buffer: Buffer, filename: string): Promise<string> {
  const lower = filename.toLowerCase()

  if (lower.endsWith(".xlsx") || lower.endsWith(".xls") || lower.endsWith(".csv")) {
    const wb = XLSX.read(buffer, { type: "buffer" })
    const parts: string[] = []
    for (const sheet of wb.SheetNames) {
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheet], { header: 1, defval: "" }) as unknown[][]
      const lines = rows
        .map((row) => (Array.isArray(row) ? row.map((c) => String(c).trim()).filter(Boolean).join(" | ") : String(row).trim()))
        .filter(Boolean)
      parts.push(`[Sheet: ${sheet}]\n` + lines.join("\n"))
    }
    if (parts.length === 0) throw new Error("File Excel kosong atau tidak terbaca")
    return parts.join("\n\n")
  }

  if (lower.endsWith(".docx")) {
    const result = await mammoth.extractRawText({ buffer })
    const text = result.value.replace(/\r/g, "").trim()
    if (!text) throw new Error("File Word kosong atau tidak terbaca")
    return text
  }

  if (lower.endsWith(".pdf")) {
    let PDFParse: (new (opts: { data: Buffer }) => { getText: () => Promise<{ text: string }>; destroy: () => Promise<void> }) | null = null
    try {
      const mod = await import("pdf-parse")
      PDFParse = mod.PDFParse
    } catch {
      throw new Error("Modul pembaca PDF gagal dimuat di server ini — gunakan .docx atau .xlsx")
    }
    const parser = new PDFParse({ data: buffer })
    try {
      const result = await parser.getText()
      const text = result.text.replace(/\r/g, "").trim()
      if (!text) throw new Error("File PDF kosong atau tidak terbaca")
      return text
    } finally {
      await parser.destroy()
    }
  }

  if (lower.endsWith(".doc")) {
    const text = buffer
      .toString("utf-8")
      .replace(/[^\x20-\x7E\n\r\u00C0-\u00FF]/g, " ")
      .replace(/[ \t]+/g, " ")
      .trim()
    if (!text) throw new Error("File .doc lama tidak didukung — simpan ulang sebagai .docx atau Excel")
    return text
  }

  if (lower.endsWith(".txt")) {
    return buffer.toString("utf-8")
  }

  throw new Error("Format tidak didukung. Gunakan Excel (.xlsx/.csv), Word (.docx), atau PDF")
}
