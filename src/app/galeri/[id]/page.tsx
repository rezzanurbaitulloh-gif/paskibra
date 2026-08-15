import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { supabase } from "@/lib/supabase/server"
import { Calendar, FolderOpen, Inbox } from "lucide-react"
import { GalleryDetailClient } from "@/components/gallery-detail-client"

export const dynamic = "force-dynamic"

const CATEGORY_IMAGES: Record<string, string> = {
  LKBB: "/images/lkbb.svg",
  "Latihan Rutin": "/images/latihan.svg",
  Pelantikan: "/images/pelantikan.svg",
  Pengukuhan: "/images/pengukuhan.svg",
  "Kegiatan Lain": "/images/kegiatan.svg",
}

export default async function GaleriDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: item } = await supabase.from("gallery").select("*").eq("id", id).single()
  if (!item) notFound()

  const { data: related } = await supabase
    .from("gallery")
    .select("*")
    .eq("category", item.category)
    .neq("id", item.id)
    .order("created_at", { ascending: false })
    .limit(3)

  const images = [item.image_url, ...(item.images || [])].filter((u): u is string => Boolean(u))
  const videos =
    item.videos && item.videos.length > 0
      ? item.videos
      : item.video_url
        ? [item.video_url]
        : []
  const date = new Date(item.created_at)
  const dateLabel = date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 pt-28 pb-16">
  
        <div className="mx-auto mt-8 max-w-4xl">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-soft px-3 py-1 text-[11px] font-medium text-accent">
            <FolderOpen className="h-3 w-3" /> {item.category}
          </span>
          <h1 className="mt-3 font-display text-3xl font-extrabold md:text-4xl">{item.title}</h1>
          <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" /> Diunggah: {dateLabel}
            </span>
          </div>

          {item.description && (
            <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-muted-foreground md:text-base">
              {item.description}
            </p>
          )}

          <GalleryDetailClient item={item} images={images} videos={videos} />
        </div>

        {related && related.length > 0 && (
          <div className="mx-auto mt-16 max-w-4xl">
            <h2 className="font-display text-xl font-bold">Galeri Lainnya — {item.category}</h2>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {related.map((r) => (
                <Link
                  key={r.id}
                  href={`/galeri/${r.id}`}
                  className="group overflow-hidden rounded-2xl border border-line bg-card transition-all hover:border-accent/40"
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-soft">
                    {r.image_url ? (
                      <Image
                        src={r.image_url}
                        alt={r.title}
                        width={400}
                        height={300}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <Image
                        src={CATEGORY_IMAGES[r.category] || "/images/kegiatan.svg"}
                        alt=""
                        width={400}
                        height={300}
                        className="h-full w-full object-cover opacity-40"
                      />
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-sm font-semibold line-clamp-1">{r.title}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {(!related || related.length === 0) && (
          <div className="mx-auto mt-16 max-w-4xl text-center">
            <Inbox className="mx-auto h-6 w-6 text-muted-foreground" />
            <p className="mt-2 text-xs text-muted-foreground">Belum ada galeri lain di kategori ini.</p>
          </div>
        )}
      </div>
    </div>
  )
}