"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase/client"
import { ImageUpload } from "@/components/image-upload"
import { ImportModal } from "@/components/admin/import-modal"
import { Plus, Edit, Trash2, Upload } from "lucide-react"

interface Member {
  id: string
  name: string
  position: string
  division: string
  generation: string
  kelas: string | null
  photo_url: string
}

export default function StructureManagement() {
  const [members, setMembers] = useState<Member[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [importing, setImporting] = useState(false)
  const [currentMember, setCurrentMember] = useState<Member | null>(null)
  const [search, setSearch] = useState("")
  const [mode, setMode] = useState("nama-a")
  const [formData, setFormData] = useState({
    name: "",
    position: "",
    division: "",
    generation: "",
    kelas: "",
    photo_url: ""
  })

  useEffect(() => {
    fetchMembers()
  }, [])

  const distinct = (key: keyof Member) =>
    Array.from(new Set(members.map((m) => (m[key] || "").trim()).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b, "id")
    )

  const filtered = members
    .filter((m) => m.name.toLowerCase().includes(search.toLowerCase()))
    .filter((m) => {
      if (mode.startsWith("k:")) return (m.kelas || "") === mode.slice(2)
      if (mode.startsWith("g:")) return m.generation === mode.slice(2)
      if (mode.startsWith("d:")) return m.division === mode.slice(2)
      if (mode.startsWith("j:")) return m.position === mode.slice(2)
      return true
    })
    .sort((a, b) => {
      const cmp = (x: string, y: string) => x.localeCompare(y, "id")
      const genNum = (g: string) => {
        const n = g.replace(/\D/g, "")
        return n ? Number(n) : 0
      }
      switch (mode) {
        case "nama-z":
          return cmp(b.name, a.name)
        case "kelas":
          return cmp(a.kelas || "", b.kelas || "")
        case "generasi":
          return genNum(a.generation) - genNum(b.generation)
        case "divisi":
          return cmp(a.division, b.division)
        case "jabatan":
          return cmp(a.position, b.position)
        default:
          return cmp(a.name, b.name)
      }
    })

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
    setFormData({ ...member, kelas: member.kelas || "" })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    await supabase.from("structure_members").delete().eq("id", id)
    fetchMembers()
  }

  const handleImport = async (rows: Record<string, string>[]) => {
    setImporting(true)
    const payload = rows.map((r) => ({
      name: r.name,
      position: r.position,
      division: r.division,
      generation: r.generation,
      kelas: r.kelas || null,
    }))
    const { error } = await supabase.from("structure_members").insert(payload)
    setImporting(false)
    if (error) throw new Error(error.message)
    fetchMembers()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
        <h1 className="font-display text-2xl font-bold md:text-3xl">Manajemen Anggota</h1>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="border-line" onClick={() => setShowImport(true)}>
            <Upload className="w-4 h-4 mr-2" /> Import Data
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger
              render={
                <Button className="gradient-primary">
                  <Plus className="w-4 h-4 mr-2" /> Tambah Anggota
                </Button>
              }
            />
            <DialogContent className="glass border-line">
              <DialogHeader>
                <DialogTitle className="font-display">{currentMember ? 'Edit Anggota' : 'Tambah Anggota'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama</Label>
                  <Input id="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="position">Jabatan</Label>
                    <Input id="position" value={formData.position} onChange={(e) => setFormData({...formData, position: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="division">Divisi</Label>
                    <Input id="division" value={formData.division} onChange={(e) => setFormData({...formData, division: e.target.value})} required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="generation">Generasi</Label>
                    <Input id="generation" value={formData.generation} onChange={(e) => setFormData({...formData, generation: e.target.value})} required placeholder="Generasi 24" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="kelas">Kelas / Jurusan</Label>
                    <Input id="kelas" value={formData.kelas} onChange={(e) => setFormData({...formData, kelas: e.target.value})} placeholder="XII TKJ 2" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Foto</Label>
                  <ImageUpload value={formData.photo_url} onChange={(url) => setFormData({ ...formData, photo_url: url })} />
                </div>
                <Button type="submit" className="gradient-primary w-full">Simpan</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="glass border-line p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama anggota..."
            className="h-9 w-full border-line bg-soft text-sm sm:w-56"
          />
          <Select value={mode} onValueChange={(v) => setMode(v ?? "nama-a")}>
            <SelectTrigger className="h-9 w-full border-line bg-soft text-xs sm:w-64"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="nama-a">Urutkan: Nama (A-Z)</SelectItem>
              <SelectItem value="nama-z">Urutkan: Nama (Z-A)</SelectItem>
              <SelectItem value="kelas">Urutkan: Kelas / Jurusan</SelectItem>
              <SelectItem value="generasi">Urutkan: Generasi</SelectItem>
              <SelectItem value="divisi">Urutkan: Divisi</SelectItem>
              <SelectItem value="jabatan">Urutkan: Jabatan</SelectItem>
              {distinct("kelas").map((k) => (
                <SelectItem key={`k:${k}`} value={`k:${k}`}>Kelas: {k}</SelectItem>
              ))}
              {distinct("generation").map((g) => (
                <SelectItem key={`g:${g}`} value={`g:${g}`}>Generasi: {g}</SelectItem>
              ))}
              {distinct("division").map((d) => (
                <SelectItem key={`d:${d}`} value={`d:${d}`}>Divisi: {d}</SelectItem>
              ))}
              {distinct("position").map((p) => (
                <SelectItem key={`j:${p}`} value={`j:${p}`}>Jabatan: {p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="glass border-line overflow-x-auto">
        <Table className="min-w-[640px]">
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Jabatan</TableHead>
              <TableHead>Divisi</TableHead>
              <TableHead>Generasi</TableHead>
              <TableHead>Kelas / Jurusan</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((member) => (
              <motion.tr
                key={member.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <TableCell className="font-medium">{member.name}</TableCell>
                <TableCell>{member.position}</TableCell>
                <TableCell>{member.division}</TableCell>
                <TableCell>{member.generation}</TableCell>
                <TableCell>{member.kelas || <span className="text-muted-foreground/50">—</span>}</TableCell>
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

      <ImportModal
        open={showImport}
        onClose={() => setShowImport(false)}
        type="anggota"
        title="Import Data Anggota"
        description="Unggah file Excel (.xlsx/.csv) atau Word (.docx) berisi data anggota — AI akan membaca, menyesuaikan, dan mengisi kolom secara otomatis. Periksa hasilnya sebelum disimpan."
        columns={[
          { key: "name", label: "Nama", required: true },
          { key: "position", label: "Jabatan", required: true },
          { key: "division", label: "Divisi", required: true },
          { key: "generation", label: "Generasi" },
          { key: "kelas", label: "Kelas / Jurusan" },
        ]}
        onImport={handleImport}
        importing={importing}
      />
    </div>
  )
}
