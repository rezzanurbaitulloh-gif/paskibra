"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { EmptyState } from "@/components/ui/empty-state"
import { useToast } from "@/components/ui/toast"
import { Skeleton } from "@/components/ui/skeleton"
import { supabase } from "@/lib/supabase/client"
import { CalendarDays, Plus, Trash2, MapPin } from "lucide-react"

interface EventItem {
  id: string
  title: string
  date: string
  location?: string
  description?: string
}

const emptyForm = { title: "", date: "", location: "", description: "" }

function getToken(): Promise<string | null> {
  return supabase.auth.getSession().then(({ data }) => data.session?.access_token || null)
}

export default function KegiatanPage() {
  const toast = useToast()
  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const fetchEvents = async () => {
    const res = await fetch(`/api/settings-json?key=events`)
    const data = await res.json()
    setEvents(
      (Array.isArray(data.value) ? data.value : []).sort((a: EventItem, b: EventItem) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
      )
    )
    setLoading(false)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch async (setState setelah await)
    fetchEvents()
  }, [])

  const save = async () => {
    const token = await getToken()
    if (!token) return
    setSaving(true)
    const payload = {
      value: [...events, { ...form, id: crypto.randomUUID() }],
    }
    const res = await fetch(`/api/settings-json?key=events`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      toast({ type: "success", title: "Kegiatan ditambahkan" })
      setOpen(false)
      setForm(emptyForm)
      fetchEvents()
    } else {
      toast({ type: "error", title: "Gagal menyimpan kegiatan" })
    }
    setSaving(false)
  }

  const remove = async (id: string) => {
    const token = await getToken()
    if (!token) return
    const res = await fetch(`/api/settings-json?key=events`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ value: events.filter((e) => e.id !== id) }),
    })
    if (res.ok) {
      toast({ type: "success", title: "Kegiatan dihapus" })
      setEvents((prev) => prev.filter((e) => e.id !== id))
    } else {
      toast({ type: "error", title: "Gagal menghapus kegiatan" })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-2xl font-bold md:text-3xl">Kalender Kegiatan</h1>
        <Button
          onClick={() => {
            setForm(emptyForm)
            setOpen(true)
          }}
          className="gradient-primary text-white w-full sm:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" /> Tambah Kegiatan
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Belum ada kegiatan"
          description="Tambahkan agenda latihan, lomba, atau pengukuhan yang akan tampil di halaman utama."
          action={
            <Button
              onClick={() => setOpen(true)}
              className="gradient-primary text-white"
            >
              <Plus className="mr-2 h-4 w-4" /> Tambah Kegiatan
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {events.map((event, index) => {
            const date = new Date(event.date)
            const past = date.getTime() < Date.now()
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className={`flex items-start justify-between gap-4 rounded-2xl border border-line bg-card p-5 card-glow ${past ? "opacity-60" : ""}`}
              >
                <div className="flex gap-4">
                  <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl border border-line bg-soft">
                    <span className="font-display text-lg font-bold leading-none">{date.getDate()}</span>
                    <span className="text-[10px] font-semibold uppercase text-accent">
                      {date.toLocaleDateString("id-ID", { month: "short", year: "2-digit" })}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold">{event.title}</h3>
                    {event.location && (
                      <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0" /> {event.location}
                      </p>
                    )}
                    {event.description && (
                      <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">{event.description}</p>
                    )}
                    {past && (
                      <span className="mt-2 inline-block rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        Sudah lewat
                      </span>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => remove(event.id)} aria-label="Hapus kegiatan">
                  <Trash2 className="h-4 w-4 text-red-400" />
                </Button>
              </motion.div>
            )
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-line bg-card">
          <DialogHeader>
            <DialogTitle className="font-display">Tambah Kegiatan</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              save()
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Judul Kegiatan</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                placeholder="Contoh: Latihan Rutin Mingguan"
                className="h-10 border-line bg-soft"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Tanggal</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                  className="h-10 border-line bg-soft"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Lokasi</Label>
                <Input
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="Contoh: Lapangan SMKN 1 Kertosono"
                  className="h-10 border-line bg-soft"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Deskripsi (Opsional)</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                placeholder="Detail singkat kegiatan..."
                className="resize-none border-line bg-soft"
              />
            </div>
            <Button type="submit" disabled={saving} className="w-full gradient-primary text-white">
              {saving ? "Menyimpan..." : "Simpan Kegiatan"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
