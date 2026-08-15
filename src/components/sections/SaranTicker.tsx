"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { ThumbsUp, ThumbsDown, MessageSquare } from "lucide-react"

interface Feedback {
  id: string
  sender_name: string | null
  message: string
  likes: number
  dislikes: number
  created_at: string
}

const PAUSE_MS = 10000
const VOTE_KEY = "saran-votes"

export function SaranTicker({ refreshKey = 0 }: { refreshKey?: number }) {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [voted, setVoted] = useState<Record<string, "like" | "dislike">>({})
  const scrollerRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)
  const pausedRef = useRef(true)
  const lastInteractionRef = useRef(Date.now())

  const loadVotes = useCallback(() => {
    try {
      setVoted(JSON.parse(localStorage.getItem(VOTE_KEY) || "{}"))
    } catch {
      setVoted({})
    }
  }, [])

  const fetchFeedbacks = useCallback(async () => {
    const { data } = await supabase
      .from("feedbacks")
      .select("id, sender_name, message, likes, dislikes, created_at")
      .order("created_at", { ascending: false })
    setFeedbacks(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadVotes()
    fetchFeedbacks()
  }, [loadVotes, fetchFeedbacks])

  useEffect(() => {
    fetchFeedbacks()
  }, [refreshKey, fetchFeedbacks])

  const pause = useCallback(() => {
    if (!pausedRef.current) {
      pausedRef.current = true
      cancelAnimationFrame(rafRef.current)
    }
    lastInteractionRef.current = Date.now()
  }, [])

  const resume = useCallback(() => {
    if (pausedRef.current) {
      pausedRef.current = false
      lastInteractionRef.current = Date.now()
    }
  }, [])

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return

    const step = () => {
      if (!pausedRef.current) {
        const half = el.scrollHeight / 2
        if (half > el.clientHeight && el.scrollTop >= half) {
          el.scrollTop -= half
        }
        el.scrollTop += 1
      }
      rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)

    const interval = setInterval(() => {
      if (pausedRef.current && Date.now() - lastInteractionRef.current >= PAUSE_MS) {
        resume()
      }
    }, 500)

    return () => {
      cancelAnimationFrame(rafRef.current)
      clearInterval(interval)
    }
  }, [resume])

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

  const items = loading
    ? []
    : [...feedbacks, ...feedbacks]

  return (
    <div
      className="relative mx-auto mt-8 max-w-xl"
      onPointerDown={pause}
      onTouchStart={pause}
      onWheel={pause}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-8 bg-gradient-to-b from-card to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-8 bg-gradient-to-t from-card to-transparent" />

      <div
        ref={scrollerRef}
        className="h-72 overflow-y-auto rounded-2xl border border-line bg-card/70 scroll-smooth"
        style={{ scrollbarWidth: "thin" }}
      >
        {loading ? (
          <p className="p-4 text-center text-sm text-muted-foreground">Memuat saran...</p>
        ) : feedbacks.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <MessageSquare className="h-6 w-6 text-muted-foreground" />
            <p className="mt-2 px-6 text-sm text-muted-foreground">
              Belum ada saran. Jadilah yang pertama untuk mengirim masukan!
            </p>
          </div>
        ) : (
          <div className="space-y-3 p-4">
            {items.map((fb, index) => (
              <div
                key={`${fb.id}-${index}`}
                className="rounded-2xl border border-line bg-soft/70 p-4"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{fb.sender_name || "Anonim"}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(fb.created_at).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{fb.message}</p>
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
              </div>
            ))}
          </div>
        )}
      </div>

      {feedbacks.length > 1 && (
        <p className="mt-3 text-center text-[11px] text-muted-foreground">
          Sedang berjalan otomatis — sentuh/geser untuk berhenti sejenak
        </p>
      )}
    </div>
  )
}
