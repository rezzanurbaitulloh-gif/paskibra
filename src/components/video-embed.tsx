"use client"

import { useRef, useState } from "react"
import { embedFromUrl } from "@/lib/embed"
import { Play } from "lucide-react"
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
  if (!embed) {
    return (
      <div className={cn("flex items-center justify-center bg-soft", className)}>
        <p className="text-xs text-muted-foreground">Link video tidak valid</p>
      </div>
    )
  }

  return (
    <div ref={onMount} className={className}>
      {inView ? (
        <iframe
          src={embed.embedUrl}
          className="h-full w-full"
          allow="autoplay; encrypted-media; picture-in-picture; web-share"
          allowFullScreen
          title={title}
          loading="lazy"
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
