"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import {
  Users,
  Image as ImageIcon,
  Package,
  MessageSquare,
  ArrowUpRight,
  Download,
  TrendingUp,
  TrendingDown,
  Sparkles,
  DollarSign,
  FileText,
  ArrowRight,
  Trophy,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useAdmin } from "@/contexts/AdminContext"
import { BendaharaView } from "./bendahara-view"
import { HumasView } from "./humas-view"

interface Stat {
  label: string
  value: number
  delta: number
  icon: typeof Users
  href: string
}

interface SaranRow {
  id: string
  sender_name: string | null
  message: string
  created_at: string
  admin_reply: string | null
}

interface ArtikelRow {
  id: string
  title: string
  slug: string
  created_at: string
}

const fmtIDR = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n)

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]

function LiveClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
  let tzAbbr = tz
  try {
    const sample = new Intl.DateTimeFormat("id-ID", { timeZone: tz, timeZoneName: "short" }).format(now)
    tzAbbr = sample.replace(/[\d.,\s]+$/g, "") || tz
  } catch {
    /* biarkan nama zona */
  }

  const time = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })
  const date = now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })

  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-card px-3 py-2">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
      </span>
      <div className="leading-tight">
        <p className="font-display text-sm font-bold tabular-nums tracking-tight">{time}</p>
        <p className="text-[10px] text-muted-foreground">
          {date} • {tzAbbr}
        </p>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const { role } = useAdmin()
  if (role === "bendahara") return <BendaharaView />
  if (role === "humas") return <HumasView />

  const { user } = useAuth()
  const [stats, setStats] = useState<Record<string, number>>({})
  const [deltas, setDeltas] = useState<Record<string, number>>({})
  const [sarans, setSarans] = useState<SaranRow[]>([])
  const [artikels, setArtikels] = useState<ArtikelRow[]>([])
  const [finRowsAll, setFinRowsAll] = useState<{ date: string; type: string; amount: number }[]>([])
  const [finPeriod, setFinPeriod] = useState("30hari")
  const [galCategories, setGalCategories] = useState<{ name: string; count: number }[]>([])
  const [genData, setGenData] = useState<{ name: string; count: number }[]>([])
  const [yearData, setYearData] = useState<{ year: string; count: number }[]>([])
  const [lkbbRows, setLkbbRows] = useState<{ school_name: string; payment_status: string; amount: number; created_at: string }[]>([])

  useEffect(() => {
    const load = async () => {
      const now = new Date()
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString()

      const [
        { count: totalMembers, error: em },
        { count: monthMembers, error: emm },
        { count: totalGal, error: eg },
        { count: monthGal, error: egm },
        { count: totalInv, error: ei },
        { count: totalSaran, error: es },
        { count: monthSaran, error: esm },
        { data: galRows },
        { data: saranRows },
        { data: artikelRows },
        { data: finRows },
        { data: genRows },
        { data: lkbbRows },
      ] = await Promise.all([
        supabase.from("structure_members").select("id", { count: "exact", head: true }),
        supabase.from("structure_members").select("id", { count: "exact", head: true }).gte("created_at", firstOfMonth),
        supabase.from("gallery").select("id", { count: "exact", head: true }),
        supabase.from("gallery").select("id", { count: "exact", head: true }).gte("created_at", firstOfMonth),
        supabase.from("inventory").select("id", { count: "exact", head: true }),
        supabase.from("feedbacks").select("id", { count: "exact", head: true }),
        supabase.from("feedbacks").select("id", { count: "exact", head: true }).gte("created_at", firstOfMonth),
        supabase.from("gallery").select("category"),
        supabase.from("feedbacks").select("id, sender_name, message, created_at, admin_reply").order("created_at", { ascending: false }).limit(5),
        supabase.from("articles").select("id, title, slug, created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("financial_records").select("date, type, amount").order("date", { ascending: false }),
        supabase.from("structure_members").select("generation"),
        supabase.from("lkbb_participants").select("school_name, payment_status, amount, created_at").order("created_at", { ascending: false }).limit(5),
      ])

      if (!em && !emm) setDeltas((d) => ({ ...d, members: monthMembers || 0 }))
      if (!eg && !egm) setDeltas((d) => ({ ...d, galeri: monthGal || 0 }))
      if (!es && !esm) setDeltas((d) => ({ ...d, saran: monthSaran || 0 }))
      setStats({ members: totalMembers || 0, galeri: totalGal || 0, inventaris: totalInv || 0, saran: totalSaran || 0 })
      if (ei) console.error(ei.message)

      if (galRows) {
        const map: Record<string, number> = {}
        for (const r of galRows) map[r.category] = (map[r.category] || 0) + 1
        setGalCategories(Object.entries(map).map(([name, count]) => ({ name, count })))
      }
        setSarans(saranRows || [])
        setArtikels(artikelRows || [])

        if (genRows) {
          const genMap: Record<string, number> = {}
          const yearMap: Record<string, number> = {}
          for (const r of genRows as { generation: string }[]) {
            const g = (r.generation || "").trim()
            if (!g) continue
            genMap[g] = (genMap[g] || 0) + 1
            const num = g.match(/(\d+)/)?.[1]
            if (num) {
              const year = num.length >= 4 ? num : `20${num.slice(-2)}`
              yearMap[year] = (yearMap[year] || 0) + 1
            }
          }
          setGenData(
            Object.entries(genMap)
              .map(([name, count]) => ({ name, count }))
              .sort((a, b) => a.name.localeCompare(b.name))
          )
          setYearData(
            Object.entries(yearMap)
              .map(([year, count]) => ({ year, count }))
              .sort((a, b) => a.year.localeCompare(b.year))
          )
        }

      if (finRows) {
        setFinRowsAll(finRows as { date: string; type: string; amount: number }[])
      }

      setLkbbRows(lkbbRows || [])
    }
    load()
  }, [])

  const name =
    user?.user_metadata?.name?.trim() ||
    (user?.email?.split("@")[0] || "Admin").replace(/[._-]/g, " ")
  const today = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })

  const statCards: Stat[] = [
    { label: "Anggota", value: stats.members || 0, delta: deltas.members || 0, icon: Users, href: "/admin/pengurus" },
    { label: "Galeri", value: stats.galeri || 0, delta: deltas.galeri || 0, icon: ImageIcon, href: "/admin/galeri" },
    { label: "Inventaris", value: stats.inventaris || 0, delta: 0, icon: Package, href: "/admin/inventaris" },
    { label: "Saran Masuk", value: stats.saran || 0, delta: deltas.saran || 0, icon: MessageSquare, href: "/admin/saran" },
  ]

  const lkbbTotal = lkbbRows.length
  const lkbbDp = lkbbRows.filter((r) => r.payment_status === "dp").length
  const lkbbLunas = lkbbRows.filter((r) => r.payment_status === "lunas").length
  const lkbbTransfer = lkbbRows
    .filter((r) => r.payment_status !== "belum")
    .reduce((sum, r) => sum + (Number(r.amount) || 0), 0)

  const monthKey = new Date().toLocaleDateString("en-CA").slice(0, 7)
  const monthIncome = finRowsAll
    .filter((r) => r.type === "income" && String(r.date).startsWith(monthKey))
    .reduce((sum, r) => sum + Number(r.amount), 0)
  const monthExpense = finRowsAll
    .filter((r) => r.type === "expense" && String(r.date).startsWith(monthKey))
    .reduce((sum, r) => sum + Number(r.amount), 0)

  const monthOptions = Array.from(
    new Set(finRowsAll.map((r) => String(r.date).slice(0, 7)))
  ).sort((a, b) => b.localeCompare(a))

  const chart = (() => {
    const now = new Date()
    if (finPeriod === "all") {
      const map = new Map<string, { key: string; label: string; inc: number; exp: number }>()
      for (const r of finRowsAll) {
        const mk = String(r.date).slice(0, 7)
        if (!map.has(mk)) {
          const [y, m] = mk.split("-").map(Number)
          map.set(mk, { key: mk, label: MONTHS[m - 1], inc: 0, exp: 0 })
        }
        const cur = map.get(mk)!
        if (r.type === "income") cur.inc += Number(r.amount)
        else cur.exp += Number(r.amount)
      }
      return { title: "Semua Periode", bars: Array.from(map.values()) }
    }
    if (finPeriod === "30hari") {
      const bars: { key: string; label: string; inc: number; exp: number }[] = []
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
        bars.push({ key: d.toLocaleDateString("en-CA"), label: String(d.getDate()), inc: 0, exp: 0 })
      }
      for (const r of finRowsAll) {
        const idx = bars.findIndex((m) => m.key === String(r.date).slice(0, 10))
        if (idx >= 0) {
          if (r.type === "income") bars[idx].inc += Number(r.amount)
          else bars[idx].exp += Number(r.amount)
        }
      }
      return { title: "30 Hari Terakhir", bars }
    }
    const [y, m] = finPeriod.split("-").map(Number)
    const days = new Date(y, m, 0).getDate()
    const bars: { key: string; label: string; inc: number; exp: number }[] = []
    for (let d = 1; d <= days; d++) {
      const key = `${finPeriod}-${String(d).padStart(2, "0")}`
      bars.push({ key, label: String(d), inc: 0, exp: 0 })
    }
    for (const r of finRowsAll) {
      const idx = bars.findIndex((b) => b.key === String(r.date).slice(0, 10))
      if (idx >= 0) {
        if (r.type === "income") bars[idx].inc += Number(r.amount)
        else bars[idx].exp += Number(r.amount)
      }
    }
    return { title: MONTHS[m - 1] + " " + y, bars }
  })()

  const maxDay = Math.max(1, ...chart.bars.map((m) => Math.max(m.inc, m.exp)))
  const maxCat = Math.max(1, ...galCategories.map((c) => c.count))
  const maxGen = Math.max(1, ...genData.map((g) => g.count))
  const maxYear = Math.max(1, ...yearData.map((y) => y.count))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold md:text-3xl">
            Selamat Datang, {name} 👋
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">{today} — Ringkasan kegiatan Paskibra Satria Cengkara.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <LiveClock />
          <Button variant="outline" size="sm" className="h-9">
            <Download className="mr-1.5 h-3.5 w-3.5" /> Unduh
          </Button>
        </div>
      </div>

      {/* Banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl gradient-primary p-6 text-white shadow-glow-red md:p-8"
      >
        <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute right-24 -bottom-20 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/80">
              <Sparkles className="h-3.5 w-3.5" /> Selamat datang di dashboard
            </p>
            <h2 className="mt-2 font-display text-xl font-bold md:text-2xl">
              {stats.galeri || 0} Album & {stats.members || 0} Anggota Aktif 🎉
            </h2>
            <p className="mt-1 max-w-lg text-xs text-white/85 md:text-sm">
              {deltas.saran || 0} saran masuk bulan ini, {deltas.galeri || 0} dokumentasi baru, dan{" "}
              {stats.inventaris || 0} perlengkapan terdaftar. Kelola semuanya dari sini.
            </p>
          </div>
          <Link
            href="/admin/galeri"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-primary shadow transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Lihat Galeri <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.label} className="group p-5 transition-colors hover:border-ring/40">
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-soft">
                <card.icon className="h-5 w-5 text-foreground" />
              </div>
              {card.delta > 0 ? (
                <span className="flex items-center gap-0.5 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-semibold text-green-500">
                  <TrendingUp className="h-3 w-3" /> +{card.delta} bln ini
                </span>
              ) : (
                card.label === "Inventaris" && (
                  <span className="flex items-center gap-0.5 rounded-full bg-soft px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    Total
                  </span>
                )
              )}
            </div>
            <p className="mt-4 font-display text-2xl font-bold">{card.value}</p>
            <div className="mt-1 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{card.label}</p>
              <Link
                href={card.href}
                className="flex items-center gap-0.5 text-[10px] font-medium text-foreground opacity-60 transition-opacity group-hover:opacity-100"
              >
                Lihat <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </Card>
        ))}
      </div>

      {/* LKBB */}
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-accent" />
            <h3 className="font-display text-sm font-bold">Peserta LKBB</h3>
          </div>
          <Link
            href="/admin/lomba"
            className="flex items-center gap-0.5 text-xs font-medium text-foreground opacity-60 transition-opacity hover:opacity-100"
          >
            Kelola Peserta <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-xl border border-line bg-soft/50 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Total Terdaftar
            </p>
            <p className="mt-1.5 font-display text-xl font-bold">{lkbbTotal}</p>
          </div>
          <div className="rounded-xl border border-line bg-soft/50 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-500">DP</p>
            <p className="mt-1.5 font-display text-xl font-bold">{lkbbDp}</p>
          </div>
          <div className="rounded-xl border border-line bg-soft/50 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-500">
              Lunas
            </p>
            <p className="mt-1.5 font-display text-xl font-bold">{lkbbLunas}</p>
          </div>
          <div className="rounded-xl border border-line bg-soft/50 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Total Transfer Masuk
            </p>
            <p className="mt-1.5 font-display text-xl font-bold text-emerald-500">
              {"Rp " + lkbbTransfer.toLocaleString("id-ID")}
            </p>
          </div>
        </div>
        {lkbbRows.length > 0 ? (
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {lkbbRows.map((r) => (
              <div
                key={r.school_name + r.created_at}
                className="flex items-center justify-between gap-2 rounded-lg border border-line bg-soft/50 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold">{r.school_name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString("id-ID")}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    r.payment_status === "lunas" && "bg-emerald-500/15 text-emerald-500",
                    r.payment_status === "dp" && "bg-amber-500/15 text-amber-500",
                    r.payment_status === "belum" && "bg-muted text-muted-foreground"
                  )}
                >
                  {r.payment_status === "lunas"
                    ? "Lunas"
                    : r.payment_status === "dp"
                      ? "DP"
                      : "Belum"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-xs text-muted-foreground">
            Belum ada peserta terdaftar. Tambahkan di menu <b>Peserta LKBB</b>.
          </p>
        )}
      </Card>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-display text-sm font-bold">Keuangan — {chart.title}</h3>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Pemasukan vs Pengeluaran</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={finPeriod}
                onChange={(e) => setFinPeriod(e.target.value)}
                className="h-8 rounded-lg border border-line bg-card px-2 text-xs"
                aria-label="Pilih periode keuangan"
              >
                <option value="30hari">30 Hari Terakhir</option>
                {monthOptions.map((mk) => {
                  const [y, m] = mk.split("-").map(Number)
                  return (
                    <option key={mk} value={mk}>
                      {MONTHS[m - 1]} {y}
                    </option>
                  )
                })}
                <option value="all">Semua Periode</option>
              </select>
              <div className="hidden items-center gap-3 text-[10px] text-muted-foreground sm:flex">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-primary" /> Masuk</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-foreground/20" /> Keluar</span>
              </div>
            </div>
          </div>
          {chart.bars.length === 0 ? (
            <p className="py-14 text-center text-xs text-muted-foreground">Belum ada data keuangan pada periode ini.</p>
          ) : (
            <div className="mt-5 flex h-40 items-end gap-[3px]">
              {chart.bars.map((m, i) => (
                <div key={m.key} className="flex flex-1 flex-col items-center gap-1">
                  <div className="flex w-full flex-1 items-end justify-center gap-[2px]">
                    <div
                      className="w-[45%] max-w-2 rounded-t-sm bg-primary/80 transition-all"
                      style={{ height: `${Math.max(2, (m.inc / maxDay) * 100)}%` }}
                      title={`${m.key} — Masuk: ${fmtIDR(m.inc)}`}
                    />
                    <div
                      className="w-[45%] max-w-2 rounded-t-sm bg-foreground/20 transition-all"
                      style={{ height: `${Math.max(2, (m.exp / maxDay) * 100)}%` }}
                      title={`${m.key} — Keluar: ${fmtIDR(m.exp)}`}
                    />
                  </div>
                  <span className="text-[8px] leading-none text-muted-foreground">
                    {finPeriod === "all"
                      ? m.label
                      : i % 5 === 0 || i === chart.bars.length - 1
                        ? m.label
                        : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4">
            <div>
              <p className="text-[10px] text-muted-foreground">Masuk bulan ini</p>
              <p className="mt-0.5 flex items-center gap-1 text-sm font-bold text-green-500">
                {fmtIDR(monthIncome)} <TrendingUp className="h-3.5 w-3.5" />
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Keluar bulan ini</p>
              <p className="mt-0.5 flex items-center gap-1 text-sm font-bold text-red-400">
                {fmtIDR(monthExpense)} <TrendingDown className="h-3.5 w-3.5" />
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-sm font-bold">Galeri per Kategori</h3>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Distribusi dokumentasi kegiatan</p>
            </div>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-5 space-y-4">
            {galCategories.length === 0 && (
              <p className="py-10 text-center text-xs text-muted-foreground">Belum ada data galeri.</p>
            )}
            {galCategories.map((c) => (
              <div key={c.name}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">{c.name}</span>
                  <span className="text-muted-foreground">{c.count}</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-soft">
                  <div
                    className="h-full rounded-full gradient-primary transition-all"
                    style={{ width: `${Math.max(4, (c.count / maxCat) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
            <p className="text-[11px] text-muted-foreground">Total {stats.galeri || 0} item</p>
            <Link href="/admin/galeri" className="text-[11px] font-medium text-foreground hover:underline">
              Kelola galeri →
            </Link>
          </div>
        </Card>
      </div>

      {/* Anggota per Tahun & Generasi */}
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-sm font-bold">Anggota per Tahun & Generasi</h3>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Komposisi anggota berdasarkan data anggota pengurus
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg border border-line bg-soft px-3 py-1.5 text-[11px] font-semibold">
              Total Anggota: {stats.members || 0}
            </span>
            <span className="rounded-lg border border-line bg-soft px-3 py-1.5 text-[11px] font-semibold">
              Total Generasi: {genData.length}
            </span>
          </div>
        </div>

        {yearData.length === 0 && genData.length === 0 ? (
          <p className="py-10 text-center text-xs text-muted-foreground">
            Belum ada data anggota.
          </p>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Total Anggota per Tahun</p>
              {yearData.length === 0 ? (
                <p className="py-6 text-center text-[11px] text-muted-foreground">Belum ada data.</p>
              ) : (
                <div className="mt-3 space-y-3">
                  {yearData.map((y) => (
                    <div key={y.year}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">{y.year}</span>
                        <span className="text-muted-foreground">{y.count} anggota</span>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-soft">
                        <div
                          className="h-full rounded-full gradient-primary transition-all"
                          style={{ width: `${Math.max(4, (y.count / maxYear) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground">Total Anggota per Generasi</p>
              {genData.length === 0 ? (
                <p className="py-6 text-center text-[11px] text-muted-foreground">Belum ada data.</p>
              ) : (
                <div className="mt-3 space-y-3">
                  {genData.map((g) => (
                    <div key={g.name}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">{g.name}</span>
                        <span className="text-muted-foreground">{g.count} anggota</span>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-soft">
                        <div
                          className="h-full rounded-full gradient-gold transition-all"
                          style={{ width: `${Math.max(4, (g.count / maxGen) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Tables row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <h3 className="font-display text-sm font-bold">Saran Terbaru</h3>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Masukan dari pengunjung</p>
            </div>
            <Link href="/admin/saran" className="text-[11px] font-medium text-foreground hover:underline">
              Lihat semua →
            </Link>
          </div>
          <div className="border-t border-line">
            {sarans.length === 0 ? (
              <p className="px-5 py-10 text-center text-xs text-muted-foreground">Belum ada saran masuk.</p>
            ) : (
              sarans.map((s) => (
                <div key={s.id} className="flex items-start justify-between gap-3 border-b border-line/50 px-5 py-3 last:border-0">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold">{s.sender_name || "Anonim"}</p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{s.message}</p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                      s.admin_reply ? "bg-green-500/10 text-green-500" : "bg-amber-500/10 text-amber-500"
                    )}
                  >
                    {s.admin_reply ? "Dibalas" : "Baru"}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <h3 className="font-display text-sm font-bold">Artikel Terbaru</h3>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Publikasi tim redaksi</p>
            </div>
            <Link href="/admin/artikel" className="text-[11px] font-medium text-foreground hover:underline">
              Lihat semua →
            </Link>
          </div>
          <div className="border-t border-line">
            {artikels.length === 0 ? (
              <p className="px-5 py-10 text-center text-xs text-muted-foreground">Belum ada artikel.</p>
            ) : (
              artikels.map((a) => (
                <div key={a.id} className="flex items-center gap-3 border-b border-line/50 px-5 py-3 last:border-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-soft">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-xs font-semibold">{a.title}</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {new Date(a.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                  <DollarSign className="h-3.5 w-3.5 text-muted-foreground/50" />
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}