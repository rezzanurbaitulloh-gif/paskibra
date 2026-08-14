"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { supabase } from "@/lib/supabase/client"
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
}

const fmt = (n: number) => "Rp " + n.toLocaleString("id-ID")

export default function LayananPage() {
  const [items, setItems] = useState<Item[]>([])
  const [category, setCategory] = useState("Semua")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchItems = async () => {
      const { data } = await supabase.from("inventory").select("*").order("name")
      setItems(data || [])
      setLoading(false)
    }
    fetchItems()
  }, [])

  const categories = ["Semua", ...Array.from(new Set(items.map((i) => i.category)))]
  const filtered = category === "Semua" ? items : items.filter((i) => i.category === category)
  const available = filtered.filter((i) => i.is_available)

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 pt-28 pb-16">
        <Link href="/#beranda" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke Beranda
        </Link>

        <div className="mt-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Layanan & Sewa</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold md:text-4xl">Sewa Perlengkapan Paskibra</h1>
          <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground">
            Sewa seragam, atribut, dan perlengkapan upacara untuk kebutuhan acara Anda.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {categories.map((c) => (
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

        {loading ? (
          <p className="mt-12 text-center text-sm text-muted-foreground">Memuat...</p>
        ) : available.length === 0 ? (
          <div className="mt-12 flex flex-col items-center py-16 text-center">
            <Package className="h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">Belum ada perlengkapan tersedia.</p>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {available.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
              >
                <Link
                  href={`/layanan/${item.slug || item.id}`}
                  className="group block overflow-hidden rounded-2xl border border-line bg-card card-glow"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-soft">
                    {item.image_url ? (
                      <Image
                        src={item.image_url}
                        alt={item.name}
                        width={600}
                        height={450}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Package className="h-10 w-10 text-muted-foreground/40" />
                      </div>
                    )}
                    <span className="absolute left-3 top-3 rounded-md bg-black/60 px-2 py-1 text-[10px] font-medium text-white backdrop-blur">
                      {item.category}
                    </span>
                  </div>
                  <div className="p-5">
                    <h3 className="font-display text-sm font-bold">{item.name}</h3>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="font-display text-base font-bold text-accent">{fmt(Number(item.price))}<span className="text-[10px] font-normal text-muted-foreground">/sewa</span></p>
                      {item.stock > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-green-400">
                          <BadgeCheck className="h-3.5 w-3.5" /> Stok {item.stock}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-red-400">
                          <BadgeX className="h-3.5 w-3.5" /> Habis
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}