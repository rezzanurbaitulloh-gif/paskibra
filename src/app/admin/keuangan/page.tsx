"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase/client"
import * as XLSX from "xlsx"
import { Plus, Trash2, Sparkles, Download, Calendar, Wallet, TrendingUp, TrendingDown, X } from "lucide-react"
import { RequireRole } from "@/components/require-role"

interface FinancialRecord {
  id: string
  description: string
  amount: number
  type: string
  category: string
  date: string
  created_at: string
}

interface Row {
  id: string
  type: "income" | "expense"
  amount: string
  category: string
  description: string
  date: string
}

const CATEGORIES = ["Kas Rutin", "Konsumsi", "Transportasi Lomba", "Pembelian Perlengkapan", "Proposal", "Lainnya"]

const emptyRow = (): Row => ({
  id: crypto.randomUUID(),
  type: "expense",
  amount: "",
  category: "Konsumsi",
  description: "",
  date: new Date().toISOString().split("T")[0],
})

const fmt = (n: number) => "Rp " + n.toLocaleString("id-ID")

export default function KeuanganPage() {
  const [records, setRecords] = useState<FinancialRecord[]>([])
  const [month, setMonth] = useState<string>("all")
  const [year, setYear] = useState<string>("all")
  const [rows, setRows] = useState<Row[]>([])
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  // AI
  const [aiText, setAiText] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState("")
  const [aiPreview, setAiPreview] = useState<Row[] | null>(null)

  const fetchRecords = async () => {
    const { data } = await supabase.from("financial_records").select("*").order("date", { ascending: false })
    setRecords(data || [])
  }

  useEffect(() => { fetchRecords() }, [])

  const filtered = useMemo(() => {
    return records.filter((r) => {
      const d = r.date?.slice(0, 7) || ""
      if (month !== "all" && year !== "all") return d === `${year}-${month}`
      if (month !== "all") return d.endsWith(`-${month}`)
      if (year !== "all") return d.startsWith(year)
      return true
    })
  }, [records, month, year])

  const totalIncome = filtered.filter((r) => r.type === "income").reduce((s, r) => s + Number(r.amount), 0)
  const totalExpense = filtered.filter((r) => r.type === "expense").reduce((s, r) => s + Number(r.amount), 0)
  const balance = totalIncome - totalExpense

  const years = useMemo(() => {
    const set = new Set(records.map((r) => r.date?.slice(0, 4)).filter(Boolean))
    return Array.from(set).sort().reverse()
  }, [records])

  // ---- Multi-row batch ----
  const addRow = () => setRows((prev) => [...prev, emptyRow()])
  const updateRow = (id: string, patch: Partial<Row>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  const removeRow = (id: string) => setRows((prev) => prev.filter((r) => r.id !== id))

  const saveAll = async () => {
    const valid = rows.filter((r) => r.description.trim() && Number(r.amount) > 0)
    if (valid.length === 0) return
    setSaving(true)
    const { error } = await supabase.from("financial_records").insert(
      valid.map((r) => ({
        description: r.description.trim(),
        amount: Number(r.amount),
        type: r.type,
        category: r.category,
        date: r.date,
      }))
    )
    setSaving(false)
    if (!error) {
      setRows([])
      setShowForm(false)
      fetchRecords()
    }
  }

  const handleDelete = async (id: string) => {
    await supabase.from("financial_records").delete().eq("id", id)
    fetchRecords()
  }

  // ---- AI Parser + Review Modal ----
  const runAiParse = async () => {
    if (!aiText.trim()) return
    setAiLoading(true)
    setAiError("")
    try {
      const response = await fetch("/api/financial/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: aiText }),
      })
      const data = await response.json()
      if (!response.ok || !data.records) {
        setAiError(data.error || "AI gagal mengurai teks")
        return
      }
      const parsed: Row[] = data.records.map((r: { description: string; amount: number; type: string; category: string; date: string }) => ({
        id: crypto.randomUUID(),
        type: r.type === "income" ? "income" : "expense",
        amount: String(r.amount),
        category: CATEGORIES.includes(r.category) ? r.category : "Lainnya",
        description: r.description,
        date: r.date || new Date().toISOString().split("T")[0],
      }))
      setAiPreview(parsed)
    } catch {
      setAiError("Terjadi kesalahan jaringan")
    } finally {
      setAiLoading(false)
    }
  }

  const applyAiPreview = () => {
    if (aiPreview) setRows((prev) => [...prev, ...aiPreview])
    setAiPreview(null)
    setAiText("")
    setShowForm(true)
  }

  // ---- Export Excel ----
  const exportExcel = () => {
    const data = filtered.map((r) => ({
      Tanggal: r.date,
      Deskripsi: r.description,
      Kategori: r.category,
      Jenis: r.type === "income" ? "Pemasukan" : "Pengeluaran",
      Nominal: Number(r.amount),
    }))
    data.push({
      Tanggal: "",
      Deskripsi: "TOTAL",
      Kategori: "",
      Jenis: "",
      Nominal: balance,
    })
    const ws = XLSX.utils.json_to_sheet(data)
    ws["!cols"] = [{ wch: 12 }, { wch: 40 }, { wch: 22 }, { wch: 12 }, { wch: 15 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Rekap Keuangan")
    const label = month !== "all" && year !== "all" ? `${year}-${month}` : "semua"
    XLSX.writeFile(wb, `rekap-keuangan-${label}.xlsx`)
  }

  return (
    <RequireRole path="/admin/keuangan">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <h1 className="font-display text-2xl font-bold md:text-3xl">Keuangan</h1>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="border-line" onClick={exportExcel} disabled={filtered.length === 0}>
              <Download className="mr-2 h-4 w-4" /> Export Excel
            </Button>
            <Button onClick={() => setShowForm(true)} className="gradient-primary text-white flex-1 sm:flex-none">
              <Plus className="mr-2 h-4 w-4" /> Tambah Catatan Kas
            </Button>
          </div>
        </div>

        {/* Ringkasan */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-line bg-card p-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Wallet className="h-4 w-4" /> Total Kas
            </div>
            <p className="mt-2 font-display text-2xl font-bold">{fmt(balance)}</p>
          </div>
          <div className="rounded-2xl border border-line bg-card p-5">
            <div className="flex items-center gap-2 text-sm text-green-500">
              <TrendingUp className="h-4 w-4" /> Pemasukan
            </div>
            <p className="mt-2 font-display text-2xl font-bold text-green-500">+ {fmt(totalIncome)}</p>
          </div>
          <div className="rounded-2xl border border-line bg-card p-5">
            <div className="flex items-center gap-2 text-sm text-red-400">
              <TrendingDown className="h-4 w-4" /> Pengeluaran
            </div>
            <p className="mt-2 font-display text-2xl font-bold text-red-400">- {fmt(totalExpense)}</p>
          </div>
        </div>

        {/* Filter bulan/tahun */}
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-card p-4">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select value={month} onValueChange={(v) => setMonth(v ?? "all")}>
            <SelectTrigger className="w-40 border-line bg-soft">
              <SelectValue placeholder="Semua Bulan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Bulan</SelectItem>
              {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map((m) => (
                <SelectItem key={m} value={m}>Bulan {m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={year} onValueChange={(v) => setYear(v ?? "all")}>
            <SelectTrigger className="w-32 border-line bg-soft">
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

        {/* Form Multi-Row Batch */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="space-y-4 rounded-2xl border border-line bg-card p-5"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold">Catatan Kas Baru</h2>
                <Button variant="ghost" size="icon" onClick={() => setShowForm(false)} aria-label="Tutup">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* AI Smart Entry */}
              <div className="rounded-xl border border-dashed border-line bg-soft p-4">
                <Label className="text-xs text-muted-foreground">AI Smart Entry — ketik transaksi bebas, contoh: "1. Pemasukan kas 100rb, 2. Beli air 20rb"</Label>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <Input
                    value={aiText}
                    onChange={(e) => setAiText(e.target.value)}
                    placeholder="Pemasukan kas 100rb, beli konsumsi 50rb, sewa baju 75rb..."
                    className="h-10 flex-1 border-line bg-soft"
                  />
                  <Button onClick={runAiParse} disabled={aiLoading || !aiText.trim()} className="h-10 gradient-gold text-black">
                    <Sparkles className="mr-2 h-4 w-4" />
                    {aiLoading ? "Mengurai..." : "Parse dengan AI"}
                  </Button>
                </div>
                {aiError && <p className="mt-2 text-xs text-red-400">{aiError}</p>}
              </div>

              {/* Baris transaksi */}
              {rows.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Belum ada baris transaksi. Tambahkan baris atau gunakan AI Smart Entry di atas.
                </p>
              )}

              <div className="space-y-3">
                {rows.map((row) => (
                  <div key={row.id} className="grid grid-cols-1 gap-2 rounded-xl border border-line bg-soft p-3 md:grid-cols-[110px_130px_170px_1fr_150px_40px]">
                    <Select value={row.type} onValueChange={(v) => updateRow(row.id, { type: v as Row["type"] })}>
                      <SelectTrigger className="h-9 border-line bg-card">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income" className="text-green-500">Pemasukan</SelectItem>
                        <SelectItem value="expense" className="text-red-400">Pengeluaran</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min={0}
                      placeholder="Nominal"
                      value={row.amount}
                      onChange={(e) => updateRow(row.id, { amount: e.target.value })}
                      className="h-9 border-line bg-card"
                    />
                    <Select value={row.category ?? ""} onValueChange={(v) => updateRow(row.id, { category: v ?? "" })}>
                      <SelectTrigger className="h-9 border-line bg-card">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Keterangan (berapa & untuk apa)"
                      value={row.description}
                      onChange={(e) => updateRow(row.id, { description: e.target.value })}
                      className="h-9 border-line bg-card"
                    />
                    <Input
                      type="date"
                      value={row.date}
                      onChange={(e) => updateRow(row.id, { date: e.target.value })}
                      className="h-9 border-line bg-card"
                    />
                    <Button variant="ghost" size="icon" onClick={() => removeRow(row.id)} aria-label="Hapus baris">
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button variant="outline" className="border-line" onClick={addRow}>
                  <Plus className="mr-2 h-4 w-4" /> Tambah Baris Transaksi
                </Button>
                <Button
                  onClick={saveAll}
                  disabled={saving || rows.filter((r) => r.description.trim() && Number(r.amount) > 0).length === 0}
                  className="gradient-primary text-white"
                >
                  {saving ? "Menyimpan..." : `Simpan Semua Transaksi (${rows.filter((r) => r.description.trim() && Number(r.amount) > 0).length})`}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Review Modal AI */}
        <AnimatePresence>
          {aiPreview && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
              onClick={() => setAiPreview(null)}
            >
              <motion.div
                initial={{ scale: 0.95, y: 12 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 12 }}
                className="w-full max-w-2xl rounded-2xl border border-line bg-card p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="font-display text-lg font-bold">Review Hasil AI</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Periksa dan revisi data di bawah sebelum ditambahkan ke form.
                </p>
                <div className="mt-4 max-h-[50vh] space-y-3 overflow-y-auto pr-1">
                  {aiPreview.map((row) => (
                    <div key={row.id} className="grid grid-cols-1 gap-2 rounded-xl border border-line bg-soft p-3 md:grid-cols-[110px_130px_170px_1fr]">
                      <Select value={row.type} onValueChange={(v) => setAiPreview((prev) => prev!.map((r) => (r.id === row.id ? { ...r, type: v as Row["type"] } : r)))}>
                        <SelectTrigger className="h-9 border-line bg-card"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="income" className="text-green-500">Pemasukan</SelectItem>
                          <SelectItem value="expense" className="text-red-400">Pengeluaran</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        min={0}
                        value={row.amount}
                        onChange={(e) => setAiPreview((prev) => prev!.map((r) => (r.id === row.id ? { ...r, amount: e.target.value } : r)))}
                        className="h-9 border-line bg-card"
                      />
                      <Select value={row.category ?? ""} onValueChange={(v) => setAiPreview((prev) => prev!.map((r) => (r.id === row.id ? { ...r, category: v ?? "" } : r)))}>
                        <SelectTrigger className="h-9 border-line bg-card"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        value={row.description}
                        onChange={(e) => setAiPreview((prev) => prev!.map((r) => (r.id === row.id ? { ...r, description: e.target.value } : r)))}
                        className="h-9 border-line bg-card"
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex justify-end gap-2">
                  <Button variant="outline" className="border-line" onClick={() => setAiPreview(null)}>Batal</Button>
                  <Button className="gradient-primary text-white" onClick={applyAiPreview}>
                    Tambahkan ke Form ({aiPreview.length})
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Riwayat */}
        <div className="overflow-x-auto rounded-2xl border border-line bg-card">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-muted-foreground">
                <th className="p-4 font-medium">Tanggal</th>
                <th className="p-4 font-medium">Keterangan</th>
                <th className="p-4 font-medium">Kategori</th>
                <th className="p-4 font-medium">Pemasukan</th>
                <th className="p-4 font-medium">Pengeluaran</th>
                <th className="p-4 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-sm text-muted-foreground">
                    Belum ada catatan kas. Mulai dengan "+ Tambah Catatan Kas".
                  </td>
                </tr>
              )}
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-line/60 last:border-0 hover:bg-soft">
                  <td className="p-4 whitespace-nowrap text-muted-foreground">{r.date}</td>
                  <td className="p-4">{r.description}</td>
                  <td className="p-4 text-muted-foreground">{r.category}</td>
                  <td className="p-4 font-medium text-green-500">
                    {r.type === "income" ? `+ ${fmt(Number(r.amount))}` : "-"}
                  </td>
                  <td className="p-4 font-medium text-red-400">
                    {r.type === "expense" ? `- ${fmt(Number(r.amount))}` : "-"}
                  </td>
                  <td className="p-4 text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)} aria-label="Hapus">
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </RequireRole>
  )
}