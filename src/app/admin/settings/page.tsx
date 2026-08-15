"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Save,
  CheckCircle2,
  Image,
  Palette,
  LayoutTemplate,
  Phone,
  FileText,
  Menu,
  Landmark,
  School,
  Award,
  Heading2,
  PictureInPicture2,
  Bot,
  Check,
} from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { DEFAULT_SETTINGS, type SiteSettings } from "@/contexts/SiteSettingsContext"
import { ImageUpload } from "@/components/image-upload"
import { ListEditor, type ListField } from "@/components/admin/ListEditor"

const SETTING_KEYS = [
  "colors", "hero", "branding", "contacts", "pages", "backgrounds", "nav",
  "heroExtras", "history", "philosophy", "school", "sectionTitles", "aiPrompt",
]

const OPTIONS: { key: string; icon: React.ComponentType<{ className?: string }>; title: string; desc: string }[] = [
  { key: "branding", icon: Image, title: "Logo & Identitas", desc: "Logo, nama organisasi & sekolah" },
  { key: "warna", icon: Palette, title: "Warna Tema", desc: "Palet warna seluruh website" },
  { key: "hero", icon: LayoutTemplate, title: "Editor Hero", desc: "Judul, slogan & tombol hero" },
  { key: "kontak", icon: Phone, title: "Kontak & Sosmed", desc: "WhatsApp, email & media sosial" },
  { key: "halaman", icon: FileText, title: "Teks Halaman", desc: "Pengantar tiap halaman publik" },
  { key: "navigasi", icon: Menu, title: "Menu Navigasi", desc: "Menu navbar & tautan footer" },
  { key: "sejarah", icon: Landmark, title: "Sejarah", desc: "Timeline perjalanan organisasi" },
  { key: "sekolah", icon: School, title: "Sekolah", desc: "Profil & kartu bento sekolah" },
  { key: "filosofi", icon: Award, title: "Filosofi Logo", desc: "Makna lambang logo paskibra" },
  { key: "judul", icon: Heading2, title: "Judul Section", desc: "Label & judul tiap section" },
  { key: "background", icon: PictureInPicture2, title: "Background", desc: "Foto watermark halaman" },
  { key: "ai", icon: Bot, title: "AI Prompt", desc: "Prompt bot Tanya Satria" },
]

export default function SettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS)
  const [active, setActive] = useState("branding")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    const { data } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", SETTING_KEYS)

    if (data && data.length > 0) {
      const merged: SiteSettings = { ...DEFAULT_SETTINGS }
      for (const row of data) {
        if (row.value && typeof row.value === "object") {
          const key = row.key as keyof SiteSettings
          if (key in merged && merged[key] && typeof merged[key] === "object") {
            ;(merged[key] as Record<string, unknown>) = {
              ...(merged[key] as Record<string, unknown>),
              ...(row.value as Record<string, unknown>),
            }
          }
        } else if (row.key === "aiPrompt" && typeof row.value === "string") {
          merged.aiPrompt = row.value
        }
      }
      setSettings(merged)
    }
    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    for (const key of SETTING_KEYS) {
      const { error } = await supabase.from("site_settings").upsert(
        { key, value: settings[key as keyof SiteSettings] },
        { onConflict: "key" }
      )
      if (error) console.error(`Gagal simpan ${key}:`, error.message)
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const updateSetting = <G extends keyof SiteSettings>(
    group: G,
    field: string,
    value: string
  ) => {
    setSettings((prev) => ({
      ...prev,
      [group]: {
        ...(prev[group] as Record<string, unknown>),
        [field]: value,
      } as SiteSettings[G],
    }))
  }

  const updateArr = <G extends keyof SiteSettings>(group: G, field: string, items: unknown[]) => {
    setSettings((prev) => ({
      ...prev,
      [group]: {
        ...(prev[group] as Record<string, unknown>),
        [field]: items,
      } as SiteSettings[G],
    }))
  }

  const renderSection = () => {
    switch (active) {
      case "branding":
        return (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="glass border-line">
              <CardHeader>
                <CardTitle className="font-display">Logo & Identitas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Logo Paskibra</Label>
                  <ImageUpload value={settings.branding.logoUrl} onChange={(url) => updateSetting("branding", "logoUrl", url)} />
                </div>
                <div className="space-y-2">
                  <Label>Logo Sekolah</Label>
                  <ImageUpload value={settings.branding.schoolLogoUrl} onChange={(url) => updateSetting("branding", "schoolLogoUrl", url)} />
                </div>
                <div className="space-y-2">
                  <Label>Nama Organisasi</Label>
                  <Input value={settings.branding.orgName} onChange={(e) => updateSetting("branding", "orgName", e.target.value)} className="glass border-line" />
                </div>
                <div className="space-y-2">
                  <Label>Nama Sekolah</Label>
                  <Input value={settings.branding.schoolName} onChange={(e) => updateSetting("branding", "schoolName", e.target.value)} className="glass border-line" />
                </div>
              </CardContent>
            </Card>
            <Card className="glass border-line">
              <CardHeader>
                <CardTitle className="font-display">Tentang Organisasi</CardTitle>
                <p className="text-sm text-muted-foreground">Teks profil singkat yang tampil di footer dan halaman.</p>
              </CardHeader>
              <CardContent>
                <Textarea value={settings.pages.aboutText} onChange={(e) => updateSetting("pages", "aboutText", e.target.value)} rows={6} className="glass border-line resize-none" />
              </CardContent>
            </Card>
          </div>
        )

      case "warna":
        return (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="glass border-line">
              <CardHeader>
                <CardTitle className="font-display">Palet Warna</CardTitle>
                <p className="text-sm text-muted-foreground">Klik kotak warna untuk memilih, atau ketik kode hex di bawahnya.</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {Object.entries(settings.colors)
                    .filter(([key]) => key !== "background")
                    .map(([key, value]) => (
                      <div key={key} className="rounded-xl border border-line bg-soft/50 p-3">
                        <div className="relative h-14 w-full overflow-hidden rounded-lg border border-line">
                          <input
                            type="color"
                            value={value}
                            onChange={(e) => updateSetting("colors", key, e.target.value)}
                            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                            aria-label={`Pilih warna ${key}`}
                          />
                          <div className="absolute inset-0" style={{ backgroundColor: value }} />
                          <span className="absolute bottom-1 right-1 rounded bg-black/50 px-1 py-0.5 text-[9px] font-mono text-white/90">
                            {value}
                          </span>
                        </div>
                        <Label className="mt-2 block text-xs capitalize">{key}</Label>
                        <Input value={value} onChange={(e) => updateSetting("colors", key, e.target.value)} className="mt-1.5 h-8 border-line bg-card font-mono text-xs" />
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
            <Card className="glass border-line">
              <CardHeader>
                <CardTitle className="font-display">Live Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex min-h-[220px] flex-col items-center justify-center gap-4 rounded-xl border border-line p-8 transition-colors duration-300" style={{ backgroundColor: "var(--background)" }}>
                  <span className="font-display text-3xl font-bold transition-colors" style={{ color: settings.colors.accent }}>
                    {settings.branding.orgName.toUpperCase()}
                  </span>
                  <span className="rounded-full px-4 py-2 font-medium transition-colors" style={{ backgroundColor: settings.colors.primary, color: "#fff", boxShadow: `0 0 20px ${settings.colors.primary}66` }}>
                    Tombol Utama
                  </span>
                  <span className="h-2 w-24 rounded-full" style={{ background: `linear-gradient(90deg, ${settings.colors.primary}, ${settings.colors.secondary})` }} />
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case "hero":
        return (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="glass border-line">
              <CardHeader>
                <CardTitle className="font-display">Editor Hero Section</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Judul Utama</Label>
                  <Input value={settings.hero.title} onChange={(e) => updateSetting("hero", "title", e.target.value)} className="glass border-line" />
                </div>
                <div className="space-y-2">
                  <Label>Subjudul / Slogan</Label>
                  <Textarea value={settings.hero.subtitle} onChange={(e) => updateSetting("hero", "subtitle", e.target.value)} rows={3} className="glass border-line resize-none" />
                </div>
                <div className="space-y-2">
                  <Label>Teks Tombol CTA</Label>
                  <Input value={settings.hero.ctaText} onChange={(e) => updateSetting("hero", "ctaText", e.target.value)} className="glass border-line" />
                </div>
                <div className="space-y-2">
                  <Label>Tombol Sekunder (Sewa)</Label>
                  <Input value={settings.heroExtras.secondaryCta} onChange={(e) => updateSetting("heroExtras", "secondaryCta", e.target.value)} className="glass border-line" />
                </div>
              </CardContent>
            </Card>
            <Card className="glass border-line">
              <CardHeader>
                <CardTitle className="font-display">Statistik Hero</CardTitle>
                <p className="text-sm text-muted-foreground">Angka prestasi yang tampil di bawah tombol hero.</p>
              </CardHeader>
              <CardContent>
                <ListEditor
                  fields={[
                    { key: "value", label: "Nilai", placeholder: "45+" },
                    { key: "label", label: "Label", placeholder: "Anggota Aktif" },
                  ]}
                  items={settings.heroExtras.stats}
                  onChange={(items) => updateArr("heroExtras", "stats", items)}
                  itemLabel="Statistik"
                  addText="Tambah Statistik"
                />
              </CardContent>
            </Card>
          </div>
        )

      case "kontak":
        return (
          <Card className="glass border-line">
            <CardHeader>
              <CardTitle className="font-display">Kontak & Media Sosial</CardTitle>
              <p className="text-sm text-muted-foreground">Nomor WhatsApp dipakai tombol WA & tombol sewa. URL Instagram/TikTok tampil di footer.</p>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Nomor WhatsApp (format internasional)</Label>
                <Input value={settings.contacts.waNumber} onChange={(e) => updateSetting("contacts", "waNumber", e.target.value)} placeholder="6281234567890" className="glass border-line font-mono" />
              </div>
              <div className="space-y-2">
                <Label>Nomor Telepon (tampilan)</Label>
                <Input value={settings.contacts.phone} onChange={(e) => updateSetting("contacts", "phone", e.target.value)} placeholder="0812-3456-7890" className="glass border-line" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={settings.contacts.email} onChange={(e) => updateSetting("contacts", "email", e.target.value)} placeholder="satriacengkara@gmail.com" className="glass border-line" />
              </div>
              <div className="space-y-2">
                <Label>Alamat</Label>
                <Input value={settings.contacts.address} onChange={(e) => updateSetting("contacts", "address", e.target.value)} placeholder="SMKN 1 Kertosono, Kab. Nganjuk, Jawa Timur" className="glass border-line" />
              </div>
              <div className="space-y-2">
                <Label>URL Instagram</Label>
                <Input value={settings.contacts.instagram} onChange={(e) => updateSetting("contacts", "instagram", e.target.value)} placeholder="https://www.instagram.com/..." className="glass border-line" />
              </div>
              <div className="space-y-2">
                <Label>URL TikTok</Label>
                <Input value={settings.contacts.tiktok} onChange={(e) => updateSetting("contacts", "tiktok", e.target.value)} placeholder="https://www.tiktok.com/@..." className="glass border-line" />
              </div>
            </CardContent>
          </Card>
        )

      case "halaman":
        return (
          <Card className="glass border-line">
            <CardHeader>
              <CardTitle className="font-display">Teks Halaman</CardTitle>
              <p className="text-sm text-muted-foreground">Teks pengantar setiap halaman publik di website ini.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {(
                [
                  ["galeriIntro", "Halaman Galeri"],
                  ["layananIntro", "Halaman Layanan Sewa"],
                  ["saranIntro", "Halaman Kotak Saran"],
                  ["pengurusIntro", "Halaman Pengurus"],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="space-y-2">
                  <Label>{label}</Label>
                  <Textarea value={settings.pages[key]} onChange={(e) => updateSetting("pages", key, e.target.value)} rows={2} className="glass border-line resize-none" />
                </div>
              ))}
            </CardContent>
          </Card>
        )

      case "navigasi":
        return (
          <Card className="glass border-line">
            <CardHeader>
              <CardTitle className="font-display">Menu Navigasi</CardTitle>
              <p className="text-sm text-muted-foreground">Menu navbar (beranda) dan tautan footer. Href memakai anchor, contoh: #sejarah atau /layanan.</p>
            </CardHeader>
            <CardContent>
              <ListEditor
                fields={[
                  { key: "label", label: "Label Menu", placeholder: "Sejarah" },
                  { key: "href", label: "Tautan (href)", placeholder: "#sejarah" },
                ]}
                items={settings.nav.links}
                onChange={(items) => updateArr("nav", "links", items)}
                itemLabel="Menu"
                addText="Tambah Menu"
              />
            </CardContent>
          </Card>
        )

      case "sejarah":
        return (
          <Card className="glass border-line">
            <CardHeader>
              <CardTitle className="font-display">Editor Sejarah</CardTitle>
              <p className="text-sm text-muted-foreground">Judul section dan timeline perjalanan organisasi.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Label</Label>
                  <Input value={settings.history.label} onChange={(e) => updateSetting("history", "label", e.target.value)} className="glass border-line" />
                </div>
                <div className="space-y-2">
                  <Label>Judul</Label>
                  <Input value={settings.history.title} onChange={(e) => updateSetting("history", "title", e.target.value)} className="glass border-line" />
                </div>
                <div className="space-y-2">
                  <Label>Subjudul</Label>
                  <Input value={settings.history.subtitle} onChange={(e) => updateSetting("history", "subtitle", e.target.value)} className="glass border-line" />
                </div>
              </div>
              <div className="pt-2">
                <p className="mb-3 text-xs font-semibold text-muted-foreground">Timeline Sejarah</p>
                <ListEditor
                  fields={[
                    { key: "year", label: "Tahun", placeholder: "2018" },
                    { key: "title", label: "Judul", placeholder: "Lahirnya Satria Cengkara" },
                    { key: "desc", label: "Deskripsi", type: "textarea", placeholder: "Cerita singkat..." },
                  ]}
                  items={settings.history.timeline}
                  onChange={(items) => updateArr("history", "timeline", items)}
                  itemLabel="Tahun"
                  addText="Tambah Timeline"
                />
              </div>
            </CardContent>
          </Card>
        )

      case "sekolah":
        return (
          <Card className="glass border-line">
            <CardHeader>
              <CardTitle className="font-display">Editor Sekolah</CardTitle>
              <p className="text-sm text-muted-foreground">Section profil sekolah di beranda — teks dan gambar dapat diubah.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Label</Label>
                  <Input value={settings.school.label} onChange={(e) => updateSetting("school", "label", e.target.value)} className="glass border-line" />
                </div>
                <div className="space-y-2">
                  <Label>Judul</Label>
                  <Input value={settings.school.title} onChange={(e) => updateSetting("school", "title", e.target.value)} className="glass border-line" />
                </div>
                <div className="space-y-2">
                  <Label>Subjudul</Label>
                  <Input value={settings.school.subtitle} onChange={(e) => updateSetting("school", "subtitle", e.target.value)} className="glass border-line" />
                </div>
              </div>
              <div className="pt-2">
                <p className="mb-3 text-xs font-semibold text-muted-foreground">Kartu Bento (5 kartu)</p>
                <ListEditor
                  fields={[
                    { key: "title", label: "Judul Kartu", placeholder: "Profil Sekolah" },
                    { key: "content", label: "Isi Teks", type: "textarea", placeholder: "Deskripsi..." },
                    { key: "image", label: "Gambar", type: "image" },
                  ]}
                  items={settings.school.items}
                  onChange={(items) => updateArr("school", "items", items)}
                  itemLabel="Kartu"
                  addText="Tambah Kartu"
                />
              </div>
            </CardContent>
          </Card>
        )

      case "filosofi":
        return (
          <Card className="glass border-line">
            <CardHeader>
              <CardTitle className="font-display">Editor Filosofi Logo</CardTitle>
              <p className="text-sm text-muted-foreground">Makna lambang logo yang tampil di beranda.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Label</Label>
                  <Input value={settings.philosophy.label} onChange={(e) => updateSetting("philosophy", "label", e.target.value)} className="glass border-line" />
                </div>
                <div className="space-y-2">
                  <Label>Judul</Label>
                  <Input value={settings.philosophy.title} onChange={(e) => updateSetting("philosophy", "title", e.target.value)} className="glass border-line" />
                </div>
              </div>
              <div className="pt-2">
                <p className="mb-3 text-xs font-semibold text-muted-foreground">Item Filosofi</p>
                <ListEditor
                  fields={[
                    { key: "title", label: "Judul", placeholder: "Sang Merah Putih" },
                    { key: "desc", label: "Deskripsi", type: "textarea", placeholder: "Makna..." },
                  ]}
                  items={settings.philosophy.items}
                  onChange={(items) => updateArr("philosophy", "items", items)}
                  itemLabel="Filosofi"
                  addText="Tambah Item"
                />
              </div>
            </CardContent>
          </Card>
        )

      case "judul":
        return (
          <Card className="glass border-line">
            <CardHeader>
              <CardTitle className="font-display">Judul Section</CardTitle>
              <p className="text-sm text-muted-foreground">Label dan judul setiap section di halaman utama.</p>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {[
                ["galeriLabel", "Label Galeri"],
                ["galeriTitle", "Judul Galeri"],
                ["layananLabel", "Label Layanan"],
                ["layananTitle", "Judul Layanan"],
                ["pengurusLabel", "Label Pengurus"],
                ["pengurusTitle", "Judul Pengurus"],
                ["saranLabel", "Label Saran"],
                ["saranTitle", "Judul Saran"],
              ].map(([key, label]) => (
                <div key={key} className="space-y-2">
                  <Label>{label}</Label>
                  <Input value={settings.sectionTitles[key as keyof typeof settings.sectionTitles]} onChange={(e) => updateSetting("sectionTitles", key, e.target.value)} className="glass border-line" />
                </div>
              ))}
            </CardContent>
          </Card>
        )

      case "background":
        return (
          <Card className="glass border-line">
            <CardHeader>
              <CardTitle className="font-display">Gambar Background</CardTitle>
              <p className="text-sm text-muted-foreground">Foto watermark yang tampil di sudut-sudut background seluruh halaman (kanan-atas: pemuda, kiri-bawah: pemudi).</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Foto Pemuda (kanan atas)</Label>
                  <ImageUpload value={settings.backgrounds.watermarkPemuda} onChange={(url) => updateSetting("backgrounds", "watermarkPemuda", url)} />
                </div>
                <div className="space-y-2">
                  <Label>Foto Pemudi (kiri bawah)</Label>
                  <ImageUpload value={settings.backgrounds.watermarkPemudi} onChange={(url) => updateSetting("backgrounds", "watermarkPemudi", url)} />
                </div>
              </div>
            </CardContent>
          </Card>
        )

      case "ai":
        return (
          <Card className="glass border-line">
            <CardHeader>
              <CardTitle className="font-display">AI System Prompt Config</CardTitle>
              <p className="text-sm text-muted-foreground">Prompt ini digunakan oleh Tanya Satria Bot saat menjawab pengunjung.</p>
            </CardHeader>
            <CardContent>
              <Textarea
                value={settings.aiPrompt}
                onChange={(e) => setSettings((prev) => ({ ...prev, aiPrompt: e.target.value }))}
                rows={8}
                className="glass border-line resize-none font-mono text-sm"
              />
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  const current = OPTIONS.find((o) => o.key === active) ?? OPTIONS[0]

  if (loading) {
    return <div className="flex h-64 items-center justify-center">Memuat pengaturan...</div>
  }

  return (
    <div className="min-w-0 space-y-6 overflow-x-hidden">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-2xl font-bold md:text-3xl">CMS & Pengaturan Situs</h1>
        <p className="text-sm text-muted-foreground">Pilih opsi di atas, lalu edit isinya di panel bawah.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {OPTIONS.map((opt) => {
          const isActive = opt.key === active
          const Icon = opt.icon
          return (
            <motion.button
              key={opt.key}
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => setActive(opt.key)}
              className={[
                "relative flex items-start gap-3 rounded-2xl border p-4 text-left transition-all",
                isActive
                  ? "border-primary/60 bg-primary/10 shadow-[0_0_0_1px] shadow-primary/30"
                  : "border-line bg-card/60 hover:border-primary/30 hover:bg-card",
              ].join(" ")}
            >
              {isActive && (
                <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
                  <Check className="h-3 w-3" />
                </span>
              )}
              <span
                className={[
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                  isActive ? "bg-primary/20 text-primary" : "bg-soft text-muted-foreground",
                ].join(" ")}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className={["block font-semibold", isActive ? "text-primary" : ""].join(" ")}>
                  {opt.title}
                </span>
                <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                  {opt.desc}
                </span>
              </span>
            </motion.button>
          )
        })}
      </div>

      <Card className="glass border-line">
        <CardHeader className="flex flex-row items-center gap-3 border-b border-line pb-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary">
            {(() => {
              const Icon = current.icon
              return <Icon className="h-5 w-5" />
            })()}
          </span>
          <div className="min-w-0">
            <CardTitle className="font-display">Form Editor: {current.title}</CardTitle>
            <p className="text-sm text-muted-foreground">{current.desc}</p>
          </div>
        </CardHeader>
        <CardContent className="pt-5">
          {renderSection()}
        </CardContent>
        <div className="flex flex-col-reverse gap-3 border-t border-line px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Perubahan disimpan ke database dan langsung tampil di website.
          </p>
          <Button onClick={handleSave} disabled={saving} className="gradient-primary w-full sm:w-auto">
            {saved ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
            {saving ? "Menyimpan..." : saved ? "Tersimpan!" : "Simpan Perubahan"}
          </Button>
        </div>
      </Card>
    </div>
  )
}
