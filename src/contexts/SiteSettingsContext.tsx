"use client"

import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase/client"

export interface SiteSettings {
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    foreground: string
  }
  hero: { title: string; subtitle: string; ctaText: string }
  branding: {
    logoUrl: string
    schoolLogoUrl: string
    orgName: string
    schoolName: string
    fontSans: string
    fontDisplay: string
  }
  contacts: {
    waNumber: string
    whatsappContacts: { name: string; number: string }[]
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
    heroBackground: string
    heroImageOpacity: number
    heroLogoOpacity: number
    watermarkOpacity: number
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
  lkbb: {
    label: string
    title: string
    subtitle: string
    intro: string
    date: string
    location: string
    fee: string
    registrationDeadline: string
    contact: string
    whatsapp: string
    contacts: { name: string; number: string }[]
    rules: { title: string; desc: string }[]
    steps: { title: string; desc: string }[]
    prizes: { title: string; desc: string }[]
    media: { type: "image" | "video"; url: string }[]
  }
  aiPrompt: string
}

export const DEFAULT_SETTINGS: SiteSettings = {
  colors: { primary: "#E53935", secondary: "#1E88E5", accent: "#FFD700", background: "#0A0A0C", foreground: "#0f172a" },
  hero: {
    title: "SATRIA CENGKARA",
    subtitle:
      "Membentuk karakter disiplin, tangguh, dan berintegritas melalui baris-berbaris",
    ctaText: "Jelajahi Lebih Lanjut",
  },
  branding: {
    logoUrl: "/logo.png",
    schoolLogoUrl: "/school-logo.png",
    orgName: "Paskibra Satria Cengkara",
    schoolName: "SMK Negeri 1 Kertosono",
    fontSans: "plus-jakarta",
    fontDisplay: "plus-jakarta",
  },
  contacts: {
    waNumber: "6289516555498",
    whatsappContacts: [
      { name: "Kak Afza", number: "+62 895-1655-5498" },
      { name: "Kak Khoirul", number: "+62 823-3848-7105" },
    ],
    email: "smknegeri1kts@gmail.com",
    instagram: "https://www.instagram.com/satria_cengkara",
    tiktok: "https://www.tiktok.com/@satria_cengkara",
    address: "Jl. Langsep No. 24, Ds. Pelem, Kab. Nganjuk, Jawa Timur",
    phone: "(0358) 551466",
  },
  pages: {
    aboutText:
      "Paskibra Satria Cengkara SMK Negeri 1 Kertosono — membentuk generasi muda yang disiplin, tangguh, dan berintegritas melalui pendidikan baris-berbaris serta pengembangan karakter kepemimpinan.",
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
    heroBackground: "",
    heroImageOpacity: 100,
    heroLogoOpacity: 5,
    watermarkOpacity: 14,
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
    title: "SMK Negeri 1 Kertosono",
    subtitle: "Sekolah Pencetak Wirausaha — tempat lahirnya Paskibra Satria Cengkara.",
    items: [
      { title: "Profil Sekolah", content: "SMK Negeri 1 Kertosono adalah sekolah kejuruan negeri di Kabupaten Nganjuk yang memadukan teknologi dan bisnis, berfokus pada keterampilan praktis serta pengembangan karakter siswa.", image: "/school-logo.png" },
      { title: "Kurikulum Merdeka", content: "Menerapkan Kurikulum Merdeka dengan pembelajaran berbasis proyek dan kesempatan bekerja langsung bersama perusahaan (Du/Di).", image: "" },
      { title: "7 Kompetensi Keahlian", content: "Teknik Pemesinan, Teknik Otomasi Industri, Teknik Instalasi Tenaga Listrik, Rekayasa Perangkat Lunak, Desain Produksi Busana, Kuliner, serta Teknik Pendingin dan Tata Udara.", image: "" },
      { title: "Lokasi & Kontak", content: "Jl. Langsep No. 24, Ds. Pelem, Kab. Nganjuk, Jawa Timur. Telepon (0358) 551466, email smknegeri1kts@gmail.com.", image: "" },
      { title: "Ekstrakurikuler", content: "Pramuka, PMR, Paskibraka, English Corner, Multimedia, Seni Musik, Seni Tari, Seni Lukis, Basket, Futsal, dan Voli.", image: "" },
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
  lkbb: {
    label: "LKBB",
    title: "Lomba Keterampilan Baris-Berbaris",
    subtitle: "Adu keterampilan baris-berbaris dan kecepatan bertindak.",
    intro:
      "Paskibra Satria Cengkara menggelar Lomba Baris-Berbaris untuk tingkat SMP/MTs se-Kabupaten Nganjuk. Daftarkan sekolahmu sekarang!",
    date: "12-13 Oktober 2026",
    location: "SMK Negeri 1 Kertosono, Jl. Langsep No. 24, Pelem, Nganjuk",
    fee: "Rp 250.000 / tim (maks. 10 anggota)",
    registrationDeadline: "5 Oktober 2026",
    contact: "+62 895-2548-0975 (Kak Arzety)",
    whatsapp: "6289525480975",
    contacts: [
      { name: "Kak Arzety", number: "+62 895-2548-0975" },
      { name: "Kak Banyu", number: "+62 881-0271-83782" },
    ],
    rules: [
      {
        title: "Peserta",
        desc: "Siswa aktif SMP/MTs/sederajat se-Kabupaten Nganjuk, maksimal 10 anggota per tim + 2 pelatih.",
      },
      {
        title: "Wajib Hadir",
        desc: "Registrasi ulang dilakukan 1 jam sebelum lomba dimulai di ruang panitia.",
      },
      {
        title: "Atribut",
        desc: "Setiap tim wajib memakai seragam sekolah masing-masing dan atribut Paskibra lengkap.",
      },
      {
        title: "Penilaian",
        desc: "Penilaian meliputi keseragaman baris, ketepatan aba-aba, kekompakan, dan penampilan.",
      },
    ],
    steps: [
      {
        title: "Isi Formulir",
        desc: "Isi formulir pendaftaran dengan nama sekolah dan kontak penanggung jawab.",
      },
      {
        title: "Transfer Biaya",
        desc: "Bayar biaya pendaftaran via transfer (DP minimal 50%, pelunasan sebelum H-1).",
      },
      {
        title: "Konfirmasi",
        desc: "Kirim bukti transfer ke panitia melalui WhatsApp untuk konfirmasi.",
      },
      {
        title: "Ikut Lomba",
        desc: "Datang tepat waktu dan ikuti technical meeting pada H-1.",
      },
    ],
    prizes: [
      {
        title: "Juara 1",
        desc: "Piala Bergilir + Uang Pembinaan Rp 1.000.000 + Sertifikat",
      },
      {
        title: "Juara 2",
        desc: "Piala Tetap + Uang Pembinaan Rp 750.000 + Sertifikat",
      },
      {
        title: "Juara 3",
        desc: "Piala Tetap + Uang Pembinaan Rp 500.000 + Sertifikat",
      },
      {
        title: "Juara Harapan",
        desc: "Uang Pembinaan Rp 250.000 + Sertifikat",
      },
    ],
    media: [],
  },
  aiPrompt:
    'Kamu adalah "Tanya Satria Bot", asisten AI resmi Paskibra Satria Cengkara SMKN 1 Kertosono.',
}

const KEYS = ["colors", "hero", "branding", "contacts", "pages", "backgrounds", "nav", "heroExtras", "history", "philosophy", "school", "sectionTitles", "lkbb", "aiPrompt"] as const

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

export const FONT_OPTIONS = [
  { key: "plus-jakarta", label: "Plus Jakarta Sans" },
  { key: "inter", label: "Inter" },
  { key: "poppins", label: "Poppins" },
  { key: "montserrat", label: "Montserrat" },
  { key: "lato", label: "Lato" },
  { key: "dm-sans", label: "DM Sans" },
] as const

export const FONT_VARS: Record<string, string> = {
  "plus-jakarta": "var(--font-pjs)",
  inter: "var(--font-inter)",
  poppins: "var(--font-poppins)",
  montserrat: "var(--font-montserrat)",
  lato: "var(--font-lato)",
  "dm-sans": "var(--font-dmsans)",
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
    const { colors, branding } = settings
    const root = document.documentElement
    root.style.setProperty("--primary", colors.primary)
    root.style.setProperty("--secondary", colors.secondary)
    root.style.setProperty("--accent", colors.accent)
    root.style.setProperty("--foreground", colors.foreground)
    root.style.setProperty("--font-sans", FONT_VARS[branding.fontSans] || "var(--font-pjs)")
    root.style.setProperty("--font-display", FONT_VARS[branding.fontDisplay] || "var(--font-pjs)")
  }, [settings.colors, settings.branding.fontSans, settings.branding.fontDisplay])

  return (
    <SiteSettingsContext.Provider value={{ settings, loading, refresh }}>
      {children}
    </SiteSettingsContext.Provider>
  )
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext)
}