"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { supabase } from "@/lib/supabase/client"
import { Trophy } from "lucide-react"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"

interface Achievement {
  id: string
  title: string
  description: string | null
  image_url: string | null
  category: string
  created_at: string
}

export default function PrestasiPage() {
  const [items, setItems] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState("Semua")
  const [category, setCategory] = useState("Semua")

  useEffect(() => {
    const fetchItems = async () => {
      const { data } = await supabase
        .from("gallery")
        .select("*")
        .order("created_at", { ascending: false })
      setItems(data || [])
      setLoading(false)
    }
    fetchItems()
  }, [])

  const years = useMemo(() => {
    const set = new Set(items.map((i) => new Date(i.created_at).getFullYear().toString()))
    return ["Semua", ...Array.from(set).sort((a, b) => Number(b) - Number(a))]
  }, [items])

  const categories = useMemo(() => {
    const set = new Set(items.map((i) => i.category).filter(Boolean))
    return ["Semua", ...Array.from(set)]
  }, [items])

  const filtered = items.filter((i) => {
    if (year !== "Semua" && new Date(i.created_at).getFullYear().toString() !== year) return false
    if (category !== "Semua" && i.category !== category) return false
    return true
  })

  const chipClass = (active: boolean) =>
    active
      ? "gradient-primary text-white shadow-glow-red"
      : "border border-line bg-card text-muted-foreground hover:text-foreground"

  return (
    <div id="konten" className="min-h-screen">
      <div className="container mx-auto px-4 pt-28 pb-16">
        <div className="mt-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Pencapaian</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold md:text-4xl">Prestasi Satria Cengkara</h1>
          <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground">
            Jejak prestasi dan dokumentasi kegiatan dari tahun ke tahun.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          <span className="mr-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Tahun
          </span>
          {years.map((y) => (
            <button
              key={y}
              onClick={() => setYear(y)}
              className={`rounded-full px-4 py-2 text-xs font-medium transition-all ${chipClass(year === y)}`}
            >
              {y}
            </button>
          ))}
          <span className="ml-3 mr-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Kategori
          </span>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full px-4 py-2 text-xs font-medium transition-all ${chipClass(category === c)}`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="mt-10">
          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[4/3] rounded-2xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Trophy}
              title="Belum ada dokumentasi"
              description="Tidak ada dokumentasi yang cocok dengan filter tahun dan kategori ini."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.03 }}
                  viewport={{ once: true, margin: "-40px" }}
                >
                  <Link
                    href={`/galeri/${item.id}`}
                    className="group block overflow-hidden rounded-2xl border border-line bg-card transition-all card-glow"
                  >
                    {item.image_url && (
                      <div className="relative aspect-[4/3] w-full overflow-hidden">
                        <Image
                          src={item.image_url}
                          alt={item.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-block rounded-md border border-line bg-soft px-2 py-0.5 text-[10px] font-medium text-accent">
                          {item.category}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(item.created_at).getFullYear()}
                        </span>
                      </div>
                      <h2 className="mt-2 font-display text-base font-bold leading-snug group-hover:text-accent">
                        {item.title}
                      </h2>
                      {item.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
