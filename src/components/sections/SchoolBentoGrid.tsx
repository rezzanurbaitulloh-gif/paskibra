"use client"

import { motion } from "framer-motion"
import { GraduationCap, Target, MapPin, BookOpen } from "lucide-react"
import Image from "next/image"
import { SectionHeader } from "./SectionHeader"
import { cn } from "@/lib/utils"
import { useSiteSettings } from "@/contexts/SiteSettingsContext"

const ICONS = [GraduationCap, Target, BookOpen, MapPin, Target]
const CLASSNAMES = ["md:col-span-2 md:row-span-2", "md:col-span-1", "md:col-span-1", "md:col-span-1", "md:col-span-1"]

export function SchoolBentoGrid() {
  const { settings } = useSiteSettings()
  const items = settings.school.items.map((item, index) => ({
    title: item.title,
    icon: ICONS[index % ICONS.length] || Target,
    content: item.content,
    image: item.image,
    className: CLASSNAMES[index % CLASSNAMES.length] || "md:col-span-1",
  }))
  return (
    <section id="sekolah" className="relative py-24">
      <div className="container mx-auto px-4">
        <SectionHeader
          label={settings.school.label}
          title={settings.school.title}
          subtitle={settings.school.subtitle}
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
              <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-card p-6 card-glow">
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
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-soft">
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