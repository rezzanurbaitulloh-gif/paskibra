"use client"

import { useEffect, useRef, useState } from "react"
import { embedFromUrl } from "@/lib/embed"
import { ExternalLink, Play } from "lucide-react"
import { cn } from "@/lib/utils"

export function VideoEmbed({
  url,
  title,
  className = "aspect-video w-full overflow-hidden rounded-2xl bg-black",
}: {
  url: string
  title: string
  className?: string
}) {
  const [inView, setInView] = useState(false)
  const [blocked, setBlocked] = useState(false)
  const observer = useRef<IntersectionObserver | null>(null)

  const onMount = (el: HTMLDivElement | null) => {
    if (!el) return
    if (observer.current) observer.current.disconnect()
    observer.current = new IntersectionObserver(
      (entries) => {
        // Autoplay saat masuk layar, berhenti saat keluar layar
        setInView(entries[0].isIntersecting)
      },
      { threshold: 0.35 }
    )
    observer.current.observe(el)
  }

  const embed = embedFromUrl(url)

  useEffect(() => {
    if (!embed || embed.type === "youtube") return
    const src = embed.type === "tiktok" ? "https://www.tiktok.com/embed.js" : "https://www.instagram.com/embed.js"
    const id = "ve-sdk-" + embed.type
    if (document.getElementById(id)) return
    const s = document.createElement("script")
    s.id = id
    s.src = src
    s.async = true
    document.body.appendChild(s)
  }, [embed?.type])

  if (!embed) {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-1.5 bg-soft", className)}>
        <Play className="h-8 w-8 text-muted-foreground" />
        <p className="px-4 text-center text-xs text-muted-foreground">Link video tidak valid</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          Buka link <ExternalLink className="ml-0.5 inline h-3 w-3" />
        </a>
      </div>
    )
  }

  if (blocked) {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-1.5 bg-soft", className)}>
        <p className="px-4 text-center text-xs text-muted-foreground">Video tidak bisa diputar di halaman ini.</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          Buka di platform <ExternalLink className="ml-0.5 inline h-3 w-3" />
        </a>
      </div>
    )
  }

  return (
    <div ref={onMount} className={className}>
      {inView ? (
        <iframe
          src={embed.embedUrl}
          className="h-full w-full"
          allow="autoplay; encrypted-media; picture-in-picture; web-share; clipboard-write"
          allowFullScreen
          title={title}
          loading="lazy"
          onError={() => setBlocked(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-soft">
          <div className="flex flex-col items-center gap-2">
            <Play className="h-8 w-8 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">Autoplay saat terlihat</span>
          </div>
        </div>
      )}
    </div>
  )
}
