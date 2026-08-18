"use client"

import { useSiteSettings } from "@/contexts/SiteSettingsContext"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import { supabase } from "@/lib/supabase/client"
import { Users, UserPlus, CheckCircle2, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { useToast } from "@/components/ui/toast"

interface Member {
  id: string
  name: string
  position: string
  generation: string
  photo_url: string | null
}

const initials = (name: string) =>
  name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()

export default function PengurusPage() {
  const { settings } = useSiteSettings()
  const toast = useToast()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [recruitOpen, setRecruitOpen] = useState(false)
  const [recruitForm, setRecruitForm] = useState({ name: "", kelas: "", contact: "", motivation: "" })
  const [recruitLoading, setRecruitLoading] = useState(false)
  const [recruitDone, setRecruitDone] = useState(false)

  useEffect(() => {
    const fetchMembers = async () => {
      const { data } = await supabase.from("structure_members").select("*").order("generation").order("position")
      setMembers(data || [])
      setLoading(false)
    }
    fetchMembers()
  }, [])

  const submitRecruitment = async (e: React.FormEvent) => {
    e.preventDefault()
    setRecruitLoading(true)
    try {
      const res = await fetch("/api/recruitment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: recruitForm.name, kelas: recruitForm.kelas, contact: recruitForm.contact, motivation: recruitForm.motivation }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        toast({ type: "error", title: "Pendaftaran gagal", description: data.error || "Coba lagi." })
      } else {
        setRecruitDone(true)
        toast({
          type: "success",
          title: "Pendaftaran terkirim!",
          description: "Data Anda masuk antrian seleksi pengurus.",
        })
      }
    } catch {
      toast({ type: "error", title: "Terjadi kesalahan", description: "Coba lagi beberapa saat." })
    }
    setRecruitLoading(false)
  }

  return (
    <div id="konten" className="min-h-screen">
      <div className="container mx-auto px-4 pt-28 pb-16">

        <div className="mt-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Struktur Organisasi</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold md:text-4xl">Daftar Anggota Satria Cengkara</h1>
          <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground">
            {settings.pages.pengurusIntro}
          </p>
        </div>

        <div className="mt-8 flex justify-center">
          <Button
            onClick={() => setRecruitOpen((v) => !v)}
            className="h-10 gradient-primary text-white hover:brightness-110"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Gabung Jadi Pengurus
          </Button>
        </div>

        {recruitOpen && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto mt-6 max-w-lg rounded-2xl border border-line bg-card p-6 card-glow"
          >
            {recruitDone ? (
              <div className="flex flex-col items-center py-8 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/15">
                  <CheckCircle2 className="h-7 w-7 text-green-400" />
                </div>
                <h3 className="mt-4 font-display text-lg font-bold">Pendaftaran Terkirim!</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Terima kasih, {recruitForm.name.split(" ")[0]}! Panitia akan menghubungi Anda untuk seleksi.
                </p>
                <Button
                  onClick={() => {
                    setRecruitDone(false)
                    setRecruitOpen(false)
                    setRecruitForm({ name: "", kelas: "", contact: "", motivation: "" })
                  }}
                  className="mt-6 h-10 gradient-primary text-white"
                >
                  Tutup
                </Button>
              </div>
            ) : (
              <form onSubmit={submitRecruitment} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="rec-name" className="text-xs text-muted-foreground">Nama Lengkap *</Label>
                  <Input
                    id="rec-name"
                    value={recruitForm.name}
                    onChange={(e) => setRecruitForm({ ...recruitForm, name: e.target.value })}
                    placeholder="Nama lengkap Anda"
                    required
                    className="h-11 border-line bg-soft focus-visible:ring-accent"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="rec-school" className="text-xs text-muted-foreground">Asal Sekolah *</Label>
                  <Input
                    id="rec-school"
                    value={recruitForm.kelas}
                    onChange={(e) => setRecruitForm({ ...recruitForm, kelas: e.target.value })}
                    placeholder="Contoh: SMKN 1 Kertosono"
                    required
                    className="h-11 border-line bg-soft focus-visible:ring-accent"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="rec-phone" className="text-xs text-muted-foreground">No. WhatsApp *</Label>
                  <Input
                    id="rec-phone"
                    type="tel"
                    value={recruitForm.contact}
                    onChange={(e) => setRecruitForm({ ...recruitForm, contact: e.target.value })}
                    placeholder="Contoh: 0812-3456-7890"
                    required
                    className="h-11 border-line bg-soft focus-visible:ring-accent"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="rec-motivation" className="text-xs text-muted-foreground">Motivasi (Opsional)</Label>
                  <Textarea
                    id="rec-motivation"
                    value={recruitForm.motivation}
                    onChange={(e) => setRecruitForm({ ...recruitForm, motivation: e.target.value })}
                    rows={3}
                    placeholder="Ceritakan alasan ingin bergabung..."
                    className="resize-none border-line bg-soft focus-visible:ring-accent"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={recruitLoading}
                  className="w-full h-11 gradient-primary text-white hover:brightness-110"
                >
                  <Send className="mr-2 h-4 w-4" />
                  {recruitLoading ? "Mengirim..." : "Kirim Pendaftaran"}
                </Button>
              </form>
            )}
          </motion.div>
        )}

        {loading ? (
          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-line bg-card p-4">
                <Skeleton className="mx-auto h-20 w-20 rounded-full" />
                <Skeleton className="mx-auto mt-3 h-4 w-24" />
                <Skeleton className="mx-auto mt-2 h-3 w-16" />
              </div>
            ))}
          </div>
        ) : members.length === 0 ? (
          <div className="mt-12">
            <EmptyState
              icon={Users}
              title="Belum ada data pengurus"
              description="Struktur organisasi sedang disusun."
            />
          </div>
        ) : (
          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {members.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="rounded-2xl border border-line bg-card p-4 text-center card-glow"
              >
                <div className="relative mx-auto h-20 w-20 overflow-hidden rounded-full border border-line bg-soft">
                  {member.photo_url ? (
                    <Image src={member.photo_url} alt={member.name} fill className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-display text-lg font-bold text-accent">
                      {initials(member.name)}
                    </div>
                  )}
                </div>
                <p className="mt-3 text-sm font-semibold leading-snug">{member.name}</p>
                <p className="mt-1 text-[11px] text-accent">{member.position}</p>
                <p className="text-[10px] text-muted-foreground">{member.generation}</p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
