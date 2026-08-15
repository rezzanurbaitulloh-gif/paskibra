"use client"

import { useState } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { X, Film } from "lucide-react"
import { cn } from "@/lib/utils"
import { VideoEmbed } from "@/components/video-embed"

interface GalleryItem {
  id: string
  title: string
  media_type: string
  video_url: string | null
  videos?: string[] | null
}

interface Media {
  type: "image" | "video"
  src?: string
  url?: string
}

export function GalleryDetailClient({
  item,
  images,
  videos,
}: {
  item: GalleryItem
  images: string[]
  videos: string[]
}) {
  const [active, setActive] = useState(0)
  const [lightbox, setLightbox] = useState<string | null>(null)

  const mediaList: Media[] = [
    ...images.map((src): Media => ({ type: "image", src })),
    ...videos.map((url): Media => ({ type: "video", url })),
  ]
  if (item.media_type === "video_embed" && mediaList.length > 1) {
    const firstVideo = mediaList.findIndex((m) => m.type === "video")
    if (firstVideo > 0) {
      const [v] = mediaList.splice(firstVideo, 1)
      mediaList.unshift(v)
    }
  }

  if (mediaList.length === 0) {
    return (
      <div className="mt-8 flex aspect-video items-center justify-center rounded-2xl bg-soft">
        <p className="text-xs text-muted-foreground">Belum ada media</p>
      </div>
    )
  }

  const current = mediaList[Math.min(active, mediaList.length - 1)]

  return (
    <div className="mt-8">
      <div className="overflow-hidden rounded-2xl border border-line bg-card">
        {current.type === "image" ? (
          <button
            onClick={() => setLightbox(current.src || "")}
            className="block w-full cursor-zoom-in"
            aria-label="Perbesar foto"
          >
            <Image
              src={current.src || ""}
              alt={item.title}
              width={1200}
              height={800}
              className="h-auto max-h-[560px] w-full object-contain"
              priority
            />
          </button>
        ) : (
          <VideoEmbed url={current.url || ""} title={item.title} />
        )}
      </div>

      {mediaList.length > 1 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-muted-foreground">
            Media Lainnya ({mediaList.length})
          </p>
          <div className="mt-2 flex gap-3 overflow-x-auto pb-2">
            {mediaList.map((m, i) => (
              <button
                key={(m.src ?? m.url ?? "") + i}
                onClick={() => setActive(i)}
                className={cn(
                  "relative h-20 w-28 shrink-0 overflow-hidden rounded-xl border-2 transition-all",
                  i === active ? "border-accent" : "border-line opacity-60 hover:opacity-100"
                )}
                aria-label={`Media ${i + 1}`}
              >
                {m.type === "image" ? (
                  <Image
                    src={m.src ?? ""}
                    alt=""
                    width={224}
                    height={160}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-soft">
                    <Film className="h-5 w-5 text-accent" />
                    <span className="text-[9px] text-muted-foreground">Video</span>
                  </div>
                )}
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
