"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SectionHeader } from "./SectionHeader"
import { useSiteSettings } from "@/contexts/SiteSettingsContext"
import { cn } from "@/lib/utils"

interface Member {
  id: string
  name: string
  position: string
  division: string
  generation: string
  kelas?: string | null
  photo_url: string | null
}

function MemberCard({ member, index }: { member: Member; index: number }) {
  const isBPH = ["Ketua", "Wakil", "Sekretaris", "Bendahara"].some((p) =>
    member.position.toLowerCase().includes(p.toLowerCase())
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      viewport={{ once: true, margin: "-60px" }}
      whileHover={{ y: -6 }}
      className="group"
    >
      <div className="relative overflow-hidden rounded-2xl border border-line bg-card card-glow">
        {/* Foto */}
        <div className="relative aspect-[4/5] overflow-hidden bg-muted">
          {member.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={member.photo_url}
              alt={member.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="font-display text-6xl font-bold text-white/10">
                {member.name.charAt(0)}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
        </div>

        {/* Info */}
        <div className="absolute inset-x-0 bottom-0 p-4">
          <div className="mb-2">
            <Badge
              className={cn(
                "border-0 text-[10px] font-semibold",
                isBPH ? "gradient-gold text-black" : "bg-soft text-foreground"
              )}
            >
              {isBPH ? "★ " : ""}
              {member.generation}
            </Badge>
          </div>
          <h3 className="font-display text-base font-bold leading-tight">{member.name}</h3>
          <p className="mt-0.5 text-sm text-accent">{member.position}</p>
          <p className="text-xs text-muted-foreground">
            {member.division}
            {member.kelas ? ` • ${member.kelas}` : ""}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

export function StructureMembers({ members }: { members: Member[] }) {
  const { settings } = useSiteSettings()
  const st = settings.sectionTitles
  return (
    <section id="pengurus" className="relative py-16 md:py-24">
      <div className="container mx-auto px-4">
        <SectionHeader
          label={st.pengurusLabel}
          title={st.pengurusTitle}
          actionLabel="Lihat Semua Anggota"
          actionHref="/pengurus"
          subtitle={settings.pages.pengurusIntro}
        />

        {members.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5">
            {members.map((member, index) => (
              <MemberCard key={member.id} member={member} index={index} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-line bg-card/40 py-16 text-center">
            <p className="text-sm text-muted-foreground">
              Data pengurus belum tersedia — kelola melalui dashboard admin.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}