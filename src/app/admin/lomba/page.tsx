"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase/client"
import { RequireRole } from "@/components/require-role"
import { useSiteSettings, SiteSettings } from "@/contexts/SiteSettingsContext"
import { ListEditor } from "@/components/admin/ListEditor"
import { ImageUpload } from "@/components/image-upload"
import { cn } from "@/lib/utils"
import {
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  Save,
  Check,
  Users,
  Clock,
  Wallet,
  LayoutGrid,
  Rows3,
  Search,
  Megaphone,
  FileText,
  Upload,
  Download,
} from "lucide-react"

interface Participant {
  id: string
  school_name: string
  contact: string
  category: string
  payment_status: string
  amount: number
  notes: string
  created_at: string
}

const STATUS_META: Record<string, { label: string; badge: string; chip: string }> = {
  belum: { label: "Belum Bayar", badge: "bg-muted text-muted-foreground", chip: "text-muted-foreground border-line" },
  dp: { label: "DP", badge: "bg-amber-500/15 text-amber-500", chip: "text-amber-500 border-amber-500/40" },
  lunas: { label: "Lunas", badge: "bg-emerald-500/15 text-emerald-500", chip: "text-emerald-500 border-emerald-500/40" },
}

function formatIDR(n: number) {
  return "Rp " + (n || 0).toLocaleString("id-ID")
}

function ParticipantsManager() {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [filter, setFilter] = useState("semua")
  const [search, setSearch] = useState("")
  const [view, setView] = useState<"table" | "grid">("table")
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState<Participant | null>(null)
  const [form, setForm] = useState({
    school_name: "",
    contact: "",
    category: "",
    payment_status: "belum",
    amount: "0",
    notes: "",
  })

  const fetchAll = async () => {
    const { data } = await supabase.from("lkbb_participants").select("*").order("created_at", { ascending: false })
    setParticipants(data || [])
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch async dari Supabase (setState setelah await, bukan sinkron)
    fetchAll()
  }, [])

  const stats = {
    total: participants.length,
    belum: participants.filter((p) => p.payment_status === "belum").length,
    dp: participants.filter((p) => p.payment_status === "dp").length,
    lunas: participants.filter((p) => p.payment_status === "lunas").length,
    transfer: participants
      .filter((p) => p.payment_status !== "belum")
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
  }

  const filtered = participants.filter((p) => {
    if (filter !== "semua" && p.payment_status !== filter) return false
    if (search && !p.school_name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = { ...form, amount: Number(form.amount) || 0 }
    if (current) {
      await supabase.from("lkbb_participants").update(payload).eq("id", current.id)
    } else {
      await supabase.from("lkbb_participants").insert(payload)
    }
    fetchAll()
    setOpen(false)
  }

  const handleEdit = (p: Participant) => {
    setCurrent(p)
    setForm({
      school_name: p.school_name,
      contact: p.contact || "",
      category: p.category || "",
      payment_status: p.payment_status,
      amount: String(p.amount || 0),
      notes: p.notes || "",
    })
    setOpen(true)
  }

  const handleDelete = async (id: string) => {
    await supabase.from("lkbb_participants").delete().eq("id", id)
    fetchAll()
  }

  const statCards = [
    { label: "Total Terdaftar", value: String(stats.total), icon: Users, tint: "text-accent" },
    { label: "Belum Bayar", value: String(stats.belum), icon: Clock, tint: "text-muted-foreground" },
    { label: "DP", value: String(stats.dp), icon: Wallet, tint: "text-amber-500" },
    { label: "Lunas", value: String(stats.lunas), icon: Check, tint: "text-emerald-500" },
    { label: "Total Transfer Masuk", value: formatIDR(stats.transfer), icon: Wallet, tint: "text-emerald-500" },
  ]

  const chips = [
    { key: "semua", label: "Semua" },
    { key: "belum", label: "Belum Bayar" },
    { key: "dp", label: "DP" },
    { key: "lunas", label: "Lunas" },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {statCards.map((s) => (
          <Card key={s.label} className="glass border-line p-4">
            <div className="flex items-center gap-2">
              <s.icon className={cn("h-4 w-4", s.tint)} />
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {s.label}
              </p>
            </div>
            <p className="mt-2 font-display text-lg font-bold">{s.value}</p>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {chips.map((c) => (
            <Button
              key={c.key}
              variant="outline"
              size="sm"
              onClick={() => setFilter(c.key)}
              className={cn(
                "border-line",
                filter === c.key && "bg-accent text-black border-accent"
              )}
            >
              {c.label}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama sekolah…"
              className="h-9 w-44 pl-8 border-line bg-card sm:w-56"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 border-line"
            onClick={() => setView(view === "table" ? "grid" : "table")}
            title={view === "table" ? "Tampilan Grid" : "Tampilan Tabel"}
          >
            {view === "table" ? <LayoutGrid className="h-4 w-4" /> : <Rows3 className="h-4 w-4" />}
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
              render={
                <Button className="gradient-primary h-9">
                  <Plus className="mr-1.5 h-4 w-4" /> Tambah Peserta
                </Button>
              }
            />
            <DialogContent className="glass border-line">
              <DialogHeader>
                <DialogTitle className="font-display">
                  {current ? "Edit Peserta" : "Tambah Peserta"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="school_name">Nama Sekolah</Label>
                  <Input
                    id="school_name"
                    value={form.school_name}
                    onChange={(e) => setForm({ ...form, school_name: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="category">Kategori / Tingkat</Label>
                    <Input
                      id="category"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      placeholder="SMP / MTs"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact">Kontak Panitia</Label>
                    <Input
                      id="contact"
                      value={form.contact}
                      onChange={(e) => setForm({ ...form, contact: e.target.value })}
                      placeholder="No. WhatsApp"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Status Pembayaran</Label>
                    <Select
                      value={form.payment_status}
                      onValueChange={(v) => setForm({ ...form, payment_status: v || "belum" })}
                    >
                      <SelectTrigger className="border-line bg-card">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="belum">Belum Bayar</SelectItem>
                        <SelectItem value="dp">DP</SelectItem>
                        <SelectItem value="lunas">Lunas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Nominal Dibayar (Rp)</Label>
                    <Input
                      id="amount"
                      type="number"
                      min={0}
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Catatan</Label>
                  <Textarea
                    id="notes"
                    rows={2}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="resize-none border-line bg-card"
                    placeholder="Bukti transfer, pelunasan, dll."
                  />
                </div>
                <Button type="submit" className="gradient-primary w-full">
                  Simpan
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="glass border-line p-10 text-center text-sm text-muted-foreground">
          Belum ada peserta untuk filter ini.
        </Card>
      ) : view === "table" ? (
        <Card className="glass border-line overflow-x-auto">
          <Table className="min-w-[760px]">
            <TableHeader>
              <TableRow>
                <TableHead>Nama Sekolah</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Kontak</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Nominal</TableHead>
                <TableHead>Tanggal Daftar</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <TableCell className="font-medium">{p.school_name}</TableCell>
                  <TableCell>{p.category || <span className="text-muted-foreground/50">—</span>}</TableCell>
                  <TableCell className="text-xs">{p.contact || "—"}</TableCell>
                  <TableCell>
                    <Badge className={cn(STATUS_META[p.payment_status]?.badge)}>
                      {STATUS_META[p.payment_status]?.label || p.payment_status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatIDR(Number(p.amount))}</TableCell>
                  <TableCell className="text-xs">
                    {new Date(p.created_at).toLocaleDateString("id-ID")}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(p)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-line bg-card p-4 card-glow"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-display text-sm font-bold leading-tight">{p.school_name}</h3>
                <Badge className={cn("shrink-0", STATUS_META[p.payment_status]?.badge)}>
                  {STATUS_META[p.payment_status]?.label}
                </Badge>
              </div>
              <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                {p.category && <p>Kategori: {p.category}</p>}
                {p.contact && <p>Kontak: {p.contact}</p>}
                <p>Nominal: {formatIDR(Number(p.amount))}</p>
                <p>Daftar: {new Date(p.created_at).toLocaleDateString("id-ID")}</p>
                {p.notes && <p className="text-muted-foreground/70">Catatan: {p.notes}</p>}
              </div>
              <div className="mt-3 flex justify-end gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(p)}>
                  <Edit className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(p.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

function InfoEditor() {
  const { settings, loading, refresh } = useSiteSettings()
  const [lkbb, setLkbb] = useState(settings.lkbb)
  const [ready, setReady] = useState(!loading)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState("")

  if (!ready && !loading) {
    setLkbb(settings.lkbb)
    setReady(true)
  }

  const update = (field: string, value: string) => {
    setLkbb((prev) => ({ ...prev, [field]: value }) as SiteSettings["lkbb"])
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveError("")
    const { error } = await supabase.from("site_settings").upsert({ key: "lkbb", value: lkbb }, { onConflict: "key" })
    setSaving(false)
    if (error) {
      setSaveError("Gagal menyimpan: " + error.message)
      return
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    refresh()
  }

  if (!ready) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
        Memuat data lomba…
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-display text-lg font-bold">Edit Info LKBB</h2>
        <div className="flex gap-2">
          <a href="/lomba" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="border-line">
              <ExternalLink className="mr-1.5 h-4 w-4" /> Buka Halaman Lomba
            </Button>
          </a>
          <Button onClick={handleSave} className="gradient-primary" disabled={saving}>
            {saved ? <Check className="mr-1.5 h-4 w-4" /> : <Save className="mr-1.5 h-4 w-4" />}
            {saved ? "Tersimpan" : saving ? "Menyimpan…" : "Simpan Perubahan"}
          </Button>
        </div>
      </div>
      {saveError && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
          {saveError}
        </p>
      )}

      <Card className="glass border-line p-5">
        <p className="mb-4 text-sm font-semibold">Header Halaman</p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Label</Label>
            <Input value={lkbb.label} onChange={(e) => update("label", e.target.value)} className="border-line bg-card" />
          </div>
          <div className="space-y-2">
            <Label>Judul</Label>
            <Input value={lkbb.title} onChange={(e) => update("title", e.target.value)} className="border-line bg-card" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Subjudul</Label>
            <Input value={lkbb.subtitle} onChange={(e) => update("subtitle", e.target.value)} className="border-line bg-card" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Pengantar</Label>
            <Textarea value={lkbb.intro} onChange={(e) => update("intro", e.target.value)} rows={3} className="resize-none border-line bg-card" />
          </div>
        </div>
      </Card>

      <Card className="glass border-line p-5">
        <p className="mb-4 text-sm font-semibold">Detail Lomba</p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Tanggal Pelaksanaan</Label>
            <Input value={lkbb.date} onChange={(e) => update("date", e.target.value)} className="border-line bg-card" />
          </div>
          <div className="space-y-2">
            <Label>Lokasi</Label>
            <Input value={lkbb.location} onChange={(e) => update("location", e.target.value)} className="border-line bg-card" />
          </div>
          <div className="space-y-2">
            <Label>Biaya Pendaftaran</Label>
            <Input value={lkbb.fee} onChange={(e) => update("fee", e.target.value)} className="border-line bg-card" />
          </div>
          <div className="space-y-2">
            <Label>Batas Pendaftaran</Label>
            <Input value={lkbb.registrationDeadline} onChange={(e) => update("registrationDeadline", e.target.value)} className="border-line bg-card" />
          </div>
          <div className="space-y-2">
            <Label>WhatsApp CTA (format: 628xxx)</Label>
            <Input value={lkbb.whatsapp} onChange={(e) => update("whatsapp", e.target.value)} className="border-line bg-card" />
          </div>
        </div>
        <div className="mt-5 space-y-3">
          <p className="text-xs text-muted-foreground">
            Kontak Info & Pendaftaran (nomor + nama penanggung jawab)
          </p>
          <ListEditor
            fields={[
              { key: "name", label: "Nama", placeholder: "contoh: Kak Arzety" },
              { key: "number", label: "Nomor WhatsApp", placeholder: "contoh: +62 895-2548-0975" },
            ]}
            items={lkbb.contacts}
            onChange={(items) => setLkbb((prev) => ({ ...prev, contacts: items }) as SiteSettings["lkbb"])}
            itemLabel="Kontak"
            addText="Tambah Kontak"
            max={4}
          />
        </div>
      </Card>

      <Card className="glass border-line p-5">
        <p className="mb-4 text-sm font-semibold">Syarat & Ketentuan</p>
        <ListEditor
          fields={[
            { key: "title", label: "Judul", placeholder: "contoh: Peserta" },
            { key: "desc", label: "Deskripsi", type: "textarea", placeholder: "Isi aturan…" },
          ]}
          items={lkbb.rules}
          onChange={(items) => setLkbb((prev) => ({ ...prev, rules: items }) as SiteSettings["lkbb"])}
          itemLabel="Aturan"
          addText="Tambah Aturan"
          max={8}
        />
      </Card>

      <Card className="glass border-line p-5">
        <p className="mb-4 text-sm font-semibold">Alur Pendaftaran</p>
        <ListEditor
          fields={[
            { key: "title", label: "Langkah", placeholder: "contoh: Isi Formulir" },
            { key: "desc", label: "Deskripsi", type: "textarea", placeholder: "Penjelasan langkah…" },
          ]}
          items={lkbb.steps}
          onChange={(items) => setLkbb((prev) => ({ ...prev, steps: items }) as SiteSettings["lkbb"])}
          itemLabel="Langkah"
          addText="Tambah Langkah"
          max={6}
        />
      </Card>

      <Card className="glass border-line p-5">
        <p className="mb-4 text-sm font-semibold">Hadiah / Juara</p>
        <ListEditor
          fields={[
            { key: "title", label: "Juara", placeholder: "contoh: Juara 1" },
            { key: "desc", label: "Hadiah", type: "textarea", placeholder: "Detail hadiah…" },
          ]}
          items={lkbb.prizes}
          onChange={(items) => setLkbb((prev) => ({ ...prev, prizes: items }) as SiteSettings["lkbb"])}
          itemLabel="Hadiah"
          addText="Tambah Hadiah"
          max={6}
        />
      </Card>

      <Card className="glass border-line p-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold">Media (Gambar & Video)</p>
          <Button
            variant="outline"
            size="sm"
            className="border-dashed border-line"
            onClick={() => setLkbb((prev) => ({ ...prev, media: [...prev.media, { type: "video", url: "" }] }) as SiteSettings["lkbb"])}
          >
            <Plus className="mr-1 h-3.5 w-3.5" /> Tambah Item
          </Button>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          <span className="text-accent">Gunakan link YouTube</span> agar video tampil &amp; autoplay di halaman
          publik. Instagram &amp; TikTok tampil sebagai embed interaktif — pemutaran kadang harus diklik dan
          bisa membuka aplikasi/platform saat di HP.
        </p>
        <div className="space-y-4">
          {lkbb.media.map((m, i) => (
            <div key={i} className="rounded-xl border border-line bg-soft/50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex gap-1.5">
                  {(["image", "video"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() =>
                        setLkbb((prev) => ({
                          ...prev,
                          media: prev.media.map((x, j) => (j === i ? { ...x, type: t } : x)),
                        }) as SiteSettings["lkbb"])
                      }
                      className={cn(
                        "rounded-md px-2.5 py-1 text-[11px] font-semibold capitalize transition-colors",
                        m.type === t
                          ? "bg-accent text-black"
                          : "bg-card border border-line text-muted-foreground"
                      )}
                    >
                      {t === "image" ? "Gambar" : "Video"}
                    </button>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setLkbb((prev) => ({ ...prev, media: prev.media.filter((_, j) => j !== i) }) as SiteSettings["lkbb"])
                  }
                  className="h-7 w-7 p-0 text-red-400 hover:bg-red-500/10 hover:text-red-400"
                  aria-label={`Hapus media ${i + 1}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              {m.type === "image" ? (
                <ImageUpload
                  value={m.url}
                  onChange={(url) =>
                    setLkbb((prev) => ({
                      ...prev,
                      media: prev.media.map((x, j) => (j === i ? { ...x, url } : x)),
                    }) as SiteSettings["lkbb"])
                  }
                />
              ) : (
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground">Link video (YouTube / TikTok)</p>
                  <Input
                    value={m.url}
                    onChange={(e) =>
                      setLkbb((prev) => ({
                        ...prev,
                        media: prev.media.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)),
                      }) as SiteSettings["lkbb"])
                    }
                    placeholder="https://youtube.com/… atau https://tiktok.com/…"
                    className="border-line bg-card"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="gradient-primary" disabled={saving}>
          {saved ? <Check className="mr-1.5 h-4 w-4" /> : <Save className="mr-1.5 h-4 w-4" />}
          {saved ? "Tersimpan" : saving ? "Menyimpan…" : "Simpan Semua Perubahan"}
        </Button>
      </div>
    </div>
  )
}

interface UpdateRow {
  id: string
  title: string
  description: string
  image_url: string
  video_url: string
  created_at: string
}

interface DocumentRow {
  id: string
  title: string
  file_url: string
  file_name: string
  created_at: string
}

function UpdatesManager() {
  const [updates, setUpdates] = useState<UpdateRow[]>([])
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState<UpdateRow | null>(null)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({ title: "", description: "", image_url: "", video_url: "" })

  const fetchAll = async () => {
    const { data } = await supabase
      .from("lkbb_updates")
      .select("*")
      .order("created_at", { ascending: false })
    setUpdates(data || [])
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch async dari Supabase (setState setelah await, bukan sinkron)
    fetchAll()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.description.trim()) return
    if (current) {
      await supabase.from("lkbb_updates").update(form).eq("id", current.id)
    } else {
      await supabase.from("lkbb_updates").insert(form)
    }
    fetchAll()
    setOpen(false)
  }

  const handleEdit = (u: UpdateRow) => {
    setCurrent(u)
    setForm({ title: u.title, description: u.description, image_url: u.image_url || "", video_url: u.video_url || "" })
    setOpen(true)
  }

  const handleDelete = async (id: string) => {
    await supabase.from("lkbb_updates").delete().eq("id", id)
    fetchAll()
  }

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Pembaruan & keberlanjutan informasi lomba. Setiap update wajib memiliki deskripsi.
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={
              <Button className="gradient-primary h-9">
                <Plus className="mr-1.5 h-4 w-4" /> Tambah Update
              </Button>
            }
          />
          <DialogContent className="glass border-line max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">{current ? "Edit Update" : "Tambah Update"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="upd_title">Judul Update</Label>
                <Input
                  id="upd_title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="contoh: Technical Meeting H-1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="upd_desc" className="flex items-center gap-1">
                  Deskripsi <span className="text-red-400">*</span>
                </Label>
                <Textarea
                  id="upd_desc"
                  rows={4}
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="resize-none border-line bg-card"
                  placeholder="Isi informasi pembaruan lomba…"
                />
              </div>
              <div className="space-y-2">
                <Label>Gambar (opsional)</Label>
                <ImageUpload
                  value={form.image_url}
                  onChange={(url) => setForm({ ...form, image_url: url })}
                />
              </div>
              <div className="space-y-2">
                <Label>Link Video (opsional)</Label>
                <Input
                  value={form.video_url}
                  onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                  placeholder="https://youtube.com/… (disarankan), TikTok / IG Reel juga didukung"
                  className="border-line bg-card"
                />
                <p className="text-[10px] text-muted-foreground">
                  Link YouTube paling stabil &amp; autoplay. TikTok/IG tampil sebagai embed (klik untuk memutar,
                  di HP bisa membuka aplikasinya).
                </p>
              </div>
              <Button type="submit" className="gradient-primary w-full">
                Simpan
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {updates.length === 0 ? (
        <Card className="glass border-line p-10 text-center text-sm text-muted-foreground">
          Belum ada pembaruan lomba.
        </Card>
      ) : (
        <div className="space-y-3">
          {updates.map((u) => (
            <Card key={u.id} className="glass border-line p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-display text-sm font-bold">
                    {u.title || <span className="text-muted-foreground">(tanpa judul)</span>}
                  </h3>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{fmtDate(u.created_at)}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(u)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(u.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{u.description}</p>
              {(u.image_url || u.video_url) && (
                <p className="mt-2 text-[10px] text-muted-foreground">
                  {u.image_url && "Gambar"} {u.image_url && u.video_url && " + "} {u.video_url && "Video autoplay"}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function DocumentsManager() {
  const [docs, setDocs] = useState<DocumentRow[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")

  const fetchAll = async () => {
    const { data } = await supabase
      .from("lkbb_documents")
      .select("*")
      .order("created_at", { ascending: false })
    setDocs(data || [])
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch async dari Supabase (setState setelah await, bukan sinkron)
    fetchAll()
  }, [])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    setError("")
    setUploading(true)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/upload-document", {
        method: "POST",
        headers: { Authorization: `Bearer ${session?.access_token}` },
        body: fd,
      })
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error || "Upload gagal")
      const { error } = await supabase.from("lkbb_documents").insert({
        title: file.name.replace(/\.[^.]+$/, ""),
        file_url: data.url,
        file_name: data.fileName || file.name,
      })
      if (error) throw new Error(error.message)
      fetchAll()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload gagal")
    } finally {
      setUploading(false)
    }
  }

  const handleRename = async (id: string, title: string) => {
    const trimmed = title.trim()
    if (!trimmed) return
    await supabase.from("lkbb_documents").update({ title: trimmed }).eq("id", id)
    fetchAll()
  }

  const handleDelete = async (id: string) => {
    await supabase.from("lkbb_documents").delete().eq("id", id)
    fetchAll()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Unggah juknis, formulir, atau dokumen lomba lain (PDF/Word/Excel, maks. 20MB).
        </p>
        <label
          className={cn(
            "inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-accent px-4 text-xs font-bold text-black transition-opacity",
            uploading && "pointer-events-none opacity-60"
          )}
        >
          <Upload className="h-4 w-4" />
          {uploading ? "Mengunggah…" : "Upload Dokumen"}
          <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {docs.length === 0 ? (
        <Card className="glass border-line p-10 text-center text-sm text-muted-foreground">
          Belum ada dokumen terunggah.
        </Card>
      ) : (
        <div className="space-y-3">
          {docs.map((d) => (
            <Card key={d.id} className="glass border-line p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line bg-soft">
                    <FileText className="h-4 w-4 text-accent" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{d.title}</p>
                    <p className="truncate text-[10px] text-muted-foreground">
                      {d.file_name || "dokumen"} • {new Date(d.created_at).toLocaleDateString("id-ID")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    value={d.title}
                    onChange={(e) =>
                      setDocs((prev) => prev.map((x) => (x.id === d.id ? { ...x, title: e.target.value } : x)))
                    }
                    onBlur={() => handleRename(d.id, d.title)}
                    onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                    className="h-8 w-full rounded-lg border border-line bg-card px-2.5 text-xs outline-none focus:border-ring sm:w-48"
                    title="Nama tampilan dokumen (edit & tekan Enter)"
                  />
                  <a
                    href={d.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line text-muted-foreground transition-colors hover:text-foreground"
                    title="Unduh"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(d.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default function LombaAdmin() {
  const [tab, setTab] = useState<"peserta" | "info" | "updates" | "docs">("peserta")

  return (
    <RequireRole path="/admin/lomba">
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold md:text-3xl">Manajemen LKBB</h1>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className={cn("border-line", tab === "peserta" && "bg-accent text-black border-accent")}
            onClick={() => setTab("peserta")}
          >
            <Users className="mr-1.5 h-4 w-4" /> Kelola Peserta
          </Button>
          <Button
            variant="outline"
            className={cn("border-line", tab === "info" && "bg-accent text-black border-accent")}
            onClick={() => setTab("info")}
          >
            <Edit className="mr-1.5 h-4 w-4" /> Info Lomba
          </Button>
          <Button
            variant="outline"
            className={cn("border-line", tab === "updates" && "bg-accent text-black border-accent")}
            onClick={() => setTab("updates")}
          >
            <Megaphone className="mr-1.5 h-4 w-4" /> Pembaruan
          </Button>
          <Button
            variant="outline"
            className={cn("border-line", tab === "docs" && "bg-accent text-black border-accent")}
            onClick={() => setTab("docs")}
          >
            <FileText className="mr-1.5 h-4 w-4" /> Dokumen
          </Button>
        </div>
        {tab === "peserta" ? (
          <ParticipantsManager />
        ) : tab === "info" ? (
          <InfoEditor />
        ) : tab === "updates" ? (
          <UpdatesManager />
        ) : (
          <DocumentsManager />
        )}
      </div>
    </RequireRole>
  )
}
