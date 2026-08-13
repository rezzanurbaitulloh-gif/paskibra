"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Trash2, Inbox } from "lucide-react"
import { supabase } from "@/lib/supabase/client"

interface Feedback {
  id: string
  name: string | null
  message: string
  created_at: string
}

export default function FeedbacksPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeedbacks()
  }, [])

  const fetchFeedbacks = async () => {
    const { data } = await supabase.from("feedbacks").select("*").order("created_at", { ascending: false })
    setFeedbacks(data || [])
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    await supabase.from("feedbacks").delete().eq("id", id)
    fetchFeedbacks()
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">Kotak Saran</h1>

      {loading ? (
        <p className="text-muted-foreground">Memuat...</p>
      ) : feedbacks.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-white/10 bg-card/40 py-16 text-center">
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
              transition={{ delay: index * 0.05 }}
              className="rounded-2xl border border-white/[0.08] bg-card p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{fb.name || "Anonim"}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(fb.created_at).toLocaleString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(fb.id)} aria-label="Hapus">
                  <Trash2 className="h-4 w-4 text-red-400" />
                </Button>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{fb.message}</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}