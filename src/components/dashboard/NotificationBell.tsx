"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { supabase } from "@/lib/supabase/client"
import { Bell, MessageSquare, Trophy } from "lucide-react"
import { cn } from "@/lib/utils"

const SEEN_KEY = "admin-notif-last-seen"

interface Counts {
  saran: number
  peserta: number
}

export function NotificationBell() {
  const toast = useToast()
  const [counts, setCounts] = useState<Counts>({ saran: 0, peserta: 0 })
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<{ type: string; text: string; date: string }[]>([])
  const firstRun = useRef(true)

  const fetchNew = useCallback(async () => {
    const lastSeen = Number(localStorage.getItem(SEEN_KEY) || 0)
    const since = new Date(lastSeen || Date.now()).toISOString()
    const [saranRes, pesertaRes] = await Promise.all([
      supabase.from("feedbacks").select("sender_name, message, created_at").gt("created_at", since).order("created_at", { ascending: false }),
      supabase.from("lkbb_participants").select("school_name, category, created_at").gt("created_at", since).order("created_at", { ascending: false }),
    ])
    const saran = saranRes.data || []
    const peserta = pesertaRes.data || []
    const next = { saran: saran.length, peserta: peserta.length }
    setCounts(next)

    if (!firstRun.current && next.saran + next.peserta > 0) {
      if (next.saran > 0) toast({ type: "info", title: "Saran baru masuk", description: `${next.saran} saran baru dari pengunjung.` })
      if (next.peserta > 0) toast({ type: "info", title: "Pendaftaran LKBB baru", description: `${next.peserta} sekolah baru mendaftar.` })
    }
    firstRun.current = false
  }, [toast])

  useEffect(() => {
    fetchNew()
    const timer = setInterval(fetchNew, 45000)
    return () => clearInterval(timer)
  }, [fetchNew])

  const openPanel = async () => {
    setOpen((v) => !v)
    if (!open) {
      const lastSeen = Number(localStorage.getItem(SEEN_KEY) || 0)
      const since = new Date(lastSeen || Date.now()).toISOString()
      const [saranRes, pesertaRes] = await Promise.all([
        supabase.from("feedbacks").select("sender_name, message, created_at").gt("created_at", since).order("created_at", { ascending: false }).limit(5),
        supabase.from("lkbb_participants").select("school_name, category, created_at").gt("created_at", since).order("created_at", { ascending: false }).limit(5),
      ])
      const saran = saranRes.data || []
      const peserta = pesertaRes.data || []
      setItems([
        ...saran.map((s) => ({ type: "saran", text: `${s.sender_name || "Anonim"}: ${s.message.slice(0, 60)}`, date: s.created_at })),
        ...peserta.map((p) => ({ type: "peserta", text: `${p.school_name} (${p.category}) mendaftar LKBB`, date: p.created_at })),
      ])
    }
    localStorage.setItem(SEEN_KEY, String(Date.now()))
    setCounts({ saran: 0, peserta: 0 })
  }

  const total = counts.saran + counts.peserta

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" aria-label={`Notifikasi (${total} baru)`} className="h-10 w-10" onClick={openPanel}>
        <span className="relative">
          <Bell className="h-4 w-4" />
          {total > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
              {total}
            </span>
          )}
        </span>
      </Button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-2xl border border-line bg-card shadow-xl">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="text-sm font-semibold">Aktivitas Terbaru</p>
            <span className="text-[10px] text-muted-foreground">Sejak kunjungan terakhir</span>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-muted-foreground">
                Belum ada aktivitas baru.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 px-4 py-3">
                    <span
                      className={cn(
                        "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                        item.type === "saran" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"
                      )}
                    >
                      {item.type === "saran" ? <MessageSquare className="h-3.5 w-3.5" /> : <Trophy className="h-3.5 w-3.5" />}
                    </span>
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-xs text-foreground">{item.text}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {new Date(item.date).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
