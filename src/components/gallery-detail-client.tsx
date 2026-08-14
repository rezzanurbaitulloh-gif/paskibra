"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { embedFromUrl } from "@/lib/embed"
import { Play, X } from "lucide-react"

interface GalleryItem {
  id: string
  title: string
  media_type: string
  video_url: string | null
}

function VideoEmbed({ item }: { item: GalleryItem }) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  const observer = useRef<IntersectionObserver | null>(null)
  const onMount = (el: HTMLDivElement | null) => {
    if (!el) return
    if (observer.current) observer.current.disconnect()
    observer.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setInView(true)
      },
      { threshold: 0.4 }
    )
    observer.current.observe(el)
  }

  const embed = embedFromUrl(item.video_url || "")
  if (!embed) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-2xl bg-soft">
        <p className="text-xs text-muted-foreground">Link video tidak valid</p>
      </div>
    )
  }

  return (
    <div ref={onMount} className="aspect-video w-full overflow-hidden rounded-2xl bg-black">
      {inView ? (
        <iframe
          src={embed.embedUrl}
          className="h-full w-full"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          title={item.title}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-soft">
          <Play className="h-8 w-8 text-muted-foreground" />
        </div>
      )}
    </div>
  )
}

export function GalleryDetailClient({
  item,
  images,
}: {
  item: GalleryItem
  images: string[]
}) {
  const [active, setActive] = useState(0)
  const [lightbox, setLightbox] = useState<string | null>(null)

  if (item.media_type === "video_embed") {
    return <div className="mt-8"><VideoEmbed item={item} /></div>
  }

  const current = images[active] || ""

  return (
    <div className="mt-8">
      <div className="overflow-hidden rounded-2xl border border-line bg-card">
        {current ? (
          <button
            onClick={() => setLightbox(current)}
            className="block w-full cursor-zoom-in"
            aria-label="Perbesar foto"
          >
            <Image
              src={current}
              alt={item.title}
              width={1200}
              height={800}
              className="h-auto max-h-[560px] w-full object-contain"
              priority
            />
          </button>
        ) : (
          <div className="flex aspect-video items-center justify-center bg-soft">
            <p className="text-xs text-muted-foreground">Belum ada foto</p>
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-muted-foreground">
            Foto Lainnya ({images.length})
          </p>
          <div className="mt-2 flex gap-3 overflow-x-auto pb-2">
            {images.map((src, i) => (
              <button
                key={src + i}
                onClick={() => setActive(i)}
                className={`relative h-20 w-28 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                  i === active ? "border-accent" : "border-line opacity-60 hover:opacity-100"
                }`}
                aria-label={`Foto ${i + 1}`}
              >
                <Image
                  src={src}
                  alt=""
                  width={224}
                  height={160}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {lightbox && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
            onClick={() => setLightbox(null)}
            aria-label="Tutup"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="max-h-full w-full max-w-4xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <Image
              src={lightbox}
              alt={item.title}
              width={1600}
              height={1200}
              className="h-auto w-full object-contain"
            />
          </div>
        </motion.div>
      )}
    </div>
  )
}