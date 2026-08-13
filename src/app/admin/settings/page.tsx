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

const DEFAULT_SETTINGS = {
  colors: {
    primary: "#E53935",
    secondary: "#1E88E5",
    accent: "#FFD700",
    background: "#0A0A0C",
  },
  hero: {
    title: "SATRIA CENGKARA",
    subtitle: "Membentuk karakter disiplin, tangguh, dan berintegritas melalui baris-berbaris",
    ctaText: "Jelajahi Lebih Lanjut",
  },
  branding: {
    logoUrl: "/logo.png",
    schoolLogoUrl: "/logo-icon.png",
    orgName: "Paskibra Satria Cengkara",
    schoolName: "SMKN 1 Kertosono",
  },
  aiPrompt: "Kamu adalah Tanya Satria Bot, asisten AI resmi Paskibra Satria Cengkara SMKN 1 Kertosono.",
}

const SETTING_KEYS = ["colors", "hero", "branding", "aiPrompt"]

export default function SettingsPage() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
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
      const merged = { ...DEFAULT_SETTINGS }
      for (const row of data) {
        if (row.value && typeof row.value === "object") {
          // @ts-expect-error dynamic merge
          merged[row.key] = { ...merged[row.key], ...row.value }
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
        { key, value: settings[key as keyof typeof settings] },
        { onConflict: "key" }
      )
      if (error) console.error(`Gagal simpan ${key}:`, error.message)
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const updateSetting = (group: string, field: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      [group]: { ...(prev[group as keyof typeof prev] as object), [field]: value },
    }))
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

      <Tabs defaultValue="warna" className="w-full">
        <TabsList className="glass border-border/20">
          <TabsTrigger value="warna">Warna</TabsTrigger>
          <TabsTrigger value="hero">Hero</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="ai">AI Prompt</TabsTrigger>
        </TabsList>

        <TabsContent value="warna" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass border-border/20">
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
                        className="w-12 h-10 rounded cursor-pointer border border-border/20 bg-transparent"
                      />
                    </div>
                    <Input
                      value={value}
                      onChange={(e) => updateSetting("colors", key, e.target.value)}
                      className="glass border-border/20 max-w-[160px] font-mono"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="glass border-border/20">
              <CardHeader>
                <CardTitle className="font-display">Live Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="rounded-xl p-8 border border-border/20 min-h-[220px] flex flex-col items-center justify-center gap-4 transition-colors duration-300"
                  style={{ backgroundColor: settings.colors.background }}
                >
                  <span
                    className="font-display font-bold text-3xl transition-colors"
                    style={{ color: settings.colors.accent }}
                  >
                    SATRIA CENGKARA
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
          <Card className="glass border-border/20 max-w-2xl">
            <CardHeader>
              <CardTitle className="font-display">Editor Hero Section</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Judul Utama</Label>
                <Input
                  value={settings.hero.title}
                  onChange={(e) => updateSetting("hero", "title", e.target.value)}
                  className="glass border-border/20"
                />
              </div>
              <div className="space-y-2">
                <Label>Subjudul / Slogan</Label>
                <Textarea
                  value={settings.hero.subtitle}
                  onChange={(e) => updateSetting("hero", "subtitle", e.target.value)}
                  rows={3}
                  className="glass border-border/20 resize-none"
                />
              </div>
              <div className="space-y-2">
                <Label>Teks Tombol CTA</Label>
                <Input
                  value={settings.hero.ctaText}
                  onChange={(e) => updateSetting("hero", "ctaText", e.target.value)}
                  className="glass border-border/20"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding" className="mt-6">
          <Card className="glass border-border/20 max-w-2xl">
            <CardHeader>
              <CardTitle className="font-display">Branding & Logo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>URL Logo Paskibra</Label>
                <Input
                  value={settings.branding.logoUrl}
                  onChange={(e) => updateSetting("branding", "logoUrl", e.target.value)}
                  className="glass border-border/20"
                />
              </div>
              <div className="space-y-2">
                <Label>URL Logo Sekolah</Label>
                <Input
                  value={settings.branding.schoolLogoUrl}
                  onChange={(e) => updateSetting("branding", "schoolLogoUrl", e.target.value)}
                  className="glass border-border/20"
                />
              </div>
              <div className="space-y-2">
                <Label>Nama Organisasi</Label>
                <Input
                  value={settings.branding.orgName}
                  onChange={(e) => updateSetting("branding", "orgName", e.target.value)}
                  className="glass border-border/20"
                />
              </div>
              <div className="space-y-2">
                <Label>Nama Sekolah</Label>
                <Input
                  value={settings.branding.schoolName}
                  onChange={(e) => updateSetting("branding", "schoolName", e.target.value)}
                  className="glass border-border/20"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="mt-6">
          <Card className="glass border-border/20 max-w-2xl">
            <CardHeader>
              <CardTitle className="font-display">AI System Prompt Config</CardTitle>
              <p className="text-sm text-muted-foreground">
                Prompt ini digunakan oleh Tanya Satria Bot saat menjawab pengunjung.
              </p>
            </CardHeader>
            <CardContent>
              <Textarea
                value={settings.aiPrompt as unknown as string}
                onChange={(e) => setSettings(prev => ({ ...prev, aiPrompt: e.target.value }))}
                rows={8}
                className="glass border-border/20 resize-none font-mono text-sm"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}