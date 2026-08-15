"use client"

import { useSiteSettings } from "@/contexts/SiteSettingsContext"
import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { supabase } from "@/lib/supabase/client"
import { embedFromUrl } from "@/lib/embed"
import { Play, Inbox } from "lucide-react"

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

const CATEGORIES = ["Semua", "LKBB", "Latihan Rutin", "Pelantikan", "Pengukuhan", "Kegiatan Lain"]

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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchItems = async () => {
      const { data } = await supabase.from("gallery").select("*").order("created_at", { ascending: false })
      setItems(data || [])
      setLoading(false)
    }
    fetchItems()
  }, [])

  const filtered = category === "Semua" ? items : items.filter((i) => i.category === category)

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 pt-28 pb-16">
  
        <div className="mt-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Galeri Kegiatan</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold md:text-4xl">Dokumentasi Satria Cengkara</h1>
          <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground">
            {settings.pages.galeriIntro}
          </p>
        </div>

        {/* Filter */}
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
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
          <p className="mt-12 text-center text-sm text-muted-foreground">Memuat...</p>
        ) : filtered.length === 0 ? (
          <div className="mt-12 flex flex-col items-center py-16 text-center">
            <Inbox className="h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">Belum ada galeri untuk kategori ini.</p>
          </div>
        ) : (
          <div className="mt-10 columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4">
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
                  <div className="relative w-full overflow-hidden">
                    <Image
                      src={item.image_url}
                      alt={item.title}
                      width={800}
                      height={600}
                      className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
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
    </div>
  )
}
