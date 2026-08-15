"use client"

import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase/client"

export interface SiteSettings {
  colors: { primary: string; secondary: string; accent: string; background: string }
  hero: { title: string; subtitle: string; ctaText: string }
  branding: {
    logoUrl: string
    schoolLogoUrl: string
    orgName: string
    schoolName: string
  }
  contacts: {
    waNumber: string
    email: string
    instagram: string
    tiktok: string
    address: string
    phone: string
  }
  pages: {
    aboutText: string
    galeriIntro: string
    layananIntro: string
    saranIntro: string
    pengurusIntro: string
  }
  backgrounds: {
    watermarkPemuda: string
    watermarkPemudi: string
  }
  aiPrompt: string
}

export const DEFAULT_SETTINGS: SiteSettings = {
  colors: { primary: "#E53935", secondary: "#1E88E5", accent: "#FFD700", background: "#0A0A0C" },
  hero: {
    title: "SATRIA CENGKARA",
    subtitle:
      "Membentuk karakter disiplin, tangguh, dan berintegritas melalui baris-berbaris",
    ctaText: "Jelajahi Lebih Lanjut",
  },
  branding: {
    logoUrl: "/logo.png",
    schoolLogoUrl: "/logo-icon.png",
    orgName: "Paskibra Satria Cengkara",
    schoolName: "SMKN 1 Kertosono",
  },
  contacts: {
    waNumber: "6281234567890",
    email: "satriacengkara@gmail.com",
    instagram: "https://www.instagram.com/satria_cengkara",
    tiktok: "https://www.tiktok.com/@satria_cengkara",
    address: "SMKN 1 Kertosono, Kab. Nganjuk, Jawa Timur",
    phone: "0812-3456-7890",
  },
  pages: {
    aboutText:
      "Membentuk generasi muda yang disiplin, tangguh, dan berintegritas melalui pendidikan baris-berbaris dan pengembangan karakter kepemimpinan.",
    galeriIntro: "Dokumentasi kegiatan Paskibra Satria Cengkara.",
    layananIntro:
      "Penyewaan PBB, atribut, dan keperluan upacara untuk berbagai acara.",
    saranIntro:
      "Kritik, saran, dan aspirasi Anda sangat berarti bagi kemajuan kami.",
    pengurusIntro: "Struktur kepengurusan Paskibra Satria Cengkara.",
  },
  backgrounds: {
    watermarkPemuda: "/watermark-pemuda.jpg",
    watermarkPemudi: "/watermark-pemudi.jpg",
  },
  aiPrompt:
    'Kamu adalah "Tanya Satria Bot", asisten AI resmi Paskibra Satria Cengkara SMKN 1 Kertosono.',
}

const KEYS = ["colors", "hero", "branding", "contacts", "pages", "backgrounds", "aiPrompt"] as const

function deepMerge<T>(base: T, patch: Partial<T>): T {
  const out: any = { ...base }
  for (const k of Object.keys(patch) as (keyof T)[]) {
    const v = patch[k]
    if (v && typeof v === "object" && !Array.isArray(v) && typeof base[k] === "object") {
      out[k] = deepMerge(base[k], v)
    } else if (v !== undefined) {
      out[k] = v
    }
  }
  return out as T
}

interface SiteSettingsState {
  settings: SiteSettings
  loading: boolean
  refresh: () => Promise<void>
}

const SiteSettingsContext = createContext<SiteSettingsState>({
  settings: DEFAULT_SETTINGS,
  loading: true,
  refresh: async () => {},
})

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const { data } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", KEYS as unknown as string[])

    if (data && data.length > 0) {
      let merged: SiteSettings = { ...DEFAULT_SETTINGS }
      for (const row of data) {
        if (row.value && typeof row.value === "object") {
          merged = deepMerge(merged, { [row.key]: row.value } as Partial<SiteSettings>)
        } else if (row.key === "aiPrompt" && typeof row.value === "string") {
          merged.aiPrompt = row.value
        }
      }
      setSettings(merged)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    const { colors } = settings
    const root = document.documentElement
    root.style.setProperty("--primary", colors.primary)
    root.style.setProperty("--secondary", colors.secondary)
    root.style.setProperty("--accent", colors.accent)
  }, [settings.colors])

  return (
    <SiteSettingsContext.Provider value={{ settings, loading, refresh }}>
      {children}
    </SiteSettingsContext.Provider>
  )
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext)
}