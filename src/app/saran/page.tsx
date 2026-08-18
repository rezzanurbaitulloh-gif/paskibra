"use client"

import { useSiteSettings } from "@/contexts/SiteSettingsContext"
import { useState, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import { supabase } from "@/lib/supabase/client"
import { FeedbackForm } from "@/components/sections/FeedbackForm"
import { SectionHeader } from "@/components/sections/SectionHeader"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { CheckCircle2, Inbox, ThumbsUp, ThumbsDown, Search, MailQuestion, Clock, MessageSquareReply } from "lucide-react"

interface Feedback {
  id: string
  sender_name: string | null
  message: string
  admin_reply: string | null
  replied_at: string | null
  likes: number
  dislikes: number
  created_at: string
}

const VOTE_KEY = "saran-votes"

export default function SaranPage() {
  const { settings } = useSiteSettings()
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [voted, setVoted] = useState<Record<string, "like" | "dislike">>({})
  const [cekMode, setCekMode] = useState(false)
  const [kodeInput, setKodeInput] = useState("")
  const [found, setFound] = useState<Feedback | null>(null)
  const [cekError, setCekError] = useState("")
  const [cekLoading, setCekLoading] = useState(false)

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- baca localStorage pasca-hidrasi (mencegah mismatch SSR)
      setVoted(JSON.parse(localStorage.getItem(VOTE_KEY) || "{}"))
    } catch {
      setVoted({})
    }
    const mode = new URLSearchParams(window.location.search).get("mode")
    if (mode === "cek") setCekMode(true)
    fetchFeedbacks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchFeedbacks = async () => {
    const { data } = await supabase.from("feedbacks").select("*").order("created_at", { ascending: false })
    setFeedbacks(data || [])
    setLoading(false)
  }

  const checkCode = async () => {
    const code = kodeInput.trim().toUpperCase()
    if (!code) return
    setCekLoading(true)
    setCekError("")
    const { data } = await supabase.from("feedbacks").select("*")
    const match = (data || []).find((fb) => fb.id.slice(0, 8).toUpperCase() === code)
    setFound(match || null)
    if (!match) setCekError(`Kode "${code}" tidak ditemukan.`)
    setCekLoading(false)
  }

  const statusCard = useMemo(() => {
    if (!found) return null
    const replied = Boolean(found.admin_reply)
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-line bg-card p-5"
      >
        <div className="flex items-center gap-3">
          <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${replied ? "bg-emerald-500/15" : "bg-amber-500/15"}`}>
            {replied ? <MessageSquareReply className="h-5 w-5 text-emerald-500" /> : <Clock className="h-5 w-5 text-amber-500" />}
          </span>
          <div>
            <p className={`text-sm font-semibold ${replied ? "text-emerald-500" : "text-amber-500"}`}>
              {replied ? "Sudah Dibalas Admin" : "Sedang Diproses"}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Dikirim {new Date(found.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
              {replied && found.replied_at && ` • dibalas ${new Date(found.replied_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`}
            </p>
          </div>
        </div>
        <div className="mt-4 rounded-xl bg-soft p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Pesan Anda</p>
          <p className="mt-1 text-sm text-foreground">{found.message}</p>
          {replied && (
            <div className="mt-3 border-t border-line pt-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-500">Balasan Admin</p>
              <p className="mt-1 text-sm">{found.admin_reply}</p>
            </div>
          )}
        </div>
      </motion.div>
    )
  }, [found])

  const vote = async (id: string, type: "like" | "dislike") => {
    if (voted[id]) return
    setVoted((prev) => {
      const next = { ...prev, [id]: type }
      localStorage.setItem(VOTE_KEY, JSON.stringify(next))
      return next
    })
    setFeedbacks((prev) =>
      prev.map((fb) =>
        fb.id === id
          ? { ...fb, likes: fb.likes + (type === "like" ? 1 : 0), dislikes: fb.dislikes + (type === "dislike" ? 1 : 0) }
          : fb
      )
    )
    await supabase.rpc("vote_feedback", { p_id: id, p_vote: type })
  }

  return (
    <div id="konten" className="min-h-screen">
      <div className="container mx-auto px-4 pt-28 pb-16">
  
        <SectionHeader
          label="Transparan"
          title="Kotak Saran Publik"
          subtitle={settings.pages.saranIntro}
        />

        <div className="mx-auto max-w-2xl space-y-8">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => { setCekMode(false); setFound(null); setCekError("") }}
              className={`rounded-full px-4 py-2 text-xs font-medium transition-all ${!cekMode ? "gradient-primary text-white shadow-glow-red" : "border border-line bg-card text-muted-foreground hover:text-foreground"}`}
            >
              Kirim Saran
            </button>
            <button
              onClick={() => { setCekMode(true); setFound(null); setCekError("") }}
              className={`rounded-full px-4 py-2 text-xs font-medium transition-all ${cekMode ? "gradient-primary text-white shadow-glow-red" : "border border-line bg-card text-muted-foreground hover:text-foreground"}`}
            >
              Cek Status Saran
            </button>
          </div>

          {cekMode ? (
            <div className="rounded-2xl border border-line bg-card p-6 md:p-8">
              <div className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-soft">
                  <MailQuestion className="h-5 w-5 text-accent" />
                </span>
                <div>
                  <h2 className="font-display text-base font-bold">Cek Status Saran</h2>
                  <p className="text-xs text-muted-foreground">Masukkan kode pelacakan yang Anda terima saat mengirim saran.</p>
                </div>
              </div>
              <div className="mt-5 flex gap-2">
                <input
                  value={kodeInput}
                  onChange={(e) => setKodeInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && checkCode()}
                  placeholder="Contoh: 1A2B3C4D"
                  maxLength={8}
                  className="h-11 w-full rounded-lg border border-line bg-soft px-3 font-mono text-sm uppercase tracking-widest outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                  aria-label="Kode pelacakan"
                />
                <Button onClick={checkCode} disabled={cekLoading || !kodeInput.trim()} className="h-11 shrink-0 gradient-primary text-white">
                  <Search className="mr-1.5 h-4 w-4" />
                  {cekLoading ? "..." : "Cek"}
                </Button>
              </div>
              {cekError && <p className="mt-3 text-xs text-red-400">{cekError}</p>}
              {statusCard && <div className="mt-5">{statusCard}</div>}
            </div>
          ) : (
            <FeedbackForm onSubmitted={fetchFeedbacks} />
          )}

          <div>
            <h2 className="mb-4 font-display text-lg font-bold">Semua Saran Masuk</h2>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 rounded-2xl" />
                ))}
              </div>
            ) : feedbacks.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="Belum ada saran yang masuk"
                description="Jadilah yang pertama mengirim masukan untuk Satria Cengkara."
              />
            ) : (
              <div className="space-y-4">
                {feedbacks.map((fb, index) => (
                  <motion.div
                    key={fb.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="rounded-2xl border border-line bg-card p-5"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">{fb.sender_name || "Anonim"}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(fb.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{fb.message}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => vote(fb.id, "like")}
                        disabled={!!voted[fb.id]}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                          voted[fb.id] === "like"
                            ? "border-green-500/50 bg-green-500/10 text-green-400"
                            : "border-line text-muted-foreground hover:text-green-400"
                        }`}
                      >
                        <ThumbsUp className="h-3.5 w-3.5" />
                        {fb.likes}
                      </button>
                      <button
                        onClick={() => vote(fb.id, "dislike")}
                        disabled={!!voted[fb.id]}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                          voted[fb.id] === "dislike"
                            ? "border-red-500/50 bg-red-500/10 text-red-400"
                            : "border-line text-muted-foreground hover:text-red-400"
                        }`}
                      >
                        <ThumbsDown className="h-3.5 w-3.5" />
                        {fb.dislikes}
                      </button>
                    </div>
                    {fb.admin_reply && (
                      <div className="mt-4 rounded-xl border border-line bg-soft p-4">
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-green-500">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Dibalas oleh Admin Satria Cengkara
                        </div>
                        <p className="mt-1.5 text-sm">{fb.admin_reply}</p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}