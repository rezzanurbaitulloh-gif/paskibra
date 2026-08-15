"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase/client"
import { streamResponse } from "@/services/aiService"
import { renderMarkdown } from "@/lib/markdown"
import * as XLSX from "xlsx"
import {
  X,
  Sparkles,
  FileSpreadsheet,
  FileText,
  Download,
  Loader2,
  Wallet,
  TrendingUp,
  TrendingDown,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface FinRecord {
  id: string
  description: string
  amount: number
  type: "income" | "expense"
  category: string
  date: string
}

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
]

const fmt = (n: number) => "Rp " + Math.round(n).toLocaleString("id-ID")

export function RekapModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [records, setRecords] = useState<FinRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState<string>("all")
  const [year, setYear] = useState<string>("all")
  const [cats, setCats] = useState<string[]>([])
  const [selCats, setSelCats] = useState<string[]>([])

  const [aiMode, setAiMode] = useState(false)
  const [aiText, setAiText] = useState("")
  const [aiLoading, setAiLoading] = useState(false)

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    let q = supabase.from("financial_records").select("*").order("date", { ascending: true })
    if (month !== "all" && year !== "all") q = q.gte("date", `${year}-${month}-01`).lt("date", `${year}-${month}-31`)
    else if (month !== "all") q = q.or(`date.like.%-${month}-%`)
    else if (year !== "all") q = q.gte("date", `${year}-01-01`).lt("date", `${year + 1}-01-01`)
    const { data } = await q
    setRecords((data || []) as FinRecord[])
    setLoading(false)
  }, [month, year])

  useEffect(() => {
    if (open) fetchRecords()
  }, [open, fetchRecords])

  useEffect(() => {
    const all = [...new Set(records.map((r) => r.category).filter(Boolean))]
    setCats(all)
  }, [records])

  const years = useMemo(() => {
    const ys = [...new Set(records.map((r) => r.date?.slice(0, 4)).filter(Boolean))]
    return ys.sort().reverse()
  }, [records])

  const filtered = useMemo(
    () => (selCats.length === 0 ? records : records.filter((r) => selCats.includes(r.category))),
    [records, selCats]
  )

  const income = filtered.filter((r) => r.type === "income").reduce((s, r) => s + Number(r.amount), 0)
  const expense = filtered.filter((r) => r.type === "expense").reduce((s, r) => s + Number(r.amount), 0)

  const byCat = useMemo(() => {
    const map = new Map<string, { count: number; income: number; expense: number }>()
    for (const r of filtered) {
      const key = r.category || "Tanpa Kategori"
      const cur = map.get(key) || { count: 0, income: 0, expense: 0 }
      cur.count += 1
      if (r.type === "income") cur.income += Number(r.amount)
      else cur.expense += Number(r.amount)
      map.set(key, cur)
    }
    return [...map.entries()].sort((a, b) => b[1].expense + b[1].income - (a[1].expense + a[1].income))
  }, [filtered])

  const periodLabel = () => {
    if (month !== "all" && year !== "all") return `${MONTH_NAMES[Number(month) - 1]} ${year}`
    if (year !== "all") return `Tahun ${year}`
    return "Semua Periode"
  }

  const toggleCat = (cat: string) => {
    setSelCats((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]))
  }

  const runAiRecap = async () => {
    if (aiLoading) return
    setAiLoading(true)
    setAiText("")
    try {
      const lines = byCat
        .map(([cat, d]) => `- ${cat}: ${d.count} transaksi, masuk ${fmt(d.income)}, keluar ${fmt(d.expense)}`)
        .join("\n")
      const top = filtered.slice(0, 15)
        .map((r) => `- [${r.date}] ${r.description} (${r.category}): ${r.type === "income" ? "+" : "-"}${fmt(Number(r.amount))}`)
        .join("\n")
      const prompt = `Buatkan rekap laporan keuangan untuk ${periodLabel()} organisasi Paskibra Satria Cengkara.
Ringkasan: total pemasukan ${fmt(income)}, total pengeluaran ${fmt(expense)}, saldo ${fmt(income - expense)}, jumlah transaksi ${filtered.length}.
Rekap per kategori:
${lines}
Transaksi penting:
${top}
Tulis dalam bahasa Indonesia, format markdown dengan struktur: ## Ringkasan, ## Rincian per Kategori, ## Catatan & Saran. Gunakan **bold** untuk angka penting.`
      await streamResponse(prompt, (chunk) => setAiText((prev) => prev + chunk))
    } catch {
      setAiText("Gagal membuat rekap AI. Coba lagi nanti.")
    } finally {
      setAiLoading(false)
    }
  }

  const exportExcel = () => {
    const wb = XLSX.utils.book_new()
    const ws1 = XLSX.utils.json_to_sheet([
      { Keterangan: "Rekap Keuangan", Periode: periodLabel() },
      { Keterangan: "Total Pemasukan", Nominal: income },
      { Keterangan: "Total Pengeluaran", Nominal: expense },
      { Keterangan: "Saldo", Nominal: income - expense },
      { Keterangan: "Jumlah Transaksi", Nominal: filtered.length },
    ])
    XLSX.utils.book_append_sheet(wb, ws1, "Ringkasan")

    const ws2 = XLSX.utils.json_to_sheet(
      byCat.map(([cat, d]) => ({
        Kategori: cat,
        "Jumlah Transaksi": d.count,
        Pemasukan: d.income,
        Pengeluaran: d.expense,
        "Selisih": d.income - d.expense,
      }))
    )
    XLSX.utils.book_append_sheet(wb, ws2, "Per Kategori")

    const ws3 = XLSX.utils.json_to_sheet(
      filtered.map((r) => ({
        Tanggal: r.date,
        Deskripsi: r.description,
        Kategori: r.category,
        Jenis: r.type === "income" ? "Pemasukan" : "Pengeluaran",
        Nominal: Number(r.amount),
      }))
    )
    XLSX.utils.book_append_sheet(wb, ws3, "Detail")
    XLSX.writeFile(wb, `rekap-keuangan-${periodLabel().replace(/\s+/g, "-").toLowerCase()}.xlsx`)
  }

  const exportWord = () => {
    const rows = byCat
      .map(
        ([cat, d]) =>
          `<tr><td>${cat}</td><td>${d.count}</td><td>${fmt(d.income)}</td><td>${fmt(d.expense)}</td><td>${fmt(d.income - d.expense)}</td></tr>`
      )
      .join("")
    const details = filtered
      .map(
        (r) =>
          `<tr><td>${r.date}</td><td>${r.description}</td><td>${r.category}</td><td>${r.type === "income" ? "Pemasukan" : "Pengeluaran"}</td><td>${fmt(Number(r.amount))}</td></tr>`
      )
      .join("")
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head><meta charset="utf-8"><title>Rekap Keuangan</title></head>
<body style="font-family: Calibri, Arial, sans-serif;">
<h1>Rekap Keuangan Paskibra Satria Cengkara</h1>
<p>Periode: <b>${periodLabel()}</b></p>
<h2>Ringkasan</h2>
<table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse;">
<tr><th>Total Pemasukan</th><td>${fmt(income)}</td></tr>
<tr><th>Total Pengeluaran</th><td>${fmt(expense)}</td></tr>
<tr><th>Saldo</th><td>${fmt(income - expense)}</td></tr>
<tr><th>Jumlah Transaksi</th><td>${filtered.length}</td></tr>
</table>
<h2>Rincian per Kategori</h2>
<table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse;">
<tr><th>Kategori</th><th>Transaksi</th><th>Pemasukan</th><th>Pengeluaran</th><th>Selisih</th></tr>
${rows}
</table>
<h2>Detail Transaksi</h2>
<table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse;">
<tr><th>Tanggal</th><th>Deskripsi</th><th>Kategori</th><th>Jenis</th><th>Nominal</th></tr>
${details}
</table>
</body></html>`
    const blob = new Blob(["\ufeff", html], { type: "application/msword" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `rekap-keuangan-${periodLabel().replace(/\s+/g, "-").toLowerCase()}.doc`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-3 sm:p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.96, y: 14 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 14 }}
            className="w-full max-w-3xl rounded-2xl border border-line bg-card p-4 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-lg font-bold">Rekap Keuangan</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">Ringkasan & laporan per kategori — manual atau AI.</p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="Tutup" className="h-8 w-8 shrink-0">
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Filter */}
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Bulan</Label>
                <Select value={month} onValueChange={(v) => setMonth(v ?? "all")}>
                  <SelectTrigger className="h-9 border-line bg-soft">
                    <SelectValue placeholder="Semua Bulan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Bulan</SelectItem>
                    {MONTH_NAMES.map((m, i) => (
                      <SelectItem key={i} value={String(i + 1).padStart(2, "0")}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Tahun</Label>
                <Select value={year} onValueChange={(v) => setYear(v ?? "all")}>
                  <SelectTrigger className="h-9 border-line bg-soft">
                    <SelectValue placeholder="Semua Tahun" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Tahun</SelectItem>
                    {years.map((y) => (
                      <SelectItem key={y} value={y}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Kategori chips */}
            <div className="mt-3">
              <Label className="text-xs text-muted-foreground">
                Kategori {selCats.length > 0 ? `(${selCats.length} dipilih)` : "(semua)"}
              </Label>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelCats([])}
                  className={cn(
                    "rounded-full border px-3 py-1 text-[11px] font-medium transition-colors",
                    selCats.length === 0 ? "border-primary bg-primary/10 text-primary" : "border-line text-muted-foreground"
                  )}
                >
                  Semua
                </button>
                {cats.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCat(cat)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-[11px] font-medium transition-colors",
                      selCats.includes(cat) ? "border-primary bg-primary/10 text-primary" : "border-line text-muted-foreground"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Mode */}
            <div className="mt-4 flex gap-1.5 rounded-xl border border-line bg-soft p-1">
              <button
                type="button"
                onClick={() => setAiMode(false)}
                className={cn(
                  "flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                  !aiMode ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
                )}
              >
                Manual
              </button>
              <button
                type="button"
                onClick={() => setAiMode(true)}
                className={cn(
                  "flex items-center justify-center gap-1.5 flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                  aiMode ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
                )}
              >
                <Sparkles className="h-3.5 w-3.5 text-accent" /> AI
              </button>
            </div>

            {loading ? (
              <p className="py-10 text-center text-sm text-muted-foreground">Memuat data...</p>
            ) : filtered.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">Tidak ada transaksi pada periode ini.</p>
            ) : aiMode ? (
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-xl border border-line bg-soft p-3">
                    <p className="text-[10px] text-muted-foreground">Masuk</p>
                    <p className="mt-0.5 flex items-center gap-1 text-sm font-bold text-green-500"><TrendingUp className="h-3.5 w-3.5" /> {fmt(income)}</p>
                  </div>
                  <div className="rounded-xl border border-line bg-soft p-3">
                    <p className="text-[10px] text-muted-foreground">Keluar</p>
                    <p className="mt-0.5 flex items-center gap-1 text-sm font-bold text-red-400"><TrendingDown className="h-3.5 w-3.5" /> {fmt(expense)}</p>
                  </div>
                  <div className="rounded-xl border border-line bg-soft p-3">
                    <p className="text-[10px] text-muted-foreground">Saldo</p>
                    <p className="mt-0.5 flex items-center gap-1 text-sm font-bold"><Wallet className="h-3.5 w-3.5" /> {fmt(income - expense)}</p>
                  </div>
                </div>
                <Button
                  onClick={runAiRecap}
                  disabled={aiLoading}
                  className="w-full gradient-primary text-white"
                >
                  {aiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  {aiLoading ? "AI sedang menyusun rekap..." : "Buat Rekap AI"}
                </Button>
                {aiText && (
                  <div className="max-h-72 overflow-y-auto rounded-xl border border-line bg-soft p-4 text-sm leading-relaxed">
                    <span dangerouslySetInnerHTML={{ __html: renderMarkdown(aiText) }} />
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-xl border border-line bg-soft p-3">
                    <p className="text-[10px] text-muted-foreground">Masuk</p>
                    <p className="mt-0.5 flex items-center gap-1 text-sm font-bold text-green-500"><TrendingUp className="h-3.5 w-3.5" /> {fmt(income)}</p>
                  </div>
                  <div className="rounded-xl border border-line bg-soft p-3">
                    <p className="text-[10px] text-muted-foreground">Keluar</p>
                    <p className="mt-0.5 flex items-center gap-1 text-sm font-bold text-red-400"><TrendingDown className="h-3.5 w-3.5" /> {fmt(expense)}</p>
                  </div>
                  <div className="rounded-xl border border-line bg-soft p-3">
                    <p className="text-[10px] text-muted-foreground">Saldo</p>
                    <p className="mt-0.5 flex items-center gap-1 text-sm font-bold"><Wallet className="h-3.5 w-3.5" /> {fmt(income - expense)}</p>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-line">
                  <table className="w-full min-w-[420px] text-sm">
                    <thead>
                      <tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                        <th className="px-3 py-2.5">Kategori</th>
                        <th className="px-3 py-2.5 text-center">Transaksi</th>
                        <th className="px-3 py-2.5 text-right">Pemasukan</th>
                        <th className="px-3 py-2.5 text-right">Pengeluaran</th>
                        <th className="px-3 py-2.5 text-right">Selisih</th>
                      </tr>
                    </thead>
                    <tbody>
                      {byCat.map(([cat, d]) => (
                        <tr key={cat} className="border-b border-line/50 last:border-0">
                          <td className="px-3 py-2.5 font-medium">{cat}</td>
                          <td className="px-3 py-2.5 text-center text-muted-foreground">{d.count}</td>
                          <td className="px-3 py-2.5 text-right text-green-500">{fmt(d.income)}</td>
                          <td className="px-3 py-2.5 text-right text-red-400">{fmt(d.expense)}</td>
                          <td className="px-3 py-2.5 text-right font-semibold">{fmt(d.income - d.expense)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="text-[11px] text-muted-foreground">
                  Periode: <b>{periodLabel()}</b> • {filtered.length} transaksi
                </p>
              </div>
            )}

            {/* Export */}
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" className="border-line flex-1" onClick={exportExcel} disabled={filtered.length === 0}>
                <FileSpreadsheet className="mr-2 h-4 w-4 text-green-500" /> Export Excel
              </Button>
              <Button variant="outline" className="border-line flex-1" onClick={exportWord} disabled={filtered.length === 0}>
                <FileText className="mr-2 h-4 w-4 text-blue-500" /> Export Word
              </Button>
            </div>
            {aiMode && aiText && (
              <p className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
                <Download className="h-3 w-3" /> Rekap AI hanya tampil di layar — gunakan Export untuk file resmi.
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
