"use client"

import { motion } from "framer-motion"

export function SectionHeader({
  label,
  title,
  subtitle,
}: {
  label: string
  title: string
  subtitle?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true, margin: "-80px" }}
      className="mx-auto mb-12 max-w-2xl text-center"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">{label}</p>
      <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">{title}</h2>
      {subtitle && <p className="mt-3 text-sm text-muted-foreground md:text-base">{subtitle}</p>}
    </motion.div>
  )
}