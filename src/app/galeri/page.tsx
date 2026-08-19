"use client"

import { useSiteSettings } from "@/contexts/SiteSettingsContext"
import { useState, useEffect, useRef, useMemo } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { supabase } from "@/lib/supabase/client"
import { embedFromUrl } from "@/lib/embed"
import { Play, ZoomIn } from "lucide-react"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { Lightbox, LightboxImage } from "@/components/lightbox"

interface GalleryItem {
  id: string
  title: string
  description: string | null
  image_url: string | null
  category: string
  media_type: string
  video_url: string | null
  images: string[] | null
  videos: string[] | null
  created_at: string
}

const CATEGORIES = ["Semua", "LKBB", "Latihan Rutin", "Pengukuhan", "Kegiatan Lain"]

function VideoEmbed({ item }: { item: GalleryItem }) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setInView(true)
        else setInView(false)
      },
      { threshold: 0.4 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const embed = embedFromUrl(item.video_url || "")
  if (!embed) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-xl bg-soft">
        <p className="text-xs text-muted-foreground">Link video tidak valid</p>
      </div>
    )
  }

  return (
    <div ref={ref} className="aspect-video w-full overflow-hidden rounded-xl bg-black">
      {inView ? (
        <iframe
          src={embed.embedUrl}
          className="h-full w-full"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          loading="lazy"
          title={item.title}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-soft">
          <Play className="h-6 w-6 text-muted-foreground" />
        </div>
      )}
    </div>
  )
}

const MotionLink = motion.create(Link)

export default function GaleriPage() {
  const { settings } = useSiteSettings()
  const [items, setItems] = useState<GalleryItem[]>([])
  const [category, setCategory] = useState("Semua")
  const [year, setYear] = useState("Semua")
  const [loading, setLoading] = useState(true)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  useEffect(() => {
    const fetchItems = async () => {
      const { data } = await supabase.from("gallery").select("*").order("created_at", { ascending: false })
      setItems(data || [])
      setLoading(false)
    }
    fetchItems()
  }, [])

  const years = useMemo(() => {
    const set = new Set(items.map((i) => new Date(i.created_at).getFullYear().toString()))
    return ["Semua", ...Array.from(set).sort((a, b) => Number(b) - Number(a))]
  }, [items])

  const filtered = items.filter((i) => {
    if (year !== "Semua" && new Date(i.created_at).getFullYear().toString() !== year) return false
    if (category !== "Semua" && i.category !== category) return false
    return true
  })

  const lightboxItems: LightboxImage[] = filtered
    .filter((i) => i.image_url)
    .map((i) => ({ src: i.image_url as string, alt: i.title }))

  return (
    <div id="konten" className="min-h-screen">
      <div className="container mx-auto px-4 pt-28 pb-16">
  
        <div className="mt-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Galeri & Prestasi</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold md:text-4xl">Dokumentasi Satria Cengkara</h1>
          <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground">
            {settings.pages.galeriIntro}
          </p>
        </div>

        {/* Filter */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          <span className="mr-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Tahun
          </span>
          {years.map((y) => (
            <button
              key={y}
              onClick={() => setYear(y)}
              className={`rounded-full px-4 py-2.5 text-xs font-medium transition-all ${
                year === y
                  ? "gradient-primary text-white shadow-glow-red"
                  : "border border-line bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {y}
            </button>
          ))}
          <span className="ml-3 mr-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Kategori
          </span>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full px-4 py-2.5 text-xs font-medium transition-all ${
                category === c
                  ? "gradient-primary text-white shadow-glow-red"
                  : "border border-line bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="mt-10 columns-2 gap-3 sm:gap-4 lg:columns-3 [&>*]:mb-3 sm:[&>*]:mb-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="mb-3 h-48 break-inside-avoid rounded-2xl sm:mb-4 lg:h-56" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-10">
            <EmptyState
              icon={ZoomIn}
              title="Belum ada galeri untuk kategori ini"
              description="Dokumentasi kegiatan sedang dikumpulkan. Kembali lagi nanti."
            />
          </div>
        ) : (
          <div className="mt-10 columns-2 gap-3 sm:gap-4 lg:columns-3 [&>*]:mb-3 sm:[&>*]:mb-4">
            {filtered.map((item, index) => (
              <MotionLink
                key={item.id}
                href={`/galeri/${item.id}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="group block break-inside-avoid overflow-hidden rounded-2xl border border-line bg-card transition-all hover:border-accent/40"
              >
                {item.media_type === "video_embed" ? (
                  <VideoEmbed item={item} />
                ) : item.image_url ? (
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      const imgIdx = lightboxItems.findIndex((li) => li.src === item.image_url)
                      setLightboxIndex(Math.max(imgIdx, 0))
                      setLightboxOpen(true)
                    }}
                    className="relative block w-full text-left"
                    aria-label={`Perbesar foto ${item.title}`}
                  >
                    <div className="relative w-full overflow-hidden">
                      <Image
                        src={item.image_url}
                        alt={item.title}
                        width={800}
                        height={600}
                        className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <span className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
                        <ZoomIn className="h-3.5 w-3.5" />
                      </span>
                      {item.images && item.images.length > 0 && (
                        <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">
                          +{item.images.length} foto
                        </span>
                      )}
                      {item.videos && item.videos.length > 0 && (
                        <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">
                          +{item.videos.length} video
                        </span>
                      )}
                    </div>
                  </button>
                ) : null}
                <div className="p-4">
                  <p className="text-sm font-semibold">{item.title}</p>
                  {item.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
                  )}
                  <div className="mt-2 flex items-center justify-between">
                    <span className="inline-block rounded-md border border-line bg-soft px-2 py-0.5 text-[10px] font-medium text-accent">
                      {item.category}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(item.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </MotionLink>
            ))}
          </div>
        )}
      </div>

      <Lightbox
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        items={lightboxItems}
        index={lightboxIndex}
        onIndexChange={setLightboxIndex}
      />
    </div>
  )
}
