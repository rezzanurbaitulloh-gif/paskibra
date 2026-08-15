"use client"

import { useSiteSettings } from "@/contexts/SiteSettingsContext"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { supabase } from "@/lib/supabase/client"
import { Users } from "lucide-react"

interface Member {
  id: string
  name: string
  position: string
  division: string
  generation: string
  photo_url: string | null
}

const initials = (name: string) =>
  name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()

export default function PengurusPage() {
  const { settings } = useSiteSettings()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMembers = async () => {
      const { data } = await supabase.from("structure_members").select("*").order("generation").order("position")
      setMembers(data || [])
      setLoading(false)
    }
    fetchMembers()
  }, [])

  const divisions = Array.from(new Set(members.map((m) => m.division)))

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 pt-28 pb-16">
  
        <div className="mt-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Struktur Organisasi</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold md:text-4xl">Daftar Anggota Satria Cengkara</h1>
          <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground">
            {settings.pages.pengurusIntro}
          </p>
        </div>

        {loading ? (
          <p className="mt-12 text-center text-sm text-muted-foreground">Memuat...</p>
        ) : members.length === 0 ? (
          <div className="mt-12 flex flex-col items-center py-16 text-center">
            <Users className="h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">Belum ada data pengurus.</p>
          </div>
        ) : (
          divisions.map((division) => {
            const list = members.filter((m) => m.division === division)
            return (
              <div key={division} className="mt-12">
                <h2 className="flex items-center gap-3 font-display text-xl font-bold">
                  <span className="h-6 w-1 rounded-full gradient-primary" />
                  {division}
                </h2>
                <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {list.map((member, index) => (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04 }}
                      className="rounded-2xl border border-line bg-card p-4 text-center card-glow"
                    >
                      <div className="relative mx-auto h-20 w-20 overflow-hidden rounded-full border border-line bg-soft">
                        {member.photo_url ? (
                          <Image src={member.photo_url} alt={member.name} fill className="object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center font-display text-lg font-bold text-accent">
                            {initials(member.name)}
                          </div>
                        )}
                      </div>
                      <p className="mt-3 text-sm font-semibold leading-snug">{member.name}</p>
                      <p className="mt-1 text-[11px] text-accent">{member.position}</p>
                      <p className="text-[10px] text-muted-foreground">{member.generation}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}