"use client"

import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, ArrowRight } from "lucide-react"
import { SectionHeader } from "./SectionHeader"
import { cn } from "@/lib/utils"
import { useSiteSettings } from "@/contexts/SiteSettingsContext"



interface RentalItem {
  id: string
  name: string
  description: string
  price: number
  available: boolean
  image_url: string
}

const formatIDR = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n)

export function RentalCatalog({ items }: { items: RentalItem[] }) {
  const { settings } = useSiteSettings()
  const waNumber = settings.contacts.waNumber || "6281234567890"
  const st = settings.sectionTitles
  return (
    <section id="penyewaan" className="relative py-16 md:py-24">
      <div className="container mx-auto px-4">
        <SectionHeader
          label={st.layananLabel}
          title={st.layananTitle}
          actionLabel="Katalog Lengkap"
          actionHref="/layanan"
          subtitle={settings.pages.layananIntro}
        />

        {items.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: index * 0.05 }}
                viewport={{ once: true, margin: "-60px" }}
                whileHover={{ y: -6 }}
                className="group"
              >
                <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-card card-glow">
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                    {item.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image_url}
                        alt={item.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <span className="font-display text-5xl font-bold text-white/10">
                          {item.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
                    <Badge
                      className={cn(
                        "absolute right-3 top-3 border-0 text-[10px] font-semibold",
                        item.available ? "bg-green-500/90 text-white" : "bg-red-500/90 text-white"
                      )}
                    >
                      {item.available ? "Tersedia" : "Sedang Disewa"}
                    </Badge>
                  </div>

                  <div className="flex flex-1 flex-col p-3 md:p-4">
                    <h3 className="font-display text-sm font-bold leading-tight">{item.name}</h3>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
                    <div className="mt-3 flex items-center justify-between gap-1 pt-2">
                      <p className="font-display text-xs font-bold text-accent md:text-sm">{formatIDR(item.price)}</p>
                      <a
                        href={`https://wa.me/${waNumber}?text=${encodeURIComponent(
                          `Halo Satria Cengkara, saya ingin menyewa ${item.name}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-semibold transition-all md:px-3 md:py-2 md:text-xs",
                          item.available
                            ? "bg-white text-black hover:bg-white/90 active:scale-[0.97]"
                            : "pointer-events-none bg-soft text-muted-foreground"
                        )}
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        Sewa via WA
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-line bg-card/40 py-16 text-center">
            <p className="text-sm text-muted-foreground">
              Katalog penyewaan belum tersedia — kelola melalui dashboard admin.
            </p>
          </div>
        )}

        <div className="mt-10 flex justify-center">
          <a
            href={`https://wa.me/${waNumber}?text=${encodeURIComponent(
              "Halo Satria Cengkara, saya ingin memesan jasa pasukan / kostum. Bisa dibantu?"
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-soft px-6 py-3 text-sm font-medium text-foreground transition-all hover:border-white/20 hover:bg-white/[0.07]"
          >
            Pesan Jasa Pasukan Khusus
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  )
}