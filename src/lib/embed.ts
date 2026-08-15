export function embedFromUrl(url: string): { type: "youtube" | "tiktok" | "instagram" | "iframe"; embedUrl: string } | null {
  if (!url) return null
  const clean = url.trim()

  const yt = clean.match(
    /(?:youtube\.com\/(?:watch\?[^#]*v=|embed\/|live\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{6,})/
  )
  if (yt) {
    return {
      type: "youtube",
      embedUrl: `https://www.youtube.com/embed/${yt[1]}?autoplay=1&muted=1&playsinline=1&rel=0`,
    }
  }

  const ytAlt = clean.match(/(?:m|music)\.youtube\.com\/watch\?.*?v=([a-zA-Z0-9_-]{6,})/)
  if (ytAlt) {
    return {
      type: "youtube",
      embedUrl: `https://www.youtube.com/embed/${ytAlt[1]}?autoplay=1&muted=1&playsinline=1&rel=0`,
    }
  }

  const tt = clean.match(/tiktok\.com\/@[\w.-]+\/video\/(\d+)/)
  if (tt) {
    return { type: "tiktok", embedUrl: `https://www.tiktok.com/embed/v2/${tt[1]}` }
  }

  const ig = clean.match(/instagram\.com\/(?:reels?|p)\/([a-zA-Z0-9_-]+)/)
  if (ig) {
    const isReel = clean.includes("/reel")
    return {
      type: "instagram",
      embedUrl: `https://www.instagram.com/${isReel ? "reel" : "p"}/${ig[1]}/embed`,
    }
  }

  return null
}
