"use client"

import { useSiteSettings } from "@/contexts/SiteSettingsContext"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"
import { FeedbackForm } from "@/components/sections/FeedbackForm"
import { SectionHeader } from "@/components/sections/SectionHeader"
import { CheckCircle2, Inbox, ArrowLeft } from "lucide-react"

interface Feedback {
  id: string
  sender_name: string | null
  message: string
  admin_reply: string | null
  replied_at: string | null
  created_at: string
}

export default function SaranPage() {
  const { settings } = useSiteSettings()
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)

  const fetchFeedbacks = async () => {
    const { data } = await supabase.from("feedbacks").select("*").order("created_at", { ascending: false })
    setFeedbacks(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchFeedbacks()
  }, [])

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 pt-28 pb-16">
        <Link href="/#beranda" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke Beranda
        </Link>

        <SectionHeader
          label="Transparan"
          title="Kotak Saran Publik"
          subtitle={settings.pages.saranIntro}
        />

        <div className="mx-auto max-w-2xl space-y-8">
          <FeedbackForm onSubmitted={fetchFeedbacks} />

          <div>
            <h2 className="mb-4 font-display text-lg font-bold">Semua Saran Masuk</h2>
            {loading ? (
              <p className="text-sm text-muted-foreground">Memuat...</p>
            ) : feedbacks.length === 0 ? (
              <div className="flex flex-col items-center rounded-2xl border border-dashed border-line py-12 text-center">
                <Inbox className="h-8 w-8 text-muted-foreground" />
                <p className="mt-3 text-sm text-muted-foreground">Belum ada saran yang masuk. Jadilah yang pertama!</p>
              </div>
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