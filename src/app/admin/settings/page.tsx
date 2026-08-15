"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Save, CheckCircle2 } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { DEFAULT_SETTINGS, type SiteSettings } from "@/contexts/SiteSettingsContext"
import { ImageUpload } from "@/components/image-upload"
import { ListEditor, type ListField } from "@/components/admin/ListEditor"

const SETTING_KEYS = [
  "colors", "hero", "branding", "contacts", "pages", "backgrounds", "nav",
  "heroExtras", "history", "philosophy", "school", "sectionTitles", "aiPrompt",
]

export default function SettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS)
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

  if (loading) {
    return <div className="flex items-center justify-center h-64">Memuat pengaturan...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
        <h1 className="font-display text-2xl font-bold md:text-3xl">CMS & Pengaturan Situs</h1>
        <Button onClick={handleSave} disabled={saving} className="gradient-primary w-full sm:w-auto">
          {saved ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          {saving ? "Menyimpan..." : saved ? "Tersimpan!" : "Simpan Semua"}
        </Button>
      </div>

      <Tabs defaultValue="branding" className="w-full">
        <TabsList className="glass border-line flex-wrap">
          <TabsTrigger value="branding">Logo & Branding</TabsTrigger>
          <TabsTrigger value="warna">Warna</TabsTrigger>
          <TabsTrigger value="hero">Hero</TabsTrigger>
          <TabsTrigger value="kontak">Kontak & Sosmed</TabsTrigger>
          <TabsTrigger value="halaman">Teks Halaman</TabsTrigger>
          <TabsTrigger value="navigasi">Navigasi</TabsTrigger>
          <TabsTrigger value="sejarah">Sejarah</TabsTrigger>
          <TabsTrigger value="sekolah">Sekolah</TabsTrigger>
          <TabsTrigger value="filosofi">Filosofi Logo</TabsTrigger>
          <TabsTrigger value="judul">Judul Section</TabsTrigger>
          <TabsTrigger value="background">Background</TabsTrigger>
          <TabsTrigger value="ai">AI Prompt</TabsTrigger>
        </TabsList>

        <TabsContent value="branding" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  <Input
                    value={settings.branding.orgName}
                    onChange={(e) => updateSetting("branding", "orgName", e.target.value)}
                    className="glass border-line"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nama Sekolah</Label>
                  <Input
                    value={settings.branding.schoolName}
                    onChange={(e) => updateSetting("branding", "schoolName", e.target.value)}
                    className="glass border-line"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-line">
              <CardHeader>
                <CardTitle className="font-display">Tentang Organisasi</CardTitle>
                <p className="text-sm text-muted-foreground">Teks profil singkat yang tampil di footer dan halaman.</p>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={settings.pages.aboutText}
                  onChange={(e) => updateSetting("pages", "aboutText", e.target.value)}
                  rows={6}
                  className="glass border-line resize-none"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="warna" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass border-line">
              <CardHeader>
                <CardTitle className="font-display">Palet Warna</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Klik kotak warna untuk memilih, atau ketik kode hex di bawahnya.
                </p>
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
                          <span
                            className="absolute bottom-1 right-1 rounded bg-black/50 px-1 py-0.5 text-[9px] font-mono text-white/90"
                          >
                            {value}
                          </span>
                        </div>
                        <Label className="mt-2 block text-xs capitalize">{key}</Label>
                        <Input
                          value={value}
                          onChange={(e) => updateSetting("colors", key, e.target.value)}
                          className="mt-1.5 h-8 border-line bg-card font-mono text-xs"
                        />
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
                <div
                  className="rounded-xl p-8 border border-line min-h-[220px] flex flex-col items-center justify-center gap-4 transition-colors duration-300"
                  style={{ backgroundColor: "var(--background)" }}
                >
                  <span
                    className="font-display font-bold text-3xl transition-colors"
                    style={{ color: settings.colors.accent }}
                  >
                    {settings.branding.orgName.toUpperCase()}
                  </span>
                  <span
                    className="px-4 py-2 rounded-full font-medium transition-colors"
                    style={{
                      backgroundColor: settings.colors.primary,
                      color: "#fff",
                      boxShadow: `0 0 20px ${settings.colors.primary}66`,
                    }}
                  >
                    Tombol Utama
                  </span>
                  <span
                    className="w-24 h-2 rounded-full"
                    style={{
                      background: `linear-gradient(90deg, ${settings.colors.primary}, ${settings.colors.secondary})`,
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="hero" className="mt-6">
          <Card className="glass border-line max-w-2xl">
            <CardHeader>
              <CardTitle className="font-display">Editor Hero Section</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Judul Utama</Label>
                <Input
                  value={settings.hero.title}
                  onChange={(e) => updateSetting("hero", "title", e.target.value)}
                  className="glass border-line"
                />
              </div>
              <div className="space-y-2">
                <Label>Subjudul / Slogan</Label>
                <Textarea
                  value={settings.hero.subtitle}
                  onChange={(e) => updateSetting("hero", "subtitle", e.target.value)}
                  rows={3}
                  className="glass border-line resize-none"
                />
              </div>
              <div className="space-y-2">
                <Label>Teks Tombol CTA</Label>
                <Input
                  value={settings.hero.ctaText}
                  onChange={(e) => updateSetting("hero", "ctaText", e.target.value)}
                  className="glass border-line"
                />
              </div>
              <div className="space-y-2">
                <Label>Tombol Sekunder (Sewa)</Label>
                <Input
                  value={settings.heroExtras.secondaryCta}
                  onChange={(e) => updateSetting("heroExtras", "secondaryCta", e.target.value)}
                  className="glass border-line"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-line max-w-2xl">
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
        </TabsContent>

        <TabsContent value="kontak" className="mt-6">
          <Card className="glass border-line max-w-2xl">
            <CardHeader>
              <CardTitle className="font-display">Kontak & Media Sosial</CardTitle>
              <p className="text-sm text-muted-foreground">
                Nomor WhatsApp dipakai tombol WA & tombol sewa. URL Instagram/TikTok tampil di footer.
              </p>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nomor WhatsApp (format internasional)</Label>
                <Input
                  value={settings.contacts.waNumber}
                  onChange={(e) => updateSetting("contacts", "waNumber", e.target.value)}
                  placeholder="6281234567890"
                  className="glass border-line font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label>Nomor Telepon (tampilan)</Label>
                <Input
                  value={settings.contacts.phone}
                  onChange={(e) => updateSetting("contacts", "phone", e.target.value)}
                  placeholder="0812-3456-7890"
                  className="glass border-line"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={settings.contacts.email}
                  onChange={(e) => updateSetting("contacts", "email", e.target.value)}
                  placeholder="satriacengkara@gmail.com"
                  className="glass border-line"
                />
              </div>
              <div className="space-y-2">
                <Label>Alamat</Label>
                <Input
                  value={settings.contacts.address}
                  onChange={(e) => updateSetting("contacts", "address", e.target.value)}
                  placeholder="SMKN 1 Kertosono, Kab. Nganjuk, Jawa Timur"
                  className="glass border-line"
                />
              </div>
              <div className="space-y-2">
                <Label>URL Instagram</Label>
                <Input
                  value={settings.contacts.instagram}
                  onChange={(e) => updateSetting("contacts", "instagram", e.target.value)}
                  placeholder="https://www.instagram.com/..."
                  className="glass border-line"
                />
              </div>
              <div className="space-y-2">
                <Label>URL TikTok</Label>
                <Input
                  value={settings.contacts.tiktok}
                  onChange={(e) => updateSetting("contacts", "tiktok", e.target.value)}
                  placeholder="https://www.tiktok.com/@..."
                  className="glass border-line"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="halaman" className="mt-6">
          <Card className="glass border-line max-w-2xl">
            <CardHeader>
              <CardTitle className="font-display">Teks Halaman</CardTitle>
              <p className="text-sm text-muted-foreground">
                Teks pengantar setiap halaman publik di website ini.
              </p>
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
                  <Textarea
                    value={settings.pages[key]}
                    onChange={(e) => updateSetting("pages", key, e.target.value)}
                    rows={2}
                    className="glass border-line resize-none"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="navigasi" className="mt-6">
          <Card className="glass border-line max-w-2xl">
            <CardHeader>
              <CardTitle className="font-display">Menu Navigasi</CardTitle>
              <p className="text-sm text-muted-foreground">
                Menu navbar (beranda) dan tautan footer. Href memakai anchor, contoh: #sejarah atau /layanan.
              </p>
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
        </TabsContent>

        <TabsContent value="sejarah" className="mt-6">
          <Card className="glass border-line max-w-2xl">
            <CardHeader>
              <CardTitle className="font-display">Editor Sejarah</CardTitle>
              <p className="text-sm text-muted-foreground">Judul section dan timeline perjalanan organisasi.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
        </TabsContent>

        <TabsContent value="sekolah" className="mt-6">
          <Card className="glass border-line max-w-2xl">
            <CardHeader>
              <CardTitle className="font-display">Editor Sekolah</CardTitle>
              <p className="text-sm text-muted-foreground">Section profil sekolah di beranda — teks dan gambar dapat diubah.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
        </TabsContent>

        <TabsContent value="filosofi" className="mt-6">
          <Card className="glass border-line max-w-2xl">
            <CardHeader>
              <CardTitle className="font-display">Editor Filosofi Logo</CardTitle>
              <p className="text-sm text-muted-foreground">Makna lambang logo yang tampil di beranda.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
        </TabsContent>

        <TabsContent value="judul" className="mt-6">
          <Card className="glass border-line max-w-2xl">
            <CardHeader>
              <CardTitle className="font-display">Judul Section</CardTitle>
              <p className="text-sm text-muted-foreground">Label dan judul setiap section di halaman utama.</p>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <Input
                    value={settings.sectionTitles[key as keyof typeof settings.sectionTitles]}
                    onChange={(e) => updateSetting("sectionTitles", key, e.target.value)}
                    className="glass border-line"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="background" className="mt-6">
          <Card className="glass border-line max-w-2xl">
            <CardHeader>
              <CardTitle className="font-display">Gambar Background</CardTitle>
              <p className="text-sm text-muted-foreground">
                Foto watermark yang tampil di sudut-sudut background seluruh halaman (kanan-atas: pemuda, kiri-bawah: pemudi).
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Foto Pemuda (kanan atas)</Label>
                <ImageUpload
                  value={settings.backgrounds.watermarkPemuda}
                  onChange={(url) => updateSetting("backgrounds", "watermarkPemuda", url)}
                />
              </div>
              <div className="space-y-2">
                <Label>Foto Pemudi (kiri bawah)</Label>
                <ImageUpload
                  value={settings.backgrounds.watermarkPemudi}
                  onChange={(url) => updateSetting("backgrounds", "watermarkPemudi", url)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="mt-6">
          <Card className="glass border-line max-w-2xl">
            <CardHeader>
              <CardTitle className="font-display">AI System Prompt Config</CardTitle>
              <p className="text-sm text-muted-foreground">
                Prompt ini digunakan oleh Tanya Satria Bot saat menjawab pengunjung.
              </p>
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
        </TabsContent>
      </Tabs>
    </div>
  )
}