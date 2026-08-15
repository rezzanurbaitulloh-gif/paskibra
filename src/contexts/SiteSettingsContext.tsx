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
  nav: {
    links: { label: string; href: string }[]
  }
  heroExtras: {
    secondaryCta: string
    stats: { value: string; label: string }[]
  }
  history: {
    label: string
    title: string
    subtitle: string
    timeline: { year: string; title: string; desc: string }[]
  }
  philosophy: {
    label: string
    title: string
    items: { title: string; desc: string }[]
  }
  school: {
    label: string
    title: string
    subtitle: string
    items: { title: string; content: string; image: string }[]
  }
  sectionTitles: {
    galeriLabel: string
    galeriTitle: string
    layananLabel: string
    layananTitle: string
    pengurusLabel: string
    pengurusTitle: string
    saranLabel: string
    saranTitle: string
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
  nav: {
    links: [
      { label: "Beranda", href: "#beranda" },
      { label: "Sekolah", href: "#sekolah" },
      { label: "Pengurus", href: "#pengurus" },
      { label: "Galeri", href: "#galeri" },
      { label: "Sejarah", href: "#sejarah" },
      { label: "Layanan", href: "#penyewaan" },
      { label: "Kontak", href: "#kontak" },
    ],
  },
  heroExtras: {
    secondaryCta: "Sewa Kostum & Pasukan",
    stats: [
      { value: "8+", label: "Tahun Berkarya" },
      { value: "45+", label: "Anggota Aktif" },
      { value: "15+", label: "Trofi & Prestasi" },
    ],
  },
  history: {
    label: "Perjalanan Kami",
    title: "Sejarah Satria Cengkara",
    subtitle: "Delapan tahun membangun tradisi disiplin dan prestasi.",
    timeline: [
      { year: "2018", title: "Lahirnya Satria Cengkara", desc: "Paskibra resmi berdiri di SMKN 1 Kertosono dengan 12 anggota perdana." },
      { year: "2020", title: "Juara Pertama", desc: "Meraih juara 1 LKBB tingkat Kabupaten Nganjuk untuk pertama kalinya." },
      { year: "2022", title: "Tingkat Provinsi", desc: "Menjadi wakil Jawa Timur dalam ajang paskibra tingkat provinsi." },
      { year: "2024", title: "Generasi Emas", desc: "45 anggota aktif dengan 6 divisi lengkap — terbanyak dalam sejarah." },
      { year: "2026", title: "Terus Berkarya", desc: "Pelatihan modern, jasa pasukan, dan sekolah kepemimpinan." },
    ],
  },
  philosophy: {
    label: "Makna Lambang",
    title: "Filosofi Logo Satria Cengkara",
    items: [
      { title: "Sang Merah Putih", desc: "Simbol nasionalisme dan cinta tanah air." },
      { title: "Mata Banteng", desc: "Fokus, keberanian, dan kewaspadaan." },
      { title: "Lima Sinar", desc: "Disiplin, loyalitas, integritas, solidaritas, prestasi." },
      { title: "Genggaman Tangan", desc: "Persaudaraan dan kekompakan tim." },
    ],
  },
  school: {
    label: "Tentang Sekolah",
    title: "SMKN 1 Kertosono",
    subtitle: "Sekolah yang melahirkan Satria Cengkara — calon pemimpin bangsa.",
    items: [
      { title: "Profil Sekolah", content: "SMKN 1 Kertosono adalah sekolah kejuruan unggulan di Kabupaten Nganjuk yang berfokus pada pengembangan kompetensi siswa di bidang teknologi dan industri.", image: "/logo-icon.png" },
      { title: "Visi & Misi", content: "Menjadi sekolah kejuruan unggul yang menghasilkan lulusan berkompeten, berkarakter, dan siap bersaing di dunia industri global.", image: "" },
      { title: "Jurusan", content: "TKJ, RPL, TEI, TKR, dan DKV — lima kompetensi keahlian unggulan untuk masa depan.", image: "" },
      { title: "Lokasi", content: "Jl. Raya Kertosono, Kab. Nganjuk, Jawa Timur.", image: "" },
      { title: "Ekstrakurikuler", content: "Paskibra, Pramuka, PMR, Futsal, hingga Robotik.", image: "" },
    ],
  },
  sectionTitles: {
    galeriLabel: "Dokumentasi",
    galeriTitle: "Galeri Kegiatan",
    layananLabel: "Penyewaan",
    layananTitle: "Sewa Kostum & Perlengkapan",
    pengurusLabel: "Struktur Organisasi",
    pengurusTitle: "Pengurus Satria Cengkara",
    saranLabel: "Suara Anda",
    saranTitle: "Kotak Saran & Masukan",
  },
  aiPrompt:
    'Kamu adalah "Tanya Satria Bot", asisten AI resmi Paskibra Satria Cengkara SMKN 1 Kertosono.',
}

const KEYS = ["colors", "hero", "branding", "contacts", "pages", "backgrounds", "nav", "heroExtras", "history", "philosophy", "school", "sectionTitles", "aiPrompt"] as const

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