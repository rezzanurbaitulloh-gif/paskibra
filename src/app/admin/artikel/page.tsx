"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Edit, Trash2, FileText } from "lucide-react"
import { supabase } from "@/lib/supabase/client"

interface Article {
  id: string
  title: string
  content: string
  slug: string
  created_at: string
}

const emptyForm = { title: "", content: "", slug: "" }

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Article | null>(null)
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    fetchArticles()
  }, [])

  const fetchArticles = async () => {
    const { data } = await supabase.from("articles").select("*").order("created_at", { ascending: false })
    setArticles(data || [])
  }

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
      await supabase.from("articles").update(payload).eq("id", editing.id)
    } else {
      await supabase.from("articles").insert(payload)
    }
    setOpen(false)
    fetchArticles()
  }

  const handleDelete = async (id: string) => {
    await supabase.from("articles").delete().eq("id", id)
    fetchArticles()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">Artikel</h1>
        <Button onClick={openCreate} className="gradient-primary text-white">
          <Plus className="mr-2 h-4 w-4" /> Tulis Artikel
        </Button>
      </div>

      {articles.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-line bg-card/40 py-16 text-center">
          <FileText className="h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">Belum ada artikel.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {articles.map((article, index) => (
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
              <Label className="text-xs text-muted-foreground">Konten</Label>
              <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={8} required className="resize-none border-line bg-soft" />
            </div>
            <Button type="submit" className="w-full gradient-primary text-white">{editing ? "Simpan" : "Terbitkan"}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}