"use client"

import { motion } from "framer-motion"
import { GraduationCap, Target, MapPin, BookOpen } from "lucide-react"
import Image from "next/image"
import { SectionHeader } from "./SectionHeader"
import { cn } from "@/lib/utils"

const items = [
  {
    title: "Profil Sekolah",
    icon: GraduationCap,
    content:
      "SMKN 1 Kertosono adalah sekolah kejuruan unggulan di Kabupaten Nganjuk yang berfokus pada pengembangan kompetensi siswa di bidang teknologi dan industri.",
    image: "/logo-icon.png",
    className: "md:col-span-2 md:row-span-2",
  },
  {
    title: "Visi & Misi",
    icon: Target,
    content:
      "Menjadi sekolah kejuruan unggul yang menghasilkan lulusan berkompeten, berkarakter, dan siap bersaing di dunia industri global.",
    className: "md:col-span-1",
  },
  {
    title: "Jurusan",
    icon: BookOpen,
    content:
      "TKJ, RPL, TEI, TKR, dan DKV — lima kompetensi keahlian unggulan untuk masa depan.",
    className: "md:col-span-1",
  },
  {
    title: "Lokasi",
    icon: MapPin,
    content: "Jl. Raya Kertosono, Kab. Nganjuk, Jawa Timur.",
    className: "md:col-span-1",
  },
  {
    title: "Ekstrakurikuler",
    icon: Target,
    content: "Paskibra, Pramuka, PMR, Futsal, hingga Robotik.",
    className: "md:col-span-1",
  },
]

export function SchoolBentoGrid() {
  return (
    <section id="sekolah" className="relative py-24">
      <div className="container mx-auto px-4">
        <SectionHeader
          label="Tentang Sekolah"
          title="SMKN 1 Kertosono"
          subtitle="Sekolah yang melahirkan Satria Cengkara — calon pemimpin bangsa."
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2">
          {items.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.06 }}
              viewport={{ once: true, margin: "-60px" }}
              className={cn(item.className)}
            >
              <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-card p-6 card-glow">
                {item.image && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.05]">
                    <Image
                      src={item.image}
                      alt=""
                      width={220}
                      height={220}
                      className="object-contain"
                      style={{ width: "auto", height: "auto" }}
                    />
                  </div>
                )}
                <div className="relative">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                    <item.icon className="h-5 w-5 text-accent" />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-bold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.content}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}