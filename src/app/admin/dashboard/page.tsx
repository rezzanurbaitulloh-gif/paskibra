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
  Sparkles,
  DollarSign,
  FileText,
  ArrowRight,
  Trophy,
  FileSpreadsheet,
  FileText as FileWord,
  ChevronDown,
  Mail,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { MonthPicker } from "@/components/ui/month-picker"
import { FinanceChart } from "@/components/dashboard/finance-chart"
import { fmtIDR } from "@/lib/fmt"
import { useAdmin } from "@/contexts/AdminContext"
import { BendaharaView } from "./bendahara-view"
import { HumasView } from "./humas-view"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"
import { downloadReportExcel, downloadReportWord, downloadReportPdf, emailReportSummary, type DashboardReportData } from "@/lib/dashboard-report"

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

  if (role === "bendahara") return <BendaharaView />
  if (role === "humas") return <HumasView />

  const name =
    user?.user_metadata?.name?.trim() ||
    (user?.email?.split("@")[0] || "Admin").replace(/[._-]/g, " ")
  const today = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })

  const buildReportData = (): DashboardReportData => ({
    generatedBy: name,
    generatedAt: today,
    stats,
    deltas,
    genData,
    yearData,
    galCategories,
    finRows: finRowsAll,
    lkbbRows,
    sarans,
    artikels,
  })

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

  const chart = (() => {
    const now = new Date()
    const first = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29)
    const bars30: { key: string; label: string; full: string; inc: number; exp: number }[] = []
    for (let w = 0; w < 5; w++) {
      const s = new Date(first.getFullYear(), first.getMonth(), first.getDate() + w * 7)
      const e = new Date(first.getFullYear(), first.getMonth(), first.getDate() + w * 7 + 6)
      const effE = e > now ? now : e
      bars30.push({
        key: `w${w}`,
        label: `Minggu ${w + 1}`,
        full: `${s.getDate()}\u2013${effE.getDate()} ${MONTHS[effE.getMonth()]} ${effE.getFullYear()}`,
        inc: 0,
        exp: 0,
      })
    }
    const firstKey = first.toLocaleDateString("en-CA")
    for (const r of finRowsAll) {
      const idx = Math.floor(
        (Date.parse(String(r.date).slice(0, 10)) - Date.parse(firstKey)) / 86400000 / 7
      )
      if (idx >= 0 && idx < 5) {
        if (r.type === "income") bars30[idx].inc += Number(r.amount)
        else bars30[idx].exp += Number(r.amount)
      }
    }
    if (finPeriod === "all") {
      const map = new Map<string, { key: string; label: string; full: string; inc: number; exp: number }>()
      const fullMonths = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
      for (const r of finRowsAll) {
        const mk = String(r.date).slice(0, 7)
        if (!map.has(mk)) {
          const [y, m] = mk.split("-").map(Number)
          const years = Array.from(new Set(finRowsAll.map((x) => String(x.date).slice(0, 4))))
          map.set(mk, {
            key: mk,
            label: years.length > 1 && m === 1 ? `${MONTHS[m - 1]} '${String(y).slice(2)}` : MONTHS[m - 1],
            full: `${fullMonths[m - 1]} ${y}`,
            inc: 0,
            exp: 0,
          })
        }
        const cur = map.get(mk)!
        if (r.type === "income") cur.inc += Number(r.amount)
        else cur.exp += Number(r.amount)
      }
      return { title: "Semua Periode", bars: Array.from(map.values()) }
    }
    if (finPeriod === "30hari") {
      return { title: "30 Hari Terakhir", bars: bars30 }
    }
    if (/^\d{4}-\d{2}$/.test(finPeriod)) {
      const [y, m] = finPeriod.split("-").map(Number)
      const days = new Date(y, m, 0).getDate()
      const fullM = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"][m - 1]
      const weeks = Math.ceil(days / 7)
      const bars: { key: string; label: string; full: string; inc: number; exp: number }[] = []
      for (let w = 0; w < weeks; w++) {
        const sd = w * 7 + 1
        const ed = Math.min(days, (w + 1) * 7)
        bars.push({
          key: `${finPeriod}-w${w}`,
          label: `Minggu ${w + 1}`,
          full: `${sd}\u2013${ed} ${fullM} ${y}`,
          inc: 0,
          exp: 0,
        })
      }
      for (const r of finRowsAll) {
        const d = Number(String(r.date).slice(8, 10))
        const w = Math.floor((d - 1) / 7)
        if (String(r.date).startsWith(finPeriod) && w >= 0 && w < weeks) {
          if (r.type === "income") bars[w].inc += Number(r.amount)
          else bars[w].exp += Number(r.amount)
        }
      }
      return { title: MONTHS[m - 1] + " " + y, bars }
    }
    return { title: "30 Hari Terakhir", bars: bars30 }
  })()

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
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm" className="h-9">
                  <Download className="mr-1.5 h-3.5 w-3.5" /> Unduh
                  <ChevronDown className="ml-1 h-3.5 w-3.5 opacity-60" />
                </Button>
              }
            />
            <DropdownMenuContent className="glass border-line">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-xs text-muted-foreground">Laporan Ringkasan</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => downloadReportExcel(buildReportData())}
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4 text-green-500" /> Unduh Excel (.xlsx)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => downloadReportWord(buildReportData())}
                >
                  <FileWord className="mr-2 h-4 w-4 text-blue-500" /> Unduh Word (.docx)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => downloadReportPdf(buildReportData())}
                >
                  <FileText className="mr-2 h-4 w-4 text-red-500" /> Unduh PDF (.pdf)
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-xs text-muted-foreground">Bagikan</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => emailReportSummary(buildReportData())}
                >
                  <Mail className="mr-2 h-4 w-4 text-amber-500" /> Kirim Ringkasan via Email
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
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

      {/* Stat cards — tile persegi 4 kolom (terlihat penuh sejak 320px), klik untuk masuk menu */}
      <div className="grid grid-cols-4 gap-2 sm:gap-4">
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="group flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-line bg-card p-1.5 text-center transition-all hover:-translate-y-0.5 hover:border-ring/40 hover:bg-soft/50 active:scale-[0.98] sm:gap-2.5 sm:rounded-2xl sm:p-6"
          >
            <div className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-soft transition-colors group-hover:bg-foreground group-hover:text-background sm:h-14 sm:w-14 sm:rounded-2xl">
              <card.icon className="h-4 w-4 sm:h-7 sm:w-7" />
              {card.delta > 0 && (
                <span className="absolute -top-1.5 -right-1.5 hidden items-center gap-0.5 rounded-full bg-green-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-green-500 sm:flex">
                  <TrendingUp className="h-2.5 w-2.5" /> +{card.delta}
                </span>
              )}
            </div>
            <p className="font-display text-base font-bold tabular-nums sm:text-3xl">{card.value}</p>
            <p className="text-[9px] font-medium leading-tight text-muted-foreground sm:text-xs">{card.label}</p>
            {card.delta === 0 && card.label === "Inventaris" && (
              <span className="hidden rounded-full bg-soft px-2 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-block">
                Total
              </span>
            )}
          </Link>
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
            className="inline-flex min-h-[44px] items-center gap-1 px-2 text-xs font-medium text-foreground opacity-60 transition-opacity hover:opacity-100"
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
        <FinanceChart
          bars={chart.bars}
          title={chart.title}
          control={
            <MonthPicker
              value={finPeriod}
              onChange={setFinPeriod}
              placeholder="30 Hari Terakhir"
              presets={[
                { value: "30hari", label: "30 Hari Terakhir" },
                { value: "all", label: "Semua Periode" },
              ]}
            />
          }
        />

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
            <Link href="/admin/galeri" className="inline-flex min-h-[44px] items-center px-2 text-xs font-medium text-foreground hover:underline">
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
            <Link href="/admin/saran" className="inline-flex min-h-[44px] items-center px-2 text-xs font-medium text-foreground hover:underline">
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
            <Link href="/admin/artikel" className="inline-flex min-h-[44px] items-center px-2 text-xs font-medium text-foreground hover:underline">
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