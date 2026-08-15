"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase/client"
import { ImageUpload } from "@/components/image-upload"
import { Plus, Edit, Trash2 } from "lucide-react"

interface Member {
  id: string
  name: string
  position: string
  division: string
  generation: string
  photo_url: string
}

export default function StructureManagement() {
  const [members, setMembers] = useState<Member[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentMember, setCurrentMember] = useState<Member | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    position: "",
    division: "",
    generation: "",
    photo_url: ""
  })

  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    const { data } = await supabase.from("structure_members").select("*")
    setMembers(data || [])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (currentMember) {
      await supabase.from("structure_members").update(formData).eq("id", currentMember.id)
    } else {
      await supabase.from("structure_members").insert(formData)
    }
    fetchMembers()
    setIsDialogOpen(false)
  }

  const handleEdit = (member: Member) => {
    setCurrentMember(member)
    setFormData(member)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    await supabase.from("structure_members").delete().eq("id", id)
    fetchMembers()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
        <h1 className="font-display text-2xl font-bold md:text-3xl">Manajemen Pengurus</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger
            render={
              <Button className="gradient-primary">
                <Plus className="w-4 h-4 mr-2" /> Tambah Pengurus
              </Button>
            }
          />
          <DialogContent className="glass border-line">
            <DialogHeader>
              <DialogTitle className="font-display">{currentMember ? 'Edit Pengurus' : 'Tambah Pengurus'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama</Label>
                <Input id="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Jabatan</Label>
                <Input id="position" value={formData.position} onChange={(e) => setFormData({...formData, position: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="division">Divisi</Label>
                <Input id="division" value={formData.division} onChange={(e) => setFormData({...formData, division: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="generation">Angkatan</Label>
                <Input id="generation" value={formData.generation} onChange={(e) => setFormData({...formData, generation: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Foto</Label>
                <ImageUpload value={formData.photo_url} onChange={(url) => setFormData({ ...formData, photo_url: url })} aspect={3 / 4} />
              </div>
              <Button type="submit" className="gradient-primary w-full">Simpan</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="glass border-line">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Jabatan</TableHead>
              <TableHead>Divisi</TableHead>
              <TableHead>Angkatan</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <motion.tr
                key={member.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <TableCell>{member.name}</TableCell>
                <TableCell>{member.position}</TableCell>
                <TableCell>{member.division}</TableCell>
                <TableCell>{member.generation}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(member)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(member.id)}>
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