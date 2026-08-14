"use client"

import { motion } from "framer-motion"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Send, CheckCircle2 } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { SectionHeader } from "./SectionHeader"

export function FeedbackForm({ onSubmitted }: { onSubmitted?: () => void }) {
  const [name, setName] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return
    setLoading(true)
    setError("")

    const { error: insertError } = await supabase.from("feedbacks").insert({
      sender_name: name.trim() || "Anonim",
      message: message.trim(),
    })

    if (insertError) {
      setError("Gagal mengirim. Coba lagi.")
    } else {
      setSent(true)
      setName("")
      setMessage("")
      onSubmitted?.()
      setTimeout(() => setSent(false), 4000)
    }
    setLoading(false)
  }

  return (
    <section id="saran" className="relative py-24">
      <div className="container mx-auto px-4">
        <SectionHeader
          label="Suara Anda"
          title="Kotak Saran & Masukan"
          actionLabel="Lihat Semua Saran"
          actionHref="/saran"
          subtitle="Kritik dan saran membantu Satria Cengkara tumbuh lebih baik. Nama bersifat opsional."
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true, margin: "-60px" }}
          className="mx-auto max-w-xl"
        >
          <div className="rounded-2xl border border-line bg-card p-6 md:p-8">
            {sent ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center py-8 text-center"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/15">
                  <CheckCircle2 className="h-7 w-7 text-green-400" />
                </div>
                <h3 className="mt-4 font-display text-lg font-bold">Terima Kasih!</h3>
                <p className="mt-1 text-sm text-muted-foreground">Masukan Anda telah kami terima.</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="fb-name" className="text-xs text-muted-foreground">Nama (Opsional)</Label>
                  <Input
                    id="fb-name"
                    placeholder="Anonim jika dikosongkan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-11 border-line bg-soft focus-visible:ring-accent"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fb-message" className="text-xs text-muted-foreground">Pesan Anda</Label>
                  <Textarea
                    id="fb-message"
                    placeholder="Tuliskan kritik, saran, atau masukan..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    className="resize-none border-line bg-soft focus-visible:ring-accent"
                    required
                  />
                </div>
                {error && <p className="text-xs text-red-400">{error}</p>}
                <Button
                  type="submit"
                  disabled={loading || !message.trim()}
                  className="w-full h-11 gradient-primary text-white hover:brightness-110"
                >
                  <Send className="mr-2 h-4 w-4" />
                  {loading ? "Mengirim..." : "Kirim Masukan"}
                </Button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  )
}