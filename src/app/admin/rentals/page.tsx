"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { supabase } from "@/lib/supabase/client"
import { Plus, Edit, Trash2 } from "lucide-react"

interface RentalItem {
  id: string
  name: string
  description: string
  price: number
  available: boolean
  image_url: string
}

export default function RentalManagement() {
  const [rentals, setRentals] = useState<RentalItem[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentItem, setCurrentItem] = useState<RentalItem | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    available: true,
    image_url: ""
  })

  useEffect(() => {
    fetchRentals()
  }, [])

  const fetchRentals = async () => {
    const { data } = await supabase.from("rentals").select("*")
    setRentals(data || [])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (currentItem) {
      await supabase.from("rentals").update(formData).eq("id", currentItem.id)
    } else {
      await supabase.from("rentals").insert(formData)
    }
    fetchRentals()
    setIsDialogOpen(false)
  }

  const handleEdit = (item: RentalItem) => {
    setCurrentItem(item)
    setFormData(item)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    await supabase.from("rentals").delete().eq("id", id)
    fetchRentals()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-display text-3xl font-bold">Manajemen Penyewaan</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary">
              <Plus className="w-4 h-4 mr-2" /> Tambah Item
            </Button>
          </DialogTrigger>
          <DialogContent className="glass border-border/20">
            <DialogHeader>
              <DialogTitle className="font-display">{currentItem ? 'Edit Item' : 'Tambah Item'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama</Label>
                <Input id="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Input id="description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Harga (IDR)</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="image_url">URL Gambar</Label>
                <Input id="image_url" value={formData.image_url} onChange={(e) => setFormData({...formData, image_url: e.target.value})} />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="available"
                  checked={formData.available}
                  onCheckedChange={(checked) => setFormData({...formData, available: Boolean(checked)})}
                />
                <Label htmlFor="available">Tersedia</Label>
              </div>
              <Button type="submit" className="gradient-primary w-full">Simpan</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="glass border-border/20">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Harga</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rentals.map((item) => (
              <motion.tr
                key={item.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <TableCell>{item.name}</TableCell>
                <TableCell>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.price)}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${item.available ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {item.available ? 'Tersedia' : 'Habis'}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}