"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Edit, Trash2, Package } from "lucide-react"
import { supabase } from "@/lib/supabase/client"

interface InventoryItem {
  id: string
  name: string
  description: string | null
  quantity: number
  category: string
}

const emptyForm = { name: "", description: "", quantity: 1, category: "" }

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<InventoryItem | null>(null)
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

  const openEdit = (item: InventoryItem) => {
    setEditing(item)
    setForm({ name: item.name, description: item.description || "", quantity: item.quantity, category: item.category })
    setOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) {
      await supabase.from("inventory").update(form).eq("id", editing.id)
    } else {
      await supabase.from("inventory").insert(form)
    }
    setOpen(false)
    fetchItems()
  }

  const handleDelete = async (id: string) => {
    await supabase.from("inventory").delete().eq("id", id)
    fetchItems()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">Inventaris</h1>
        <Button onClick={openCreate} className="gradient-primary text-white">
          <Plus className="mr-2 h-4 w-4" /> Tambah Aset
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-white/10 bg-card/40 py-16 text-center">
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
              className="rounded-2xl border border-white/[0.08] bg-card p-5 card-glow"
            >
              <div className="flex items-start justify-between">
                <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-medium text-accent">
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
              {item.description && (
                <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
              )}
              <p className="mt-3 text-xs text-muted-foreground">
                Stok:{" "}
                <span className={item.quantity > 0 ? "font-semibold text-green-400" : "font-semibold text-red-400"}>
                  {item.quantity} unit
                </span>
              </p>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-white/10 bg-card">
          <DialogHeader>
            <DialogTitle className="font-display">{editing ? "Edit Aset" : "Tambah Aset"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Nama Aset</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="h-10 border-white/10 bg-white/[0.03]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Kategori</Label>
              <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required className="h-10 border-white/10 bg-white/[0.03]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Jumlah (Stok)</Label>
              <Input type="number" min={0} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} required className="h-10 border-white/10 bg-white/[0.03]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Deskripsi</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="resize-none border-white/10 bg-white/[0.03]" />
            </div>
            <Button type="submit" className="w-full gradient-primary text-white">{editing ? "Simpan" : "Tambah"}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}