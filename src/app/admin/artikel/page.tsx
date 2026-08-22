"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Edit, Trash2, FileText, ImagePlus, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { EmptyState } from "@/components/ui/empty-state"
import { useToast } from "@/components/ui/toast"

interface Article {
  id: string
  title: string
  content: string
  slug: string
  created_at: string
}

const emptyForm = { title: "", content: "", slug: "" }

export default function ArticlesPage() {
  const toast = useToast()
  const [articles, setArticles] = useState<Article[]>([])
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Article | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [uploadingImage, setUploadingImage] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const contentRef = useRef<HTMLTextAreaElement>(null)

  const handleInsertImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    setUploadingImage(true)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const fd = new FormData()
      fd.append("file", file, file.name)
      fd.append("name", file.name)
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${session?.access_token}` },
        body: fd,
      })
      const raw = await res.text()
      const data = raw ? JSON.parse(raw) : {}
      if (!res.ok || !data.url) throw new Error(data.error || "Upload gagal")
      const md = `\n\n![gambar](${data.url})\n\n`
      const ta = contentRef.current
      const pos = ta ? (ta.selectionStart ?? form.content.length) : form.content.length
      setForm((f) => ({
        ...f,
        content: f.content.slice(0, pos) + md + f.content.slice(pos),
      }))
    } catch {
      toast({ type: "error", title: "Gagal mengunggah gambar" })
    } finally {
      setUploadingImage(false)
    }
  }

  const fetchArticles = async () => {
    const { data } = await supabase.from("articles").select("*").order("created_at", { ascending: false })
    setArticles(data || [])
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch async dari Supabase (setState setelah await, bukan sinkron)
    fetchArticles()
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setOpen(true)
  }

  const openEdit = (article: Article) => {
    setEditing(article)
    setForm({ title: article.title, content: article.content, slug: article.slug })
    setOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const slug = form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
    const payload = { ...form, slug }
    if (editing) {
      const { error } = await supabase.from("articles").update(payload).eq("id", editing.id)
      if (!error) toast({ type: "success", title: "Artikel diperbarui" })
      else toast({ type: "error", title: "Gagal memperbarui" })
    } else {
      const { error } = await supabase.from("articles").insert(payload)
      if (!error) toast({ type: "success", title: "Artikel terbit!" })
      else toast({ type: "error", title: "Gagal menerbitkan" })
    }
    setOpen(false)
    fetchArticles()
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("articles").delete().eq("id", id)
    if (!error) toast({ type: "info", title: "Artikel dihapus" })
    else toast({ type: "error", title: "Gagal menghapus" })
    fetchArticles()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-2xl font-bold md:text-3xl">Artikel</h1>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari judul artikel..."
            className="h-9 w-full border-line bg-soft text-sm sm:w-56"
          />
          <Button onClick={openCreate} className="gradient-primary text-white w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" /> Tulis Artikel
          </Button>
        </div>
      </div>

      {articles.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Belum ada artikel"
          description="Tulis artikel pertama tentang kegiatan Satria Cengkara."
          action={
            <Button onClick={openCreate} className="gradient-primary text-white">
              <Plus className="mr-2 h-4 w-4" /> Tulis Artikel
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {articles
            .filter((a) => a.title.toLowerCase().includes(search.toLowerCase()))
            .map((article, index) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="flex items-start justify-between gap-4 rounded-2xl border border-line bg-card p-5 card-glow"
            >
              <div className="min-w-0">
                <h3 className="font-display text-sm font-bold">{article.title}</h3>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{article.content}</p>
                <p className="mt-2 text-[10px] text-muted-foreground">
                  /artikel/{article.slug} •{" "}
                  {new Date(article.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button variant="ghost" size="icon" onClick={() => openEdit(article)} aria-label="Edit">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(article.id)} aria-label="Hapus">
                  <Trash2 className="h-4 w-4 text-red-400" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-line bg-card">
          <DialogHeader>
            <DialogTitle className="font-display">{editing ? "Edit Artikel" : "Tulis Artikel"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Judul</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="h-10 border-line bg-soft" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Slug (opsional, otomatis dari judul)</Label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="contoh: sejarah-paskibra" className="h-10 border-line bg-soft" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Konten</Label>
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-line bg-soft px-3 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                >
                  {uploadingImage ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Mengunggah…
                    </>
                  ) : (
                    <>
                      <ImagePlus className="h-3.5 w-3.5" /> Tambah Gambar
                    </>
                  )}
                </button>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={handleInsertImage}
                />
              </div>
              <Textarea
                ref={contentRef}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={8}
                required
                className="resize-none border-line bg-soft"
                placeholder={"Tulis isi artikel…\n\nGambar akan disisipkan otomatis saat diunggah."}
              />
              <p className="text-[11px] leading-snug text-muted-foreground/70">
                Sisipkan baris kosong sebelum & sesudah gambar agar tampil penuh di artikel.
              </p>
            </div>
            <Button type="submit" className="w-full gradient-primary text-white">{editing ? "Simpan" : "Terbitkan"}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}