"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"
import { X, Expand } from "lucide-react"
import { SectionHeader } from "./SectionHeader"
import { cn } from "@/lib/utils"

interface Achievement {
  id: string
  title: string
  description?: string
  image_url: string
  category: string
  year: string
}

export function AchievementsGallery({
  achievements,
  categories,
}: {
  achievements: Achievement[]
  categories: string[]
}) {
  const [active, setActive] = useState("Semua")
  const [selected, setSelected] = useState<Achievement | null>(null)

  const filtered =
    active === "Semua" ? achievements : achievements.filter((a) => a.category === active)
  const tabs = ["Semua", ...categories.filter((c) => c !== "Semua")]

  return (
    <section id="galeri" className="relative py-24">
      <div className="container mx-auto px-4">
        <SectionHeader
          label="Wall of Fame"
          title="Galeri & Prestasi"
          subtitle="Momen kebanggaan dan pencapaian Satria Cengkara di berbagai ajang."
        />

        {/* Filter */}
        <div className="mb-10 flex flex-wrap justify-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActive(tab)}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-medium transition-all",
                active === tab
                  ? "bg-white text-black"
                  : "border border-white/10 bg-white/[0.03] text-muted-foreground hover:text-foreground hover:border-white/20"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Masonry */}
        {filtered.length > 0 ? (
          <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 [column-fill:_balance]">
            {filtered.map((item, index) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.03 }}
                viewport={{ once: true, margin: "-40px" }}
                onClick={() => setSelected(item)}
                className="group relative mb-4 block w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-card text-left card-glow break-inside-avoid"
              >
                <div className="relative overflow-hidden">
                  {item.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image_url}
                      alt={item.title}
                      loading="lazy"
                      className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex aspect-video items-center justify-center bg-muted">
                      <span className="text-3xl opacity-30">🏆</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="absolute inset-x-0 bottom-0 translate-y-2 p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    <p className="text-xs text-accent">{item.category} • {item.year}</p>
                    <h3 className="mt-1 font-display text-sm font-bold text-white">{item.title}</h3>
                  </div>
                  <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white opacity-0 backdrop-blur transition-opacity duration-300 group-hover:opacity-100">
                    <Expand className="h-3.5 w-3.5" />
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-card/40 py-16 text-center">
            <p className="text-sm text-muted-foreground">
              Belum ada galeri — tambahkan melalui dashboard admin.
            </p>
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-card"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelected(null)}
                className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur hover:bg-black/70"
                aria-label="Tutup"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="max-h-[70vh] overflow-hidden bg-black/40">
                {selected.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selected.image_url}
                    alt={selected.title}
                    className="mx-auto max-h-[70vh] w-full object-contain"
                  />
                ) : (
                  <div className="flex aspect-video items-center justify-center">
                    <span className="text-6xl">🏆</span>
                  </div>
                )}
              </div>
              <div className="p-5">
                <p className="text-xs text-accent">{selected.category} • {selected.year}</p>
                <h3 className="mt-1 font-display text-lg font-bold">{selected.title}</h3>
                {selected.description && (
                  <p className="mt-2 text-sm text-muted-foreground">{selected.description}</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}