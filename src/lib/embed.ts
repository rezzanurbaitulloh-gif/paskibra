export function embedFromUrl(url: string): { type: "youtube" | "tiktok" | "instagram" | "iframe"; embedUrl: string } | null {
  if (!url) return null

  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{6,})/)
  if (yt) {
    return {
      type: "youtube",
      embedUrl: `https://www.youtube.com/embed/${yt[1]}?autoplay=1&muted=1&playsinline=1&rel=0`,
    }
  }

  const ytShort = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{6,})/)
  if (ytShort) {
    return {
      type: "youtube",
      embedUrl: `https://www.youtube.com/embed/${ytShort[1]}?autoplay=1&muted=1&playsinline=1&rel=0`,
    }
  }

  const tt = url.match(/tiktok\.com\/@[\w.-]+\/video\/(\d+)/)
  if (tt) {
    return { type: "tiktok", embedUrl: `https://www.tiktok.com/embed/v2/${tt[1]}` }
  }

  const ig = url.match(/instagram\.com\/(?:reel|p)\/([a-zA-Z0-9_-]+)/)
  if (ig) {
    return { type: "instagram", embedUrl: `https://www.instagram.com/${url.includes("/reel/") ? "reel" : "p"}/${ig[1]}/embed` }
  }

  return null
}