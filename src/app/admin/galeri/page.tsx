"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase/client"
import { ImageUpload } from "@/components/image-upload"
import { Plus, Edit, Trash2, ImageIcon, Video, Link2 } from "lucide-react"
import { RequireRole } from "@/components/require-role"

interface GalleryItem {
  id: string
  title: string
  description: string | null
  image_url: string | null
  category: string
  media_type: string
  video_url: string | null
  images?: string[] | null
  videos?: string[] | null
}

const CATEGORIES = ["LKBB", "Latihan Rutin", "Pelantikan", "Pengukuhan", "Kegiatan Lain"]
const MAX_EXTRA = 8

export default function GaleriAdminPage() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<GalleryItem | null>(null)
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Kegiatan Lain",
    image_url: "",
    extraImages: [] as string[],
    videos: [] as string[],
  })

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    const { data } = await supabase.from("gallery").select("*").order("created_at", { ascending: false })
    setItems(data || [])
  }

  const openCreate = () => {
    setEditing(null)
    setForm({ title: "", description: "", category: "Kegiatan Lain", image_url: "", extraImages: [], videos: [] })
    setOpen(true)
  }

  const openEdit = (item: GalleryItem) => {
    setEditing(item)
    setForm({
      title: item.title,
      description: item.description || "",
      category: item.category,
      image_url: item.image_url || "",
      extraImages: item.images || [],
      videos: item.videos && item.videos.length > 0
        ? item.videos
        : item.video_url
          ? [item.video_url]
          : [],
    })
    setOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const images = form.extraImages.filter(Boolean)
    const videos = form.videos.map((v) => v.trim()).filter(Boolean)
    const payload = {
      title: form.title,
      description: form.description,
      category: form.category,
      image_url: form.image_url || null,
      images,
      videos,
      video_url: videos[0] || null,
      media_type: !form.image_url && videos.length > 0 ? "video_embed" : "image",
    }
    if (editing) {
      await supabase.from("gallery").update(payload).eq("id", editing.id)
    } else {
      await supabase.from("gallery").insert(payload)
    }
    setOpen(false)
    fetchItems()
  }

  const handleDelete = async (id: string) => {
    await supabase.from("gallery").delete().eq("id", id)
    fetchItems()
  }

  const addExtraImage = async (file: File) => {
    const { data: { session } } = await supabase.auth.getSession()
    const fd = new FormData()
    fd.append("file", file)
    const res = await fetch("/api/upload", { method: "POST", headers: { Authorization: `Bearer ${session?.access_token}` }, body: fd })
    const data = await res.json()
    if (res.ok && data.url) {
      setForm((f) => ({ ...f, extraImages: [...f.extraImages, data.url] }))
    } else {
      alert(data.error || "Upload gagal")
    }
  }

  return (
    <RequireRole path="/admin/galeri">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="font-display text-2xl font-bold md:text-3xl">Galeri</h1>
          <Button onClick={openCreate} className="gradient-primary text-white w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" /> Tambah Media
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="overflow-hidden rounded-2xl border border-line bg-card"
            >
              <div className="flex min-h-32 items-center justify-center overflow-hidden bg-soft">
                {item.media_type === "video_embed" ? (
                  <div className="flex w-full flex-col items-center justify-center gap-1.5 py-10">
                    <Video className="h-6 w-6 text-accent" />
                    <span className="text-[10px] text-muted-foreground">Video</span>
                  </div>
                ) : item.image_url ? (
                  <img src={item.image_url} alt={item.title} className="h-auto w-full object-cover" />
                ) : (
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex items-start justify-between gap-2 p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{item.title}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{item.category}</p>
                  <p className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <ImageIcon className="h-3 w-3" />
                      {(item.images?.length || 0) + (item.image_url ? 1 : 0)} foto
                    </span>
                    {item.videos && item.videos.length > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Video className="h-3 w-3" />
                        {item.videos.length} video
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(item)} aria-label="Edit">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} aria-label="Hapus">
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="border-line bg-card">
            <DialogHeader>
              <DialogTitle className="font-display">{editing ? "Edit Media" : "Tambah Media"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Judul</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="h-10 border-line bg-soft" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Deskripsi</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="resize-none border-line bg-soft" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Kategori</Label>
                  <Select value={form.category ?? ""} onValueChange={(v) => setForm({ ...form, category: v ?? "" })}>
                    <SelectTrigger className="h-10 border-line bg-soft"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Gambar Utama</Label>
                <ImageUpload value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Foto Lainnya ({form.extraImages.length}/{MAX_EXTRA}, opsional)
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {form.extraImages.map((u, i) => (
                    <div key={u + i} className="relative h-20 overflow-hidden rounded-lg border border-line bg-soft">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={u} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, extraImages: f.extraImages.filter((x) => x !== u) }))}
                        className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                        aria-label="Hapus"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {form.extraImages.length < MAX_EXTRA && (
                    <ImageUpload
                      value=""
                      label="Tambah Foto"
                      className="h-20 [&_button]:h-full [&_button]:border-dashed [&_button]:text-[10px]"
                      hideHint
                      onChange={(url) => setForm((f) => ({ ...f, extraImages: [...f.extraImages, url] }))}
                    />
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Link Video ({form.videos.length}, opsional — YouTube disarankan, bisa TikTok / IG Reel)
                </Label>
                <div className="space-y-2">
                  {form.videos.map((v, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Link2 className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={v}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, videos: f.videos.map((x, j) => (j === i ? e.target.value : x)) }))
                          }
                          placeholder="https://www.tiktok.com/@user/video/123..."
                          className="h-10 border-line bg-soft pl-9"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setForm((f) => ({ ...f, videos: f.videos.filter((_, j) => j !== i) }))}
                        aria-label="Hapus video"
                      >
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-dashed border-line text-xs text-muted-foreground"
                    onClick={() => setForm((f) => ({ ...f, videos: [...f.videos, ""] }))}
                  >
                    <Plus className="mr-2 h-3.5 w-3.5" /> Tambah Link Video
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Video akan tampil di halaman detail galeri dan diputar otomatis (autoplay) saat dibuka.
                </p>
              </div>

              <Button type="submit" className="w-full gradient-primary text-white">
                {editing ? "Simpan" : "Tambah"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </RequireRole>
  )
}