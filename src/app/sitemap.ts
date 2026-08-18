import { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "")
  const now = new Date()
  const routes = [
    "",
    "/berita",
    "/prestasi",
    "/galeri",
    "/layanan",
    "/pengurus",
    "/lomba",
    "/saran",
    "/login",
  ]
  return routes.map((route) => ({
    url: `${base}${route}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1 : 0.7,
  }))
}
