"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { CalendarDays, MapPin } from "lucide-react"
import { SectionHeader } from "./SectionHeader"

export interface EventItem {
  id: string
  title: string
  date: string
  location?: string
  description?: string
}

export function UpcomingEvents() {
  const [events, setEvents] = useState<EventItem[]>([])

  useEffect(() => {
    fetch(`/api/settings-json?key=events`)
      .then((r) => r.json())
      .then((data) => setEvents(Array.isArray(data.value) ? data.value : []))
      .catch(() => setEvents([]))
  }, [])

  const upcoming = useMemo(() => {
    const now = new Date()
    return events
      .filter((e) => e.date && new Date(e.date) >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5)
  }, [events])

  if (upcoming.length === 0) return null

  return (
    <section id="kegiatan" className="relative py-16 md:py-24">
      <div className="container mx-auto px-4">
        <SectionHeader
          label="Agenda"
          title="Kegiatan Mendatang"
          subtitle="Agenda resmi Satria Cengkara — jangan sampai terlewat."
        />
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {upcoming.map((event, i) => {
            const date = new Date(event.date)
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                viewport={{ once: true, margin: "-40px" }}
                className="flex gap-4 rounded-2xl border border-line bg-card p-4 card-glow"
              >
                <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl border border-line bg-soft">
                  <span className="text-lg font-display font-bold leading-none">
                    {date.getDate()}
                  </span>
                  <span className="text-[10px] font-semibold uppercase text-accent">
                    {date.toLocaleDateString("id-ID", { month: "short" })}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <CalendarDays className="h-3 w-3 text-accent" />
                    {date.getFullYear()}
                  </p>
                  <h3 className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug">{event.title}</h3>
                  {event.location && (
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="line-clamp-1">{event.location}</span>
                    </p>
                  )}
                  {event.description && (
                    <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                      {event.description}
                    </p>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
