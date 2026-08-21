"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { useSiteSettings } from "@/contexts/SiteSettingsContext"

export function AnimatedBackground() {
  const { settings } = useSiteSettings()
  const { watermarkPemuda, watermarkPemudi, watermarkOpacity } = settings.backgrounds
  const [mounted, setMounted] = useState(false)
  // eslint-disable-next-line react-hooks/set-state-in-effect -- guard hidrasi: animasi framer-motion hanya setelah mount
  useEffect(() => setMounted(true), [])

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-radial-glow" />

      {/* Watermark: Pemuda Paskibra (foto asli) */}
      {mounted && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2 }}
            className="absolute -right-8 top-20 hidden h-[380px] w-[380px] md:block lg:h-[480px] lg:w-[480px]"
          >
            {watermarkPemuda && (
              <motion.img
                src={watermarkPemuda}
                alt=""
                className="h-full w-full rounded-full object-cover grayscale-[35%] ring-1 ring-line"
                style={{ opacity: watermarkOpacity / 100 }}
                animate={{ y: [0, -18, 0], rotate: [-3, 3, -3] }}
                transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.4 }}
            className="absolute -left-10 bottom-4 hidden h-[280px] w-[280px] lg:block xl:h-[340px] xl:w-[340px]"
          >
            {watermarkPemudi && (
              <motion.img
                src={watermarkPemudi}
                alt=""
                className="h-full w-full rounded-full object-cover grayscale-[45%] ring-1 ring-line"
                style={{ opacity: watermarkOpacity / 100 }}
                animate={{ y: [0, 16, 0], rotate: [3, -3, 3], scale: [1, 1.03, 1] }}
                transition={{ duration: 17, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
          </motion.div>

          {/* Pulsa warna lembut */}
          <motion.div
            className="absolute left-1/2 top-0 h-[500px] w-[900px] -translate-x-1/2"
            style={{
              background:
                "radial-gradient(ellipse 60% 50% at 50% 0%, var(--glow-brand), transparent)",
            }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
        </>
      )}
    </div>
  )
}