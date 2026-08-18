import * as XLSX from "xlsx"
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
} from "docx"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { fmtIDR } from "@/lib/fmt"

export interface DashboardReportData {
  generatedBy: string
  generatedAt: string
  stats: Record<string, number>
  deltas: Record<string, number>
  genData: { name: string; count: number }[]
  yearData: { year: string; count: number }[]
  galCategories: { name: string; count: number }[]
  finRows: { date: string; type: string; amount: number }[]
  lkbbRows: { school_name: string; payment_status: string; amount: number; created_at: string }[]
  sarans: { id: string; sender_name: string | null; message: string; created_at: string; admin_reply: string | null }[]
  artikels: { id: string; title: string; slug: string; created_at: string }[]
}

const stamp = () => new Date().toISOString().slice(0, 10)
const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "—"

function finSummary(rows: DashboardReportData["finRows"]) {
  const income = rows.filter((r) => r.type === "income").reduce((s, r) => s + Number(r.amount || 0), 0)
  const expense = rows.filter((r) => r.type === "expense").reduce((s, r) => s + Number(r.amount || 0), 0)
  return { income, expense, balance: income - expense }
}

export function downloadReportExcel(data: DashboardReportData) {
  const { income, expense, balance } = finSummary(data.finRows)
  const wb = XLSX.utils.book_new()

  const summary = [
    ["LAPORAN RINGKASAN DASHBOARD"],
    ["Paskibra Satria Cengkara — SMK Negeri 1 Kertosono"],
    [`Dibuat: ${data.generatedAt} oleh ${data.generatedBy}`],
    [],
    ["Statistik"],
    ["Keterangan", "Total", "Bulan Ini"],
    ["Anggota", data.stats.members || 0, data.deltas.members || 0],
    ["Galeri", data.stats.galeri || 0, data.deltas.galeri || 0],
    ["Inventaris", data.stats.inventaris || 0, 0],
    ["Saran Masuk", data.stats.saran || 0, data.deltas.saran || 0],
    [],
    ["Keuangan"],
    ["Total Pemasukan", fmtIDR(income)],
    ["Total Pengeluaran", fmtIDR(expense)],
    ["Saldo", fmtIDR(balance)],
    [],
    ["Anggota per Generasi"],
    ...data.genData.map((g) => [g.name, g.count]),
    [],
    ["Anggota per Tahun Angkatan"],
    ...data.yearData.map((y) => [y.year, y.count]),
    [],
    ["Kategori Galeri"],
    ...data.galCategories.map((c) => [c.name, c.count]),
  ]
  const wsSummary = XLSX.utils.aoa_to_sheet(summary)
  wsSummary["!cols"] = [{ wch: 34 }, { wch: 14 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, wsSummary, "Ringkasan")

  const wsFin = XLSX.utils.json_to_sheet(
    data.finRows
      .slice()
      .sort((a, b) => String(b.date).localeCompare(String(a.date)))
      .map((r) => ({
        Tanggal: r.date,
        Jenis: r.type === "income" ? "Pemasukan" : "Pengeluaran",
        Nominal: Number(r.amount || 0),
      }))
  )
  wsFin["!cols"] = [{ wch: 12 }, { wch: 14 }, { wch: 15 }]
  XLSX.utils.book_append_sheet(wb, wsFin, "Keuangan")

  const wsLkbb = XLSX.utils.json_to_sheet(
    data.lkbbRows.map((r) => ({
      "Nama Sekolah": r.school_name,
      Status: r.payment_status === "lunas" ? "Lunas" : r.payment_status === "dp" ? "DP" : "Belum Bayar",
      Nominal: Number(r.amount || 0),
      "Tanggal Daftar": r.created_at ? String(r.created_at).slice(0, 10) : "",
    }))
  )
  wsLkbb["!cols"] = [{ wch: 30 }, { wch: 14 }, { wch: 15 }, { wch: 12 }]
  XLSX.utils.book_append_sheet(wb, wsLkbb, "Peserta LKBB")

  const wsSaran = XLSX.utils.json_to_sheet(
    data.sarans.map((s) => ({
      Pengirim: s.sender_name || "Anonim",
      Pesan: s.message,
      "Dibalas": s.admin_reply ? "Ya" : "Belum",
      Tanggal: s.created_at ? String(s.created_at).slice(0, 10) : "",
    }))
  )
  wsSaran["!cols"] = [{ wch: 22 }, { wch: 60 }, { wch: 10 }, { wch: 12 }]
  XLSX.utils.book_append_sheet(wb, wsSaran, "Saran Terbaru")

  const wsArtikel = XLSX.utils.json_to_sheet(
    data.artikels.map((a) => ({
      Judul: a.title,
      Slug: a.slug,
      Tanggal: a.created_at ? String(a.created_at).slice(0, 10) : "",
    }))
  )
  wsArtikel["!cols"] = [{ wch: 50 }, { wch: 30 }, { wch: 12 }]
  XLSX.utils.book_append_sheet(wb, wsArtikel, "Artikel Terbaru")

  XLSX.writeFile(wb, `laporan-ringkasan-${stamp()}.xlsx`)
}

function cell(text: string, bold = false, fill = false) {
  return new TableCell({
    shading: fill ? { fill: "F3F4F6", color: "auto" } : undefined,
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold, size: 20 })],
      }),
    ],
  })
}

export async function downloadReportWord(data: DashboardReportData) {
  const { income, expense, balance } = finSummary(data.finRows)
  const head = (text: string) =>
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 280, after: 120 },
      children: [new TextRun({ text, bold: true })],
    })
  const line = (text: string) => new Paragraph({ spacing: { after: 60 }, children: [new TextRun(text)] })
  const kv = (k: string, v: string) =>
    new Paragraph({
      spacing: { after: 40 },
      children: [new TextRun({ text: `${k}: `, bold: true }), new TextRun(v)],
    })

  const finTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ tableHeader: true, children: [cell("Tanggal", true, true), cell("Jenis", true, true), cell("Nominal", true, true)] }),
      ...data.finRows
        .slice()
        .sort((a, b) => String(b.date).localeCompare(String(a.date)))
        .slice(0, 100)
        .map(
          (r) =>
            new TableRow({
              children: [
                cell(String(r.date || "")),
                cell(r.type === "income" ? "Pemasukan" : "Pengeluaran"),
                cell(fmtIDR(Number(r.amount || 0))),
              ],
            })
        ),
    ],
  })

  const doc = new Document({
    sections: [
      {
        properties: { page: { margin: { top: 1000, bottom: 1000, left: 1000, right: 1000 } } },
        children: [
          new Paragraph({
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            children: [new TextRun("Laporan Ringkasan Dashboard")],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
            children: [new TextRun("Paskibra Satria Cengkara — SMK Negeri 1 Kertosono")],
          }),
          kv("Dibuat", `${data.generatedAt} oleh ${data.generatedBy}`),
          head("Statistik"),
          kv("Anggota", `${data.stats.members || 0} (bulan ini: ${data.deltas.members || 0})`),
          kv("Galeri", `${data.stats.galeri || 0} (bulan ini: ${data.deltas.galeri || 0})`),
          kv("Inventaris", `${data.stats.inventaris || 0}`),
          kv("Saran Masuk", `${data.stats.saran || 0} (bulan ini: ${data.deltas.saran || 0})`),
          head("Keuangan"),
          kv("Total Pemasukan", fmtIDR(income)),
          kv("Total Pengeluaran", fmtIDR(expense)),
          kv("Saldo", fmtIDR(balance)),
          head("Anggota per Generasi"),
          ...(data.genData.length ? data.genData.map((g) => line(`${g.name}: ${g.count} orang`)) : [line("—")]),
          head("Anggota per Tahun Angkatan"),
          ...(data.yearData.length ? data.yearData.map((y) => line(`${y.year}: ${y.count} orang`)) : [line("—")]),
          head("Kategori Galeri"),
          ...(data.galCategories.length ? data.galCategories.map((c) => line(`${c.name}: ${c.count} item`)) : [line("—")]),
          head("Transaksi Keuangan"),
          ...(data.finRows.length ? [finTable] : [line("—")]),
          head("Peserta LKBB Terbaru"),
          ...(data.lkbbRows.length
            ? data.lkbbRows.map((r) =>
                line(`${r.school_name} — ${r.payment_status === "lunas" ? "Lunas" : r.payment_status === "dp" ? "DP" : "Belum Bayar"} — ${fmtIDR(Number(r.amount || 0))} (${fmtDate(r.created_at)})`)
              )
            : [line("—")]),
          head("Saran Terbaru"),
          ...(data.sarans.length
            ? data.sarans.map((s) =>
                line(`• ${s.sender_name || "Anonim"} (${fmtDate(s.created_at)}): ${s.message}${s.admin_reply ? " — Dibalas" : ""}`)
              )
            : [line("—")]),
          head("Artikel Terbaru"),
          ...(data.artikels.length
            ? data.artikels.map((a) => line(`• ${a.title} (${fmtDate(a.created_at)})`))
            : [line("—")]),
        ],
      },
    ],
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: 22 },
          paragraph: { spacing: { line: 276 } },
        },
      },
    },
  })

  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `laporan-ringkasan-${stamp()}.docx`
  a.click()
  URL.revokeObjectURL(url)
}

export function downloadReportPdf(data: DashboardReportData) {
  const { income, expense, balance } = finSummary(data.finRows)
  const doc = new jsPDF()
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 14

  doc.setFont("helvetica", "bold")
  doc.setFontSize(16)
  doc.setTextColor(30)
  doc.text("Laporan Ringkasan Dashboard", pageW / 2, 18, { align: "center" })
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text("Paskibra Satria Cengkara — SMK Negeri 1 Kertosono", pageW / 2, 25, { align: "center" })
  doc.setTextColor(120)
  doc.text(`Dibuat: ${data.generatedAt} oleh ${data.generatedBy}`, pageW / 2, 31, { align: "center" })
  doc.setTextColor(30)

  let y = 42
  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.setTextColor(1, 2, 129)
  doc.text("Statistik", margin, y)
  y += 6
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.setTextColor(30)
  doc.text(`Anggota: ${data.stats.members || 0}  (bulan ini: ${data.deltas.members || 0})`, margin, y)
  y += 5
  doc.text(`Galeri: ${data.stats.galeri || 0}  (bulan ini: ${data.deltas.galeri || 0})`, margin, y)
  y += 5
  doc.text(`Inventaris: ${data.stats.inventaris || 0}`, margin, y)
  y += 5
  doc.text(`Saran Masuk: ${data.stats.saran || 0}  (bulan ini: ${data.deltas.saran || 0})`, margin, y)
  y += 8

  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.setTextColor(1, 2, 129)
  doc.text("Keuangan", margin, y)
  y += 6
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.setTextColor(30)
  doc.text(`Total Pemasukan: ${fmtIDR(income)}`, margin, y)
  y += 5
  doc.text(`Total Pengeluaran: ${fmtIDR(expense)}`, margin, y)
  y += 5
  doc.text(`Saldo: ${fmtIDR(balance)}`, margin, y)
  y += 8

  const rowData: Record<string, string | number>[] = data.lkbbRows.map((r) => ({
    "Nama Sekolah": r.school_name,
    Status: r.payment_status === "lunas" ? "Lunas" : r.payment_status === "dp" ? "DP" : "Belum Bayar",
    Nominal: Number(r.amount || 0),
    Tanggal: r.created_at ? String(r.created_at).slice(0, 10) : "",
  }))
  autoTable(doc, {
    startY: y,
    head: [["Peserta LKBB", "Status", "Nominal", "Tanggal"]],
    body: rowData.map((r) => [r["Nama Sekolah"], r.Status, r.Nominal, r.Tanggal]),
    headStyles: { fillColor: [1, 2, 129], fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    margin: { left: margin, right: margin },
  })

  const saranData = data.sarans.map((s) => ({
    Pengirim: s.sender_name || "Anonim",
    Pesan: s.message,
    Dibalas: s.admin_reply ? "Ya" : "Belum",
  }))
  autoTable(doc, {
    head: [["Saran Terbaru", "", ""]],
    body: saranData.map((s) => [s.Pengirim, s.Pesan, s.Dibalas]),
    headStyles: { fillColor: [1, 2, 129], fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    margin: { left: margin, right: margin },
  })

  const artData = data.artikels.map((a) => ({
    Judul: a.title,
    Tanggal: a.created_at ? String(a.created_at).slice(0, 10) : "",
  }))
  autoTable(doc, {
    head: [["Artikel Terbaru", "Tanggal"]],
    body: artData.map((a) => [a.Judul, a.Tanggal]),
    headStyles: { fillColor: [1, 2, 129], fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    margin: { left: margin, right: margin },
  })

  doc.save(`laporan-ringkasan-${stamp()}.pdf`)
}

export function emailReportSummary(data: DashboardReportData) {
  const { income, expense, balance } = finSummary(data.finRows)
  const subject = encodeURIComponent(`Laporan Ringkasan Dashboard ${stamp()} — Satria Cengkara`)
  const lines = [
    `Laporan Ringkasan Dashboard — ${data.generatedAt}`,
    `Dibuat oleh: ${data.generatedBy}`,
    "",
    "STATISTIK",
    `- Anggota: ${data.stats.members || 0} (bulan ini: ${data.deltas.members || 0})`,
    `- Galeri: ${data.stats.galeri || 0} (bulan ini: ${data.deltas.galeri || 0})`,
    `- Inventaris: ${data.stats.inventaris || 0}`,
    `- Saran Masuk: ${data.stats.saran || 0} (bulan ini: ${data.deltas.saran || 0})`,
    "",
    "KEUANGAN",
    `- Total Pemasukan: ${fmtIDR(income)}`,
    `- Total Pengeluaran: ${fmtIDR(expense)}`,
    `- Saldo: ${fmtIDR(balance)}`,
    "",
    `PESERTA LKBB (${data.lkbbRows.length})`,
    ...data.lkbbRows.slice(0, 20).map((r) => `- ${r.school_name}: ${r.payment_status === "lunas" ? "Lunas" : r.payment_status === "dp" ? "DP" : "Belum Bayar"}`),
    "",
    `SARAN TERBARU (${data.sarans.length})`,
    ...data.sarans.slice(0, 20).map((s) => `- ${s.sender_name || "Anonim"}: ${s.message.slice(0, 100)}${s.message.length > 100 ? "…" : ""}`),
    "",
    `ARTIKEL TERBARU (${data.artikels.length})`,
    ...data.artikels.slice(0, 20).map((a) => `- ${a.title}`),
    "",
    "— Satria Cengkara Dashboard",
  ]
  const body = encodeURIComponent(lines.join("\n"))
  window.location.href = `mailto:?subject=${subject}&body=${body}`
}
