"use client"

import { motion } from "framer-motion"
import { Flag, Target, Trophy, Users } from "lucide-react"
import { SectionHeader } from "./SectionHeader"
import { useSiteSettings } from "@/contexts/SiteSettingsContext"

export function HistoryTimeline() {
  const { settings } = useSiteSettings()
  const timeline = settings.history.timeline
  return (
    <section id="sejarah" className="relative py-16 md:py-24">
      <div className="container mx-auto px-4">
        <SectionHeader
          label={settings.history.label}
          title={settings.history.title}
          subtitle={settings.history.subtitle}
        />

        <div className="mx-auto max-w-2xl">
          <div className="relative border-l border-line pl-8 ml-3">
            {timeline.map((item, index) => (
              <motion.div
                key={item.year}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                viewport={{ once: true, margin: "-60px" }}
                className="relative pb-10 last:pb-0"
              >
                <span className="absolute -left-[41px] top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-accent bg-background">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                </span>
                <p className="font-display text-sm font-bold text-accent">{item.year}</p>
                <h3 className="mt-1 font-display text-base font-bold">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

const PHIL_ICONS = [Flag, Target, Trophy, Users]

export function LogoPhilosophy() {
  const { settings } = useSiteSettings()
  const elements = settings.philosophy.items.map((item, index) => ({
    icon: PHIL_ICONS[index % PHIL_ICONS.length] || Flag,
    title: item.title,
    desc: item.desc,
  }))
  return (
    <section id="filosofi" className="relative py-16 md:py-24">
      <div className="container mx-auto px-4">
        <SectionHeader
          label={settings.philosophy.label}
          title={settings.philosophy.title}
        />

        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, margin: "-80px" }}
            className="mx-auto"
          >
            <div className="relative flex h-44 w-44 items-center justify-center md:h-72 md:w-72">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border border-dashed border-white/15"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 36, repeat: Infinity, ease: "linear" }}
                className="absolute inset-5 rounded-full border border-dashed border-accent/20"
              />
              <div className="absolute inset-10 overflow-hidden rounded-full border border-line bg-card shadow-2xl shadow-black/40">
                <img src="/logo.png" alt="Logo Satria Cengkara" className="h-full w-full object-contain p-6" />
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-2 gap-3 md:gap-4">
            {elements.map((el, index) => (
              <motion.div
                key={el.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                viewport={{ once: true, margin: "-40px" }}
                className="rounded-2xl border border-line bg-card p-4 card-glow md:p-5"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-soft border border-line md:h-10 md:w-10">
                  <el.icon className="h-4 w-4 text-accent" />
                </div>
                <h3 className="mt-2.5 font-display text-sm font-bold">{el.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{el.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}