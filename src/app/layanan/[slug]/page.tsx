"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { WA_MESSAGE_PREFIX } from "@/lib/constants"
import { ArrowLeft, Package, BadgeCheck, BadgeX } from "lucide-react"

interface Item {
  id: string
  name: string
  slug: string | null
  price: number
  stock: number
  is_available: boolean
  category: string
  description: string | null
  image_url: string | null
  wa_number?: string | null
}

const fmt = (n: number) => "Rp " + n.toLocaleString("id-ID")

export default function LayananDetailPage() {
  const params = useParams<{ slug: string }>()
  const [item, setItem] = useState<Item | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchItem = async () => {
      const { data } = await supabase
        .from("inventory")
        .select("*")
        .or(`slug.eq.${params.slug},id.eq.${params.slug}`)
        .maybeSingle()
      setItem(data)
      setLoading(false)
    }
    fetchItem()
  }, [params.slug])

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center"><p className="text-sm text-muted-foreground">Memuat...</p></div>
  }

  if (!item) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <Package className="h-10 w-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Perlengkapan tidak ditemukan.</p>
        <Link href="/layanan" className="rounded-lg border border-line px-4 py-2 text-sm hover:bg-soft">
          Kembali ke Layanan
        </Link>
      </div>
    )
  }

  const waLink = `https://wa.me/${item.wa_number}?text=${encodeURIComponent(`${WA_MESSAGE_PREFIX} ${item.name}`)}`

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 pt-28 pb-16">
        <Link href="/layanan" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Semua Layanan
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-2"
        >
          <div className="overflow-hidden rounded-2xl border border-line bg-card">
            {item.image_url ? (
              <Image
                src={item.image_url}
                alt={item.name}
                width={800}
                height={600}
                className="aspect-[4/3] w-full object-cover"
              />
            ) : (
              <div className="flex aspect-[4/3] w-full items-center justify-center bg-soft">
                <Package className="h-12 w-12 text-muted-foreground/40" />
              </div>
            )}
          </div>

          <div>
            <span className="rounded-md border border-line bg-soft px-2.5 py-1 text-[11px] font-medium text-accent">
              {item.category}
            </span>
            <h1 className="mt-3 font-display text-2xl font-extrabold md:text-3xl">{item.name}</h1>
            <p className="mt-2 font-display text-2xl font-bold text-accent">
              {fmt(Number(item.price))}
              <span className="text-xs font-normal text-muted-foreground"> / sekali sewa</span>
            </p>

            <div className="mt-4 flex items-center gap-2">
              {item.is_available && item.stock > 0 ? (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-400">
                  <BadgeCheck className="h-4 w-4" /> Tersedia — Stok {item.stock}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400">
                  <BadgeX className="h-4 w-4" /> Sedang Tidak Tersedia
                </span>
              )}
            </div>

            {item.description && (
              <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
            )}

            {item.is_available && item.stock > 0 && (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl gradient-primary px-8 py-3.5 text-sm font-semibold text-white shadow-glow-red transition-all hover:brightness-110 active:scale-[0.98]"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Sewa via WhatsApp
              </a>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}