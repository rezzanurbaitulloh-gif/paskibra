"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase/client"
import { Plus, Trash2 } from "lucide-react"
import Image from "next/image"

interface GalleryItem {
  id: string
  title: string
  description: string
  image_url: string
  category: string
}

export default function GalleryManagement() {
  const [gallery, setGallery] = useState<GalleryItem[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentItem, setCurrentItem] = useState<GalleryItem | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image_url: "",
    category: ""
  })

  useEffect(() => {
    fetchGallery()
    fetchCategories()
  }, [])

  const fetchGallery = async () => {
    const { data } = await supabase.from("gallery").select("*")
    setGallery(data || [])
  }

  const fetchCategories = async () => {
    const { data } = await supabase.from("gallery").select("category").distinct()
    setCategories(data?.map(c => c.category) || [])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (currentItem) {
      await supabase.from("gallery").update(formData).eq("id", currentItem.id)
    } else {
      await supabase.from("gallery").insert(formData)
    }
    fetchGallery()
    setIsDialogOpen(false)
  }

  const handleDelete = async (id: string) => {
    await supabase.from("gallery").delete().eq("id", id)
    fetchGallery()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-display text-3xl font-bold">Manajemen Galeri</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary">
              <Plus className="w-4 h-4 mr-2" /> Tambah Galeri
            </Button>
          </DialogTrigger>
          <DialogContent className="glass border-border/20 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="font-display">{currentItem ? 'Edit Galeri' : 'Tambah Galeri'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Judul</Label>
                <Input id="title" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Input id="description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="image_url">URL Gambar</Label>
                <Input id="image_url" value={formData.image_url} onChange={(e) => setFormData({...formData, image_url: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Kategori</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="gradient-primary w-full">Simpan</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {gallery.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="relative group"
          >
            <Card className="glass border-border/20 overflow-hidden">
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={item.image_url}
                  alt={item.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4">
                <h3 className="font-display font-bold">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.category}</p>
              </div>
            </Card>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 bg-black/50 text-white"
              onClick={() => handleDelete(item.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  )
}