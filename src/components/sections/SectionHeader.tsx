"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export function SectionHeader({
  label,
  title,
  subtitle,
  actionLabel,
  actionHref,
}: {
  label: string
  title: string
  subtitle?: string
  actionLabel?: string
  actionHref?: string
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
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="group mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-accent transition-colors hover:text-foreground"
        >
          {actionLabel}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </motion.div>
  )
}