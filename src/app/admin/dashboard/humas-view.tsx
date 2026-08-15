"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import {
  Image as ImageIcon,
  FileText,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Plus,
  ArrowRight,
  Sparkles,
  ArrowUpRight,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface GalRow {
  id: string
  title: string
  image_url: string | null
  category: string
  created_at: string
}

interface ArtikelRow {
  id: string
  title: string
  slug: string
  created_at: string
}

interface SaranRow {
  id: string
  sender_name: string | null
  message: string
  likes: number
  dislikes: number
  admin_reply: string | null
  created_at: string
}

export function HumasView() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ galeri: 0, artikel: 0, saran: 0, likes: 0 })
  const [galeri, setGaleri] = useState<GalRow[]>([])
  const [artikels, setArtikels] = useState<ArtikelRow[]>([])
  const [sarans, setSarans] = useState<SaranRow[]>([])

  useEffect(() => {
    const load = async () => {
      const [
        { count: cGal },
        { count: cArt },
        { count: cSar },
        { data: galRows },
        { data: artRows },
        { data: saranRows },
      ] = await Promise.all([
        supabase.from("gallery").select("id", { count: "exact", head: true }),
        supabase.from("articles").select("id", { count: "exact", head: true }),
        supabase.from("feedbacks").select("id", { count: "exact", head: true }),
        supabase.from("gallery").select("id, title, image_url, category, created_at").order("created_at", { ascending: false }).limit(6),
        supabase.from("articles").select("id, title, slug, created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("feedbacks").select("id, sender_name, message, likes, dislikes, admin_reply, created_at").order("created_at", { ascending: false }).limit(5),
      ])
      setStats({ galeri: cGal || 0, artikel: cArt || 0, saran: cSar || 0, likes: (saranRows || []).reduce((s, r) => s + Number(r.likes), 0) })
      setGaleri(galRows || [])
      setArtikels(artRows || [])
      setSarans(saranRows || [])
    }
    load()
  }, [])

  const name = (user?.user_metadata?.name as string) || (user?.email?.split("@")[0] || "Admin").replace(/[._-]/g, " ")
  const today = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold md:text-3xl">Dashboard Humas 📣</h1>
          <p className="mt-1 text-xs text-muted-foreground">{today} — Kelola konten & interaksi publik.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/galeri">
            <Button size="sm" className="h-9 gradient-primary text-white">
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Tambah Galeri
            </Button>
          </Link>
          <Link href="/admin/artikel">
            <Button variant="outline" size="sm" className="h-9">
              <FileText className="mr-1.5 h-3.5 w-3.5" /> Tulis Artikel
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
              <Sparkles className="h-3.5 w-3.5" /> Konten & Audiens
            </p>
            <h2 className="mt-2 font-display text-xl font-bold md:text-2xl">
              {stats.galeri} Galeri & {stats.artikel} Artikel 🎉
            </h2>
            <p className="mt-1 max-w-lg text-xs text-white/85 md:text-sm">
              {stats.saran} saran masuk dengan total {stats.likes} suka. Jaga konten tetap segar dan balas masukan publik.
            </p>
          </div>
          <Link
            href="/admin/saran"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-primary shadow transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Balas Saran <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Galeri", value: stats.galeri, icon: ImageIcon, href: "/admin/galeri" },
          { label: "Artikel", value: stats.artikel, icon: FileText, href: "/admin/artikel" },
          { label: "Saran Masuk", value: stats.saran, icon: MessageSquare, href: "/admin/saran" },
          { label: "Total Suka", value: stats.likes, icon: ThumbsUp, href: "/admin/saran" },
        ].map((c) => (
          <Card key={c.label} className="group p-5 transition-colors hover:border-ring/40">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-soft">
              <c.icon className="h-5 w-5 text-foreground" />
            </div>
            <p className="mt-4 font-display text-2xl font-bold">{c.value}</p>
            <div className="mt-1 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{c.label}</p>
              <Link href={c.href} className="flex items-center gap-0.5 text-[10px] font-medium text-foreground opacity-60 transition-opacity group-hover:opacity-100">
                Lihat <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <h3 className="font-display text-sm font-bold">Dokumentasi Terbaru</h3>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Foto galeri paling baru</p>
          </div>
          <Link href="/admin/galeri" className="text-[11px] font-medium text-foreground hover:underline">Kelola galeri →</Link>
        </div>
        <div className="grid grid-cols-2 gap-3 border-t border-line p-5 sm:grid-cols-3 lg:grid-cols-6">
          {galeri.length === 0 && (
            <p className="col-span-full py-8 text-center text-xs text-muted-foreground">Belum ada dokumentasi.</p>
          )}
          {galeri.map((g) => (
            <div key={g.id} className="group relative aspect-square overflow-hidden rounded-xl border border-line">
              {g.image_url ? (
                <Image src={g.image_url} alt={g.title} fill sizes="160px" className="object-cover transition-transform group-hover:scale-105" />
              ) : (
                <div className="flex h-full items-center justify-center bg-soft">
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                <p className="truncate text-[10px] font-medium text-white">{g.title}</p>
                <p className="truncate text-[9px] text-white/60">{g.category}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <h3 className="font-display text-sm font-bold">Artikel Terbaru</h3>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Publikasi tim redaksi</p>
            </div>
            <Link href="/admin/artikel" className="text-[11px] font-medium text-foreground hover:underline">Lihat semua →</Link>
          </div>
          <div className="border-t border-line">
            {artikels.length === 0 && <p className="px-5 py-10 text-center text-xs text-muted-foreground">Belum ada artikel.</p>}
            {artikels.map((a) => (
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
              </div>
            ))}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <h3 className="font-display text-sm font-bold">Saran Terbaru</h3>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Masukan dari pengunjung</p>
            </div>
            <Link href="/admin/saran" className="text-[11px] font-medium text-foreground hover:underline">Lihat semua →</Link>
          </div>
          <div className="border-t border-line">
            {sarans.length === 0 && <p className="px-5 py-10 text-center text-xs text-muted-foreground">Belum ada saran masuk.</p>}
            {sarans.map((s) => (
              <div key={s.id} className="border-b border-line/50 px-5 py-3 last:border-0">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold">{s.sender_name || "Anonim"}</p>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                      s.admin_reply ? "bg-green-500/10 text-green-500" : "bg-amber-500/10 text-amber-500"
                    )}
                  >
                    {s.admin_reply ? "Dibalas" : "Baru"}
                  </span>
                </div>
                <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{s.message}</p>
                <div className="mt-2 flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3 text-green-500" /> {s.likes}</span>
                  <span className="flex items-center gap-1"><ThumbsDown className="h-3 w-3 text-red-400" /> {s.dislikes}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
