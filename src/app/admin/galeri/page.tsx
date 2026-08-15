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
}

const CATEGORIES = ["LKBB", "Latihan Rutin", "Pelantikan", "Pengukuhan", "Kegiatan Lain"]

export default function GaleriAdminPage() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<GalleryItem | null>(null)
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Kegiatan Lain",
    media_type: "image" as "image" | "video_embed",
    image_url: "",
    extra_images: "",
    video_url: "",
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
    setForm({ title: "", description: "", category: "Kegiatan Lain", media_type: "image", image_url: "", extra_images: "", video_url: "" })
    setOpen(true)
  }

  const openEdit = (item: GalleryItem) => {
    setEditing(item)
    setForm({
      title: item.title,
      description: item.description || "",
      category: item.category,
      media_type: item.media_type === "video_embed" ? "video_embed" : "image",
      image_url: item.image_url || "",
      extra_images: (item.images || []).join(", "),
      video_url: item.video_url || "",
    })
    setOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      title: form.title,
      description: form.description,
      category: form.category,
      media_type: form.media_type,
      image_url: form.media_type === "image" ? form.image_url : null,
      images: form.media_type === "image"
        ? form.extra_images.split(",").map((u) => u.trim()).filter(Boolean)
        : [],
      video_url: form.media_type === "video_embed" ? form.video_url : null,
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
              <div className="flex aspect-video items-center justify-center bg-soft">
                {item.media_type === "video_embed" ? (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-1.5">
                    <Video className="h-6 w-6 text-accent" />
                    <span className="text-[10px] text-muted-foreground">Video Embed</span>
                  </div>
                ) : item.image_url ? (
                  <img src={item.image_url} alt={item.title} className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex items-start justify-between gap-2 p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{item.title}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{item.category}</p>
                  {item.media_type === "video_embed" && item.video_url && (
                    <p className="mt-1 flex items-center gap-1 truncate text-[10px] text-muted-foreground">
                      <Link2 className="h-3 w-3 shrink-0" /> {item.video_url}
                    </p>
                  )}
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
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Jenis Media</Label>
                  <Select value={form.media_type} onValueChange={(v) => setForm({ ...form, media_type: v as "image" | "video_embed" })}>
                    <SelectTrigger className="h-10 border-line bg-soft"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="image">Foto</SelectItem>
                      <SelectItem value="video_embed">Video (TikTok/IG/YouTube)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {form.media_type === "image" ? (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Gambar Utama</Label>
                    <ImageUpload value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Foto Lainnya (opsional)</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {form.extra_images
                        .split(",")
                        .map((u) => u.trim())
                        .filter(Boolean)
                        .map((u, i) => (
                          <div key={i} className="relative h-20 overflow-hidden rounded-lg border border-line bg-soft">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={u} alt="" className="h-full w-full object-cover" />
                            <button
                              type="button"
                              onClick={() =>
                                setForm({
                                  ...form,
                                  extra_images: form.extra_images
                                    .split(",")
                                    .map((x) => x.trim())
                                    .filter((x) => x && x !== u)
                                    .join(", "),
                                })
                              }
                              className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                              aria-label="Hapus"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      {form.extra_images
                        .split(",")
                        .map((u) => u.trim())
                        .filter(Boolean).length < 8 && (
                        <button
                          type="button"
                          className="flex h-20 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-line text-muted-foreground transition-colors hover:border-accent/50 hover:text-foreground"
                          onClick={() => {
                            const input = document.createElement("input")
                            input.type = "file"
                            input.accept = "image/png,image/jpeg,image/webp,image/gif"
                            input.onchange = async () => {
                              const file = input.files?.[0]
                              if (!file) return
                              const { data: { session } } = await supabase.auth.getSession()
                              const fd = new FormData()
                              fd.append("file", file)
                              const res = await fetch("/api/upload", { method: "POST", headers: { Authorization: `Bearer ${session?.access_token}` }, body: fd })
                              const data = await res.json()
                              if (res.ok && data.url) {
                                const list = form.extra_images.split(",").map((x) => x.trim()).filter(Boolean)
                                setForm({ ...form, extra_images: [...list, data.url].join(", ") })
                              } else {
                                alert(data.error || "Upload gagal")
                              }
                            }
                            input.click()
                          }}
                        >
                          <Plus className="h-4 w-4" />
                          <span className="text-[10px]">Tambah Foto</span>
                        </button>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Link Video (TikTok / Instagram Reel / YouTube)</Label>
                  <Input value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} required placeholder="https://www.tiktok.com/@user/video/123..." className="h-10 border-line bg-soft" />
                  <p className="text-[10px] text-muted-foreground">
                    Sistem otomatis mengubahnya menjadi player embedded yang autoplay saat di-scroll.
                  </p>
                </div>
              )}

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