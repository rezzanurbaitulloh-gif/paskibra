"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSiteSettings } from "@/contexts/SiteSettingsContext"

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
}

const wordReveal = {
  hidden: { opacity: 0, y: 40, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  },
}

export function HeroSection({ realStats }: { realStats?: { value: string; label: string }[] }) {
  const { scrollY } = useScroll()
  const bgY = useTransform(scrollY, [0, 600], [0, 120])
  const { settings } = useSiteSettings()
  const heroWords = (settings.hero.title || "SATRIA CENGKARA")
    .toUpperCase()
    .split(/\s+/)
    .filter(Boolean)
  const titleLines = heroWords.length > 1
    ? heroWords.slice(0, Math.ceil(heroWords.length / 2))
    : [heroWords[0] || "SATRIA CENGKARA"]
  const gradientWords = heroWords.slice(Math.ceil(heroWords.length / 2))

  return (
    <section id="beranda" className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Background layers */}
      <motion.div style={{ y: bgY }} className="absolute inset-0 -z-10 will-change-transform">
        <div className="absolute inset-0 bg-radial-glow" />
        <div className="absolute -top-40 -right-40 h-[480px] w-[480px] rounded-full bg-secondary/10 blur-[140px]" />
        <div className="absolute -bottom-40 -left-40 h-[480px] w-[480px] rounded-full bg-primary/10 blur-[140px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
      </motion.div>


      {/* Hero content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pt-28 pb-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 rounded-full border border-line bg-soft px-4 py-1.5 text-xs text-muted-foreground backdrop-blur"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
          </span>
          Paskibra • {settings.branding.schoolName}
        </motion.div>

        <motion.h1
          variants={container}
          initial="hidden"
          animate="visible"
          className="mt-8 font-display font-extrabold leading-[0.95] tracking-tight"
        >
          {titleLines.map((line) => (
            <span key={line} className="block">
              {line.split("").map((char, i) => (
                <motion.span
                  key={i}
                  variants={wordReveal}
                  className={cn("inline-block")}
                >
                  {char}
                </motion.span>
              ))}
            </span>
          ))}
          {gradientWords.length > 0 && (
            <span className="block">
              {gradientWords.map((word, wi) => (
                <span key={word}>
                  {word.split("").map((char, i) => (
                    <motion.span
                      key={i}
                      variants={wordReveal}
                      className="inline-block text-gradient-red"
                    >
                      {char}
                    </motion.span>
                  ))}
                  {wi < gradientWords.length - 1 && <span className="inline-block">&nbsp;</span>}
                </span>
              ))}
            </span>
          )}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="mt-6 max-w-xl text-sm md:text-base text-muted-foreground leading-relaxed"
        >
          {settings.hero.subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.6 }}
          className="mt-10 flex flex-col sm:flex-row items-center gap-3"
        >
          <Link
            href="#sekolah"
            className="group inline-flex items-center gap-2 rounded-xl gradient-primary px-7 py-3.5 text-sm font-semibold text-white shadow-glow-red transition-all hover:brightness-110 active:scale-[0.98]"
          >
            {settings.hero.ctaText || "Jelajahi Kami"}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="#penyewaan"
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-soft px-7 py-3.5 text-sm font-medium text-foreground backdrop-blur transition-all hover:border-white/20 hover:bg-soft active:scale-[0.98]"
          >
            {settings.heroExtras.secondaryCta || "Sewa Kostum & Pasukan"}
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.6 }}
          className="mt-16 grid grid-cols-3 gap-8 md:gap-16"
        >
          {(realStats && realStats.length > 0 ? realStats : settings.heroExtras.stats).map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="font-display text-2xl md:text-3xl font-bold text-gradient">{stat.value}</p>
              <p className="mt-1 text-[11px] md:text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>

      <motion.a
        href="#sekolah"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
        aria-label="Scroll ke bawah"
      >
        <ChevronDown className="h-5 w-5 animate-bounce" />
      </motion.a>
    </section>
  )
}