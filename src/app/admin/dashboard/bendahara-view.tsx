"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Plus,
  Download,
  FileText,
  PieChart,
  ArrowRight,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"

const fmtIDR = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n)

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]

interface FinRecord {
  id: string
  description: string
  amount: number
  type: "income" | "expense"
  category: string
  date: string
  created_at: string
}

export function BendaharaView() {
  const { user } = useAuth()
  const [records, setRecords] = useState<FinRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("financial_records")
        .select("*")
        .order("date", { ascending: false })
        .limit(200)
      setRecords(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const now = new Date()
  const monthKey = now.toISOString().slice(0, 7)

  const monthRecords = records.filter((r) => (r.date || "").startsWith(monthKey))
  const monthIncome = monthRecords.filter((r) => r.type === "income").reduce((s, r) => s + Number(r.amount), 0)
  const monthExpense = monthRecords.filter((r) => r.type === "expense").reduce((s, r) => s + Number(r.amount), 0)
  const totalIncome = records.filter((r) => r.type === "income").reduce((s, r) => s + Number(r.amount), 0)
  const totalExpense = records.filter((r) => r.type === "expense").reduce((s, r) => s + Number(r.amount), 0)
  const balance = totalIncome - totalExpense

  const monthly = MONTHS.map((m, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    const recs = records.filter((r) => (r.date || "").startsWith(key))
    return {
      m: MONTHS[d.getMonth()],
      inc: recs.filter((r) => r.type === "income").reduce((s, r) => s + Number(r.amount), 0),
      exp: recs.filter((r) => r.type === "expense").reduce((s, r) => s + Number(r.amount), 0),
    }
  })
  const maxMonth = Math.max(1, ...monthly.map((m) => Math.max(m.inc, m.exp)))

  const expenseByCat: Record<string, number> = {}
  for (const r of records) {
    if (r.type === "expense") expenseByCat[r.category] = (expenseByCat[r.category] || 0) + Number(r.amount)
  }
  const topCats = Object.entries(expenseByCat).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const maxCat = Math.max(1, ...topCats.map(([, v]) => v))

  const name = (user?.user_metadata?.name as string) || (user?.email?.split("@")[0] || "Admin").replace(/[._-]/g, " ")
  const today = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold md:text-3xl">Dashboard Bendahara 🧮</h1>
          <p className="mt-1 text-xs text-muted-foreground">{today} — Ringkasan kas Paskibra Satria Cengkara.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/keuangan">
            <Button size="sm" className="h-9 gradient-primary text-white">
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Catat Transaksi
            </Button>
          </Link>
          <Link href="/admin/keuangan">
            <Button variant="outline" size="sm" className="h-9">
              <Download className="mr-1.5 h-3.5 w-3.5" /> Laporan
            </Button>
          </Link>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl gradient-primary p-6 text-white shadow-glow-red md:p-8"
      >
        <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/80">
              <Sparkles className="h-3.5 w-3.5" /> Saldo Kas Saat Ini
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold md:text-4xl">{loading ? "..." : fmtIDR(balance)}</h2>
            <p className="mt-1 max-w-lg text-xs text-white/85 md:text-sm">
              {monthRecords.length} transaksi bulan ini — masuk {fmtIDR(monthIncome)}, keluar {fmtIDR(monthExpense)}.
            </p>
          </div>
          <Link
            href="/admin/keuangan"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-primary shadow transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Kelola Keuangan <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Pemasukan Bulan Ini", value: monthIncome, icon: TrendingUp, color: "text-green-500" },
          { label: "Pengeluaran Bulan Ini", value: monthExpense, icon: TrendingDown, color: "text-red-400" },
          { label: "Total Kas Masuk", value: totalIncome, icon: Wallet, color: "text-accent" },
        ].map((c) => (
          <Card key={c.label} className="p-5">
            <div className="flex items-start justify-between">
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl bg-soft", c.color)}>
                <c.icon className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-4 font-display text-xl font-bold">{loading ? "..." : fmtIDR(c.value)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{c.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-sm font-bold">Arus Kas 6 Bulan</h3>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Pemasukan vs Pengeluaran</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-primary" /> Masuk</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-foreground/20" /> Keluar</span>
            </div>
          </div>
          <div className="mt-5 flex h-40 items-end gap-3">
            {monthly.map((m) => (
              <div key={m.m} className="flex flex-1 flex-col items-center gap-1.5">
                <div className="flex w-full flex-1 items-end justify-center gap-1">
                  <div className="w-3 rounded-t-md bg-primary/80" style={{ height: `${Math.max(2, (m.inc / maxMonth) * 100)}%` }} title={`Masuk: ${fmtIDR(m.inc)}`} />
                  <div className="w-3 rounded-t-md bg-foreground/20" style={{ height: `${Math.max(2, (m.exp / maxMonth) * 100)}%` }} title={`Keluar: ${fmtIDR(m.exp)}`} />
                </div>
                <span className="text-[10px] text-muted-foreground">{m.m}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-sm font-bold">Kategori Pengeluaran</h3>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Total pengeluaran per kategori</p>
            </div>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-5 space-y-4">
            {topCats.length === 0 && <p className="py-8 text-center text-xs text-muted-foreground">Belum ada data pengeluaran.</p>}
            {topCats.map(([cat, val]) => (
              <div key={cat}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">{cat}</span>
                  <span className="text-muted-foreground">{fmtIDR(val)}</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-soft">
                  <div className="h-full rounded-full gradient-primary" style={{ width: `${Math.max(4, (val / maxCat) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <h3 className="font-display text-sm font-bold">Transaksi Terakhir</h3>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Catatan keuangan paling baru</p>
          </div>
          <Link href="/admin/keuangan" className="flex items-center gap-0.5 text-[11px] font-medium text-foreground hover:underline">
            Kelola keuangan <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="border-t border-line">
          {!loading && records.length === 0 && (
            <p className="px-5 py-10 text-center text-xs text-muted-foreground">Belum ada transaksi tercatat.</p>
          )}
          {records.slice(0, 6).map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-3 border-b border-line/50 px-5 py-3 last:border-0">
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold">{r.description}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {new Date(r.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })} • {r.category}
                </p>
              </div>
              <span className={cn("shrink-0 text-xs font-bold", r.type === "income" ? "text-green-500" : "text-red-400")}>
                {r.type === "income" ? "+" : "−"}{fmtIDR(Number(r.amount))}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex items-center gap-3 rounded-xl border border-line bg-card p-4 text-xs text-muted-foreground">
        <FileText className="h-4 w-4 shrink-0 text-accent" />
        Fitur lengkap (AI rekap kas, import/export Excel, filter) tersedia di halaman Keuangan.
        <Link href="/admin/keuangan" className="ml-auto shrink-0 font-medium text-foreground hover:underline">Buka Keuangan →</Link>
      </div>
    </div>
  )
}
