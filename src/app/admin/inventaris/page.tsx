"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase/client"
import { ImageUpload } from "@/components/image-upload"
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
  wa_number?: string | null
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
  wa_number: "6281234567890",
}

export default function InventarisAdminPage() {
  const [items, setItems] = useState<Item[]>([])
  const [search, setSearch] = useState("")
  const [fCat, setFCat] = useState("all")
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Item | null>(null)
  const [form, setForm] = useState(emptyForm)

  const fetchItems = async () => {
    const { data } = await supabase.from("inventory").select("*").order("name")
    setItems(data || [])
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch async dari Supabase (setState setelah await, bukan sinkron)
    fetchItems()
  }, [])

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
      wa_number: item.wa_number || "",
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
      wa_number: form.wa_number,
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

  const visibleItems = items
    .filter((it) => it.name.toLowerCase().includes(search.toLowerCase()))
    .filter((it) => fCat === "all" || it.category === fCat)

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
          <>
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-card p-3">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama aset..."
              className="h-9 w-full border-line bg-soft text-sm sm:w-56"
            />
            <select
              value={fCat}
              onChange={(e) => setFCat(e.target.value)}
              className="h-9 rounded-lg border border-line bg-card px-2 text-xs"
            >
              <option value="all">Semua Kategori</option>
              {Array.from(new Set(items.map((it) => it.category).filter(Boolean))).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="hidden md:block overflow-hidden rounded-2xl border border-line bg-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-[11px] uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3">Aset</th>
                    <th className="px-4 py-3">Kategori</th>
                    <th className="px-4 py-3">Harga Sewa</th>
                    <th className="px-4 py-3">Stok</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleItems.map((item, index) => (
                    <tr key={item.id} className="border-b border-line/50 last:border-0 hover:bg-soft/50">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-3">
                          {item.image_url && (
                            <div className="flex h-11 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-soft">
                              <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate font-medium">{item.name}</p>
                            {item.description && (
                              <p className="line-clamp-1 text-[11px] text-muted-foreground">{item.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="rounded-full border border-line bg-soft px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs font-semibold text-accent">
                        {fmt(Number(item.price))}
                        <span className="text-[10px] font-normal text-muted-foreground">/sewa</span>
                      </td>
                      <td className="px-4 py-2.5 text-xs">
                        <span className={item.stock > 0 ? "font-semibold text-green-500" : "font-semibold text-red-500"}>
                          {item.stock}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={item.is_available ? "font-semibold text-green-500" : "font-semibold text-red-500"}>
                          {item.is_available ? "Tersedia" : "Tidak Tersedia"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(item)} aria-label="Edit">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} aria-label="Hapus">
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Card list mobile */}
          <div className="md:hidden space-y-3">
            {visibleItems.map((item) => (
              <div key={item.id} className="rounded-xl border border-line bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="h-14 w-20 shrink-0 rounded-lg object-cover outline outline-1 outline-black/10"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.category} · Stok{" "}
                        <span className={item.stock > 0 ? "font-semibold text-green-500" : "font-semibold text-red-500"}>
                          {item.stock}
                        </span>
                      </p>
                      <p className={`text-xs mt-0.5 font-medium ${item.is_available ? "text-green-500" : "text-red-500"}`}>
                        {item.is_available ? "Tersedia" : "Tidak Tersedia"}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button variant="ghost" size="icon" className="h-11 w-11" onClick={() => openEdit(item)} aria-label={`Edit ${item.name}`}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-11 w-11" onClick={() => handleDelete(item.id)} aria-label={`Hapus ${item.name}`}>
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </Button>
                  </div>
                </div>
                <p className="mt-2 text-sm font-semibold text-accent tabular-nums">
                  Rp{fmt(Number(item.price))}
                  <span className="text-xs font-normal text-muted-foreground">/sewa</span>
                </p>
              </div>
            ))}
            {visibleItems.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">Tidak ada aset yang cocok.</p>
            )}
          </div>
          </>
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
                <Label className="text-xs text-muted-foreground">Gambar Aset</Label>
                <ImageUpload value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Nomor WhatsApp Penerima Sewa</Label>
                <Input value={form.wa_number} onChange={(e) => setForm({ ...form, wa_number: e.target.value })} placeholder="6281234567890" className="h-10 border-line bg-soft" />
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