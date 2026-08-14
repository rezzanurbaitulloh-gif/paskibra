"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Save, CheckCircle2, Upload, Loader2, ImagePlus } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { DEFAULT_SETTINGS, type SiteSettings } from "@/contexts/SiteSettingsContext"

const SETTING_KEYS = ["colors", "hero", "branding", "contacts", "pages", "aiPrompt"]

export default function SettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadTarget, setUploadTarget] = useState<"logoUrl" | "schoolLogoUrl" | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

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

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !uploadTarget) return
    setUploading(true)

    const {
      data: { session },
    } = await supabase.auth.getSession()
    const formData = new FormData()
    formData.append("file", file)

    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${session?.access_token}` },
      body: formData,
    })
    const data = await res.json()
    setUploading(false)
    if (res.ok && data.url) {
      updateSetting("branding", uploadTarget, data.url)
    } else {
      alert(data.error || "Upload gagal")
    }
    if (fileRef.current) fileRef.current.value = ""
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Memuat pengaturan...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-display text-3xl font-bold">CMS & Pengaturan Situs</h1>
        <Button onClick={handleSave} disabled={saving} className="gradient-primary">
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
                  <div className="flex items-center gap-3">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-line bg-soft">
                      {settings.branding.logoUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={settings.branding.logoUrl} alt="Logo" className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <Input
                        value={settings.branding.logoUrl}
                        onChange={(e) => updateSetting("branding", "logoUrl", e.target.value)}
                        className="glass border-line"
                        placeholder="/logo.png atau https://..."
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={uploading}
                          onClick={() => {
                            setUploadTarget("logoUrl")
                            fileRef.current?.click()
                          }}
                        >
                          {uploading && uploadTarget === "logoUrl" ? (
                            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                          ) : (
                            <ImagePlus className="w-3.5 h-3.5 mr-1.5" />
                          )}
                          Upload Gambar
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Logo Sekolah</Label>
                  <div className="flex items-center gap-3">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-line bg-soft">
                      {settings.branding.schoolLogoUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={settings.branding.schoolLogoUrl} alt="Logo Sekolah" className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <Input
                        value={settings.branding.schoolLogoUrl}
                        onChange={(e) => updateSetting("branding", "schoolLogoUrl", e.target.value)}
                        className="glass border-line"
                        placeholder="/logo-icon.png atau https://..."
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={uploading}
                        onClick={() => {
                          setUploadTarget("schoolLogoUrl")
                          fileRef.current?.click()
                        }}
                      >
                        {uploading && uploadTarget === "schoolLogoUrl" ? (
                          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        ) : (
                          <Upload className="w-3.5 h-3.5 mr-1.5" />
                        )}
                        Upload Gambar
                      </Button>
                    </div>
                  </div>
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
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
            className="hidden"
            onChange={handleUpload}
          />
        </TabsContent>

        <TabsContent value="warna" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass border-line">
              <CardHeader>
                <CardTitle className="font-display">Palet Warna</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(settings.colors).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-4">
                    <Label className="w-28 capitalize">{key}</Label>
                    <div className="relative">
                      <input
                        type="color"
                        value={value}
                        onChange={(e) => updateSetting("colors", key, e.target.value)}
                        className="w-12 h-10 rounded cursor-pointer border border-line bg-transparent"
                      />
                    </div>
                    <Input
                      value={value}
                      onChange={(e) => updateSetting("colors", key, e.target.value)}
                      className="glass border-line max-w-[160px] font-mono"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="glass border-line">
              <CardHeader>
                <CardTitle className="font-display">Live Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="rounded-xl p-8 border border-line min-h-[220px] flex flex-col items-center justify-center gap-4 transition-colors duration-300"
                  style={{ backgroundColor: settings.colors.background }}
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