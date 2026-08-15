"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { useState } from "react"
import { ArrowUpRight } from "lucide-react"
import { SectionHeader } from "./SectionHeader"
import { useSiteSettings } from "@/contexts/SiteSettingsContext"
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
  const { settings } = useSiteSettings()
  const st = settings.sectionTitles

  const filtered =
    active === "Semua" ? achievements : achievements.filter((a) => a.category === active)
  const tabs = ["Semua", ...categories.filter((c) => c !== "Semua")]

  return (
    <section id="galeri" className="relative py-16 md:py-24">
      <div className="container mx-auto px-4">
        <SectionHeader
          label={st.galeriLabel}
          title={st.galeriTitle}
          actionLabel="Lihat Semua Galeri"
          actionHref="/galeri"
          subtitle={settings.pages.galeriIntro}
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
                  : "border border-line bg-soft text-muted-foreground hover:text-foreground hover:border-white/20"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Masonry */}
        {filtered.length > 0 ? (
          <div className="columns-2 gap-3 sm:gap-4 lg:columns-3 [column-fill:_balance]">
            {filtered.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.03 }}
                viewport={{ once: true, margin: "-40px" }}
                className="mb-4 break-inside-avoid"
              >
                <Link
                  href={`/galeri/${item.id}`}
                  className="group relative block w-full overflow-hidden rounded-2xl border border-line bg-card text-left card-glow"
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
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-line bg-card/40 py-16 text-center">
            <p className="text-sm text-muted-foreground">
              Belum ada galeri — tambahkan melalui dashboard admin.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
