"use client"

import { useRef, useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase/client"
import { Loader2, X, Upload, FileSpreadsheet, Sparkles, Trash2, Plus, CheckCircle2 } from "lucide-react"

export interface ImportColumn {
  key: string
  label: string
  required?: boolean
  type?: "text" | "number" | "select" | "date"
  options?: string[]
}

const CATEGORIES = ["ATK", "Konsumsi", "Transport", "Peralatan", "Kostum", "Sewa", "Donasi", "Lainnya"]

export function ImportModal({
  open,
  onClose,
  type,
  title,
  description,
  columns,
  onImport,
  importing = false,
}: {
  open: boolean
  onClose: () => void
  type: "keuangan" | "anggota"
  title: string
  description: string
  columns: ImportColumn[]
  onImport: (rows: Record<string, string>[]) => Promise<void>
  importing?: boolean
}) {
  const [fileName, setFileName] = useState("")
  const [rows, setRows] = useState<Record<string, string>[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const parseFile = async (file: File) => {
    setLoading(true)
    setError("")
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const fd = new FormData()
      fd.append("file", file)
      fd.append("type", type)
      const res = await fetch("/api/import/parse", {
        method: "POST",
        headers: { Authorization: `Bearer ${session?.access_token}` },
        body: fd,
        signal: AbortSignal.timeout(35000),
      })
      const raw = await res.text()
      const data = raw ? JSON.parse(raw) : {}
      if (!res.ok || !data.rows) {
        throw new Error(
          data.error || (raw ? `Gagal membaca file (HTTP ${res.status})` : "Koneksi terputus saat memproses (server sedang restart?) — coba lagi")
        )
      }
      setRows(
        data.rows.map((r: Record<string, unknown>) =>
          Object.fromEntries(columns.map((c) => [c.key, String(r[c.key] ?? "")]))
        )
      )
    } catch (err) {
      setError(
        err instanceof Error && err.name === "TimeoutError"
          ? "Memproses terlalu lama (endpoint AI tidak merespons) — coba lagi nanti, atau gunakan file Excel/CSV yang langsung terbaca."
          : err instanceof Error
            ? err.message
            : "Gagal membaca file"
      )
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    setFileName(file.name)
    setDone(false)
    parseFile(file)
  }

  const updateCell = (index: number, key: string, value: string) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [key]: value } : r)))
  }

  const handleSave = async () => {
    const valid = rows.filter((r) => columns.every((c) => !c.required || String(r[c.key] || "").trim() !== ""))
    if (valid.length === 0) {
      setError("Tidak ada baris valid untuk disimpan.")
      return
    }
    setError("")
    try {
      await onImport(valid)
      setDone(true)
      setTimeout(() => {
        setRows([])
        setFileName("")
        setDone(false)
        onClose()
      }, 1200)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan")
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <div>
            <h3 className="font-display font-bold">{title}</h3>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-soft hover:text-foreground"
            aria-label="Tutup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {rows.length === 0 && !loading && (
            <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-line bg-soft/40 py-10">
              <FileSpreadsheet className="h-10 w-10 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm font-semibold">Pilih file Excel atau Word</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Mendukung .xlsx, .xls, .csv, .docx, .txt — AI akan membaca & menyesuaikan datanya
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <Button onClick={() => fileRef.current?.click()} className="gradient-primary text-white">
                  <Upload className="mr-2 h-4 w-4" /> Pilih File
                </Button>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center gap-3 py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Membaca file & menyesuaikan data dengan AI...
              </p>
            </div>
          )}

          {done && (
            <div className="flex flex-col items-center gap-2 py-8">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
              <p className="text-sm font-semibold text-green-500">Data berhasil disimpan!</p>
            </div>
          )}

          {rows.length > 0 && !done && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  <Sparkles className="mr-1 inline h-3.5 w-3.5 text-amber-400" />
                  AI telah menyesuaikan <span className="font-semibold text-foreground">{rows.length} baris</span> dari{" "}
                  <span className="font-medium">{fileName}</span> — periksa dan ubah bila perlu.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="border-line" onClick={() => fileRef.current?.click()}>
                    <Upload className="mr-1.5 h-3.5 w-3.5" /> Ganti File
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-line"
                    onClick={() => setRows((prev) => [...prev, Object.fromEntries(columns.map((c) => [c.key, ""]))])}
                  >
                    <Plus className="mr-1.5 h-3.5 w-3.5" /> Tambah Baris
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-line">
                <table className="w-full min-w-[640px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-line bg-soft/60">
                      <th className="px-2 py-2 font-semibold text-muted-foreground">#</th>
                      {columns.map((c) => (
                        <th key={c.key} className="px-2 py-2 font-semibold text-muted-foreground">
                          {c.label}
                          {c.required && <span className="text-red-400"> *</span>}
                        </th>
                      ))}
                      <th className="px-2 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 100).map((row, i) => (
                      <tr key={i} className="border-b border-line/50 last:border-0">
                        <td className="px-2 py-1.5 text-muted-foreground">{i + 1}</td>
                        {columns.map((c) => (
                          <td key={c.key} className="px-2 py-1.5">
                            {c.type === "select" ? (
                              <select
                                value={row[c.key]}
                                onChange={(e) => updateCell(i, c.key, e.target.value)}
                                className="h-8 w-full rounded-md border border-line bg-card px-2 text-xs"
                              >
                                {(c.options || []).map((o) => (
                                  <option key={o} value={o}>{o}</option>
                                ))}
                              </select>
                            ) : (
                              <Input
                                value={row[c.key]}
                                onChange={(e) => updateCell(i, c.key, e.target.value)}
                                type={c.type === "date" ? "date" : c.type === "number" ? "number" : "text"}
                                className="h-8 border-line bg-card text-xs"
                              />
                            )}
                          </td>
                        ))}
                        <td className="px-2 py-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setRows((prev) => prev.filter((_, j) => j !== i))}
                            aria-label="Hapus baris"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-400" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rows.length > 100 && (
                <p className="text-[11px] text-muted-foreground">
                  Menampilkan 100 dari {rows.length} baris pertama — semua baris tetap akan disimpan.
                </p>
              )}
            </>
          )}

          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3">
          <p className="hidden text-[10px] text-muted-foreground sm:block">
            Data hanya tersimpan setelah tombol Simpan diklik.
          </p>
          <div className="flex w-full gap-2 sm:w-auto">
            <Button variant="ghost" className="flex-1 border border-line sm:flex-none" onClick={onClose} disabled={loading || importing}>
              Batal
            </Button>
            <Button
              className="gradient-primary flex-1 text-white sm:flex-none"
              onClick={handleSave}
              disabled={rows.length === 0 || loading || importing || done}
            >
              {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              {importing ? "Menyimpan..." : `Simpan ${rows.length > 0 ? `(${rows.length})` : ""}`}
            </Button>
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv,.docx,.doc,.txt"
          className="hidden"
          onChange={handleFile}
        />
      </motion.div>
    </div>
  )
}
