"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase/client"
import { Trash2, Reply, Inbox, CheckCircle2 } from "lucide-react"
import { RequireRole } from "@/components/require-role"

interface Feedback {
  id: string
  sender_name: string | null
  message: string
  admin_reply: string | null
  replied_at: string | null
  created_at: string
}

export default function SaranPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [replyText, setReplyText] = useState<Record<string, string>>({})
  const [replying, setReplying] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetchFeedbacks()
  }, [])

  const fetchFeedbacks = async () => {
    const { data } = await supabase.from("feedbacks").select("*").order("created_at", { ascending: false })
    setFeedbacks(data || [])
    setLoading(false)
  }

  const handleReply = async (fb: Feedback) => {
    const text = replyText[fb.id]?.trim()
    if (!text) return
    setReplying((prev) => ({ ...prev, [fb.id]: true }))
    await supabase.from("feedbacks").update({ admin_reply: text, replied_at: new Date().toISOString() }).eq("id", fb.id)
    setReplyText((prev) => ({ ...prev, [fb.id]: "" }))
    setReplying((prev) => ({ ...prev, [fb.id]: false }))
    fetchFeedbacks()
  }

  const handleDelete = async (id: string) => {
    await supabase.from("feedbacks").delete().eq("id", id)
    fetchFeedbacks()
  }

  return (
    <RequireRole path="/admin/saran">
      <div className="space-y-6">
        <h1 className="font-display text-3xl font-bold">Kotak Saran</h1>

        {loading ? (
          <p className="text-muted-foreground">Memuat...</p>
        ) : feedbacks.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-line bg-card/40 py-16 text-center">
            <Inbox className="h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">Belum ada saran dari pengunjung.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {feedbacks.map((fb, index) => (
              <motion.div
                key={fb.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="rounded-2xl border border-line bg-card p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{fb.sender_name || "Anonim"}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(fb.created_at).toLocaleString("id-ID", {
                        day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(fb.id)} aria-label="Hapus">
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </Button>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{fb.message}</p>

                {fb.admin_reply ? (
                  <div className="mt-4 rounded-xl border border-line bg-soft p-4">
                    <div className="flex items-center gap-2 text-xs text-green-500">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Dibalas oleh Admin Satria Cengkara
                      {fb.replied_at && (
                        <span className="text-muted-foreground">
                          • {new Date(fb.replied_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm">{fb.admin_reply}</p>
                  </div>
                ) : (
                  <div className="mt-4 flex gap-2">
                    <Input
                      placeholder="Tulis balasan admin..."
                      value={replyText[fb.id] || ""}
                      onChange={(e) => setReplyText((prev) => ({ ...prev, [fb.id]: e.target.value }))}
                      className="h-9 border-line bg-soft text-sm"
                    />
                    <Button
                      size="sm"
                      className="shrink-0 gradient-primary text-white"
                      disabled={!replyText[fb.id]?.trim() || replying[fb.id]}
                      onClick={() => handleReply(fb)}
                    >
                      <Reply className="mr-1.5 h-3.5 w-3.5" />
                      {replying[fb.id] ? "..." : "Balas"}
                    </Button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </RequireRole>
  )
}