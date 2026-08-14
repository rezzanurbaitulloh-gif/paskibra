"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase/client"
import { Plus, Edit, Trash2, Package } from "lucide-react"
import { RequireRole } from "@/components/require-role"

interface Item {
  id: string
  name: string
  slug: string | null
  price: number
  stock: number
  quantity: number
  is_available: boolean
  category: string
  description: string | null
  image_url: string | null
}

const fmt = (n: number) => "Rp " + n.toLocaleString("id-ID")

const emptyForm = {
  name: "",
  description: "",
  price: 0,
  stock: 1,
  category: "",
  is_available: true,
  image_url: "",
}

export default function InventarisAdminPage() {
  const [items, setItems] = useState<Item[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Item | null>(null)
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    const { data } = await supabase.from("inventory").select("*").order("name")
    setItems(data || [])
  }

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setOpen(true)
  }

  const openEdit = (item: Item) => {
    setEditing(item)
    setForm({
      name: item.name,
      description: item.description || "",
      price: Number(item.price),
      stock: item.stock,
      category: item.category,
      is_available: item.is_available,
      image_url: item.image_url || "",
    })
    setOpen(true)
  }

  const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      name: form.name,
      slug: slugify(form.name),
      description: form.description,
      price: Number(form.price),
      stock: Number(form.stock),
      quantity: Number(form.stock),
      category: form.category,
      is_available: form.is_available,
      image_url: form.image_url,
    }
    if (editing) {
      await supabase.from("inventory").update(payload).eq("id", editing.id)
    } else {
      await supabase.from("inventory").insert(payload)
    }
    setOpen(false)
    fetchItems()
  }

  const handleDelete = async (id: string) => {
    await supabase.from("inventory").delete().eq("id", id)
    fetchItems()
  }

  return (
    <RequireRole path="/admin/inventaris">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl font-bold">Inventaris & Katalog Sewa</h1>
          <Button onClick={openCreate} className="gradient-primary text-white">
            <Plus className="mr-2 h-4 w-4" /> Tambah Aset
          </Button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-line bg-card/40 py-16 text-center">
            <Package className="h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">Belum ada aset tercatat.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="overflow-hidden rounded-2xl border border-line bg-card card-glow"
              >
                {item.image_url && (
                  <div className="aspect-[4/3] w-full overflow-hidden bg-soft">
                    <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="rounded-md border border-line bg-soft px-2 py-1 text-[10px] font-medium text-accent">
                      {item.category}
                    </span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(item)} aria-label="Edit">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} aria-label="Hapus">
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </Button>
                    </div>
                  </div>
                  <h3 className="mt-3 font-display text-sm font-bold">{item.name}</h3>
                  <p className="mt-1 font-display text-sm font-bold text-accent">{fmt(Number(item.price))}<span className="text-[10px] font-normal text-muted-foreground">/sewa</span></p>
                  {item.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
                  )}
                  <div className="mt-3 flex items-center gap-3 text-[11px]">
                    <span className={item.stock > 0 ? "font-semibold text-green-400" : "font-semibold text-red-400"}>
                      Stok: {item.stock}
                    </span>
                    <span className={item.is_available ? "font-semibold text-green-400" : "font-semibold text-red-400"}>
                      {item.is_available ? "Tersedia" : "Tidak Tersedia"}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="border-line bg-card">
            <DialogHeader>
              <DialogTitle className="font-display">{editing ? "Edit Aset" : "Tambah Aset"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Nama Aset</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="h-10 border-line bg-soft" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Kategori</Label>
                  <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required placeholder="Seragam / Aksesoris" className="h-10 border-line bg-soft" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Harga Sewa (Rp)</Label>
                  <Input type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} required className="h-10 border-line bg-soft" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Stok</Label>
                  <Input type="number" min={0} value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} required className="h-10 border-line bg-soft" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <select
                    value={form.is_available ? "1" : "0"}
                    onChange={(e) => setForm({ ...form, is_available: e.target.value === "1" })}
                    className="h-10 w-full rounded-md border border-line bg-soft px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="1">Tersedia</option>
                    <option value="0">Tidak Tersedia</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">URL Gambar (opsional)</Label>
                <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="/images/baju-pdl.svg" className="h-10 border-line bg-soft" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Deskripsi</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="resize-none border-line bg-soft" />
              </div>
              <Button type="submit" className="w-full gradient-primary text-white">{editing ? "Simpan" : "Tambah"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </RequireRole>
  )
}