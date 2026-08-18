"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import {
  CalendarDays,
  MapPin,
  Wallet,
  Clock,
  Phone,
  MessageCircle,
  Trophy,
  FileText,
  ListChecks,
  Image as ImageIcon,
  Download,
  Newspaper,
} from "lucide-react"
import { SectionHeader } from "@/components/sections/SectionHeader"
import { useSiteSettings } from "@/contexts/SiteSettingsContext"
import { VideoEmbed } from "@/components/video-embed"
import { supabase } from "@/lib/supabase/client"

interface UpdateRow {
  id: string
  title: string
  description: string
  image_url: string
  video_url: string
  created_at: string
}

interface DocumentRow {
  id: string
  title: string
  file_url: string
  file_name: string
  created_at: string
}

function InfoCard({
  icon: Icon,
  title,
  value,
  delay,
}: {
  icon: typeof CalendarDays
  title: string
  value: string
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      viewport={{ once: true, margin: "-40px" }}
      className="flex items-center gap-3 rounded-2xl border border-line bg-card p-4 card-glow"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-soft">
        <Icon className="h-5 w-5 text-accent" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
        <p className="mt-0.5 line-clamp-2 text-sm font-semibold text-foreground">{value}</p>
      </div>
    </motion.div>
  )
}

function TextCard({
  icon: Icon,
  title,
  desc,
  delay,
}: {
  icon: typeof Trophy
  title: string
  desc: string
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      viewport={{ once: true, margin: "-40px" }}
      className="rounded-2xl border border-line bg-card p-4 card-glow"
    >
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-soft">
          <Icon className="h-4 w-4 text-accent" />
        </div>
        <h3 className="font-display text-sm font-bold">{title}</h3>
      </div>
      <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">{desc}</p>
    </motion.div>
  )
}

export default function LombaPage() {
  const { settings } = useSiteSettings()
  const lkbb = settings.lkbb
  const images = lkbb.media.filter((m) => m.type === "image")
  const videos = lkbb.media.filter((m) => m.type === "video")
  const [updates, setUpdates] = useState<UpdateRow[]>([])
  const [docs, setDocs] = useState<DocumentRow[]>([])

  useEffect(() => {
    supabase.from("lkbb_updates").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      setUpdates(data || [])
    })
    supabase.from("lkbb_documents").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      setDocs(data || [])
    })
  }, [])

  return (
    <main className="pt-28">
      <section className="relative py-16 md:py-24">
        <div className="container mx-auto px-4">
          <SectionHeader label={lkbb.label} title={lkbb.title} subtitle={lkbb.subtitle} />
          <p className="mx-auto -mt-6 mb-10 max-w-2xl text-center text-sm leading-relaxed text-muted-foreground">
            {lkbb.intro}
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <InfoCard icon={CalendarDays} title="Tanggal" value={lkbb.date} delay={0} />
            <InfoCard icon={MapPin} title="Lokasi" value={lkbb.location} delay={0.05} />
            <InfoCard icon={Wallet} title="Biaya" value={lkbb.fee} delay={0.1} />
            <InfoCard
              icon={Clock}
              title="Batas Pendaftaran"
              value={lkbb.registrationDeadline}
              delay={0.15}
            />
            {lkbb.contacts.length > 0 ? (
              <div className="flex flex-col justify-center gap-2 rounded-2xl border border-line bg-card p-4 card-glow sm:col-span-2 lg:col-span-4">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 shrink-0 text-accent" />
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Info & Pendaftaran
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {lkbb.contacts.map((c, ci) => (
                    <Link
                      key={c.number}
                      href={`https://wa.me/${c.number.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-2 rounded-lg border border-line bg-soft px-3 py-2.5 transition-colors hover:border-accent/50"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-black">
                        {c.name.replace(/[^a-zA-Z]/g, "").charAt(0).toUpperCase()}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-semibold text-foreground">
                          {c.name}
                        </span>
                        <span className="block truncate text-[10px] text-muted-foreground">
                          {c.number}
                        </span>
                      </span>
                      <MessageCircle className="ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-accent" />
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <InfoCard icon={Phone} title="Info & Pendaftaran" value={lkbb.contact} delay={0.2} />
            )}
          </div>
        </div>
      </section>

      {lkbb.media.length > 0 && (
        <section className="relative py-16 md:py-24">
          <div className="container mx-auto px-4">
            <SectionHeader
              label="Media Lomba"
              title="Jejak Lomba Satria Cengkara"
              subtitle="Video dan dokumentasi lomba — video berputar otomatis saat terlihat."
            />
            <div className="space-y-10">
              {videos.length > 0 && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {videos.map((v, i) => (
                    <VideoEmbed key={i} url={v.url} title={`Video Lomba ${i + 1}`} />
                  ))}
                </div>
              )}
              {images.length > 0 && (
                <div className="columns-2 gap-3 sm:gap-4 lg:columns-3">
                  {images.map((img, i) => (
                    <div
                      key={i}
                      className="relative mb-3 overflow-hidden rounded-xl border border-line bg-soft sm:mb-4"
                    >
                      <Image
                        src={img.url}
                        alt={`Dokumentasi lomba ${i + 1}`}
                        width={600}
                        height={400}
                        className="h-auto w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {updates.length > 0 && (
        <section className="relative py-16 md:py-24">
          <div className="container mx-auto px-4">
            <SectionHeader
              label="Pembaruan"
              title="Perkembangan Lomba"
              subtitle="Informasi terbaru seputar persiapan dan jalannya lomba."
            />
            <div className="mx-auto max-w-3xl space-y-6">
              {updates.map((u, i) => (
                <motion.article
                  key={u.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  viewport={{ once: true, margin: "-40px" }}
                  className="overflow-hidden rounded-2xl border border-line bg-card card-glow"
                >
                  <div className="p-5">
                    <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <Newspaper className="h-3.5 w-3.5 text-accent" />
                      {new Date(u.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </div>
                    {u.title && (
                      <h3 className="mt-2 font-display text-base font-bold md:text-lg">{u.title}</h3>
                    )}
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {u.description}
                    </p>
                  </div>
                  {u.image_url && (
                    <div className="w-full overflow-hidden bg-soft">
                      <Image
                        src={u.image_url}
                        alt={u.title || "Pembaruan lomba"}
                        width={768}
                        height={1024}
                        sizes="(max-width: 768px) 100vw, 768px"
                        className="h-auto w-full object-cover"
                      />
                    </div>
                  )}
                  {u.video_url && (
                    <VideoEmbed
                      url={u.video_url}
                      title={u.title || `Video pembaruan ${i + 1}`}
                      className="aspect-video w-full rounded-none bg-black"
                    />
                  )}
                </motion.article>
              ))}
            </div>
          </div>
        </section>
      )}

      {docs.length > 0 && (
        <section className="relative py-16 md:py-24">
          <div className="container mx-auto px-4">
            <SectionHeader
              label="Dokumen"
              title="Unduh Dokumen Lomba"
              subtitle="Juknis, formulir pendaftaran, dan dokumen pendukung lainnya."
            />
            <div className="mx-auto grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2">
              {docs.map((d, i) => (
                <motion.a
                  key={d.id}
                  href={d.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.04 }}
                  viewport={{ once: true, margin: "-40px" }}
                  className="group flex items-center gap-3 rounded-2xl border border-line bg-card p-4 card-glow transition-colors hover:border-accent/40"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line bg-soft">
                    <FileText className="h-5 w-5 text-accent" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{d.title}</p>
                    <p className="truncate text-[10px] text-muted-foreground">{d.file_name}</p>
                  </div>
                  <Download className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-accent" />
                </motion.a>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="relative py-16 md:py-24">
        <div className="container mx-auto px-4">
          <SectionHeader
            label="Pendaftaran"
            title="Syarat & Ketentuan"
            subtitle="Pastikan seluruh syarat terpenuhi sebelum mendaftar."
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {lkbb.rules.map((r, i) => (
              <TextCard key={i} icon={FileText} title={r.title} desc={r.desc} delay={i * 0.05} />
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-16 md:py-24">
        <div className="container mx-auto px-4">
          <SectionHeader
            label="Cara Daftar"
            title="Alur Pendaftaran"
            subtitle="Empat langkah mudah untuk ikut serta."
          />
          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {lkbb.steps.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                viewport={{ once: true, margin: "-40px" }}
                className="relative rounded-2xl border border-line bg-card p-4 card-glow"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent font-display text-sm font-bold text-black">
                  {i + 1}
                </span>
                <h3 className="mt-3 font-display text-sm font-bold">{s.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-16 md:py-24">
        <div className="container mx-auto px-4">
          <SectionHeader
            label="Hadiah"
            title="Total Hadiah"
            subtitle="Juara membawa pulang piala, sertifikat, dan uang pembinaan."
          />
          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {lkbb.prizes.map((p, i) => (
              <TextCard key={i} icon={i === 0 ? Trophy : ListChecks} title={p.title} desc={p.desc} delay={i * 0.05} />
            ))}
          </div>
          <div className="mt-10 flex flex-col items-center gap-3">
            <Link
              href={`https://wa.me/${lkbb.whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-bold text-black transition-transform hover:-translate-y-0.5"
            >
              <MessageCircle className="h-4 w-4" />
              Daftarkan Sekolahmu Sekarang
            </Link>
            <p className="text-xs text-muted-foreground">
              Kuota terbatas — pendaftaran ditutup {lkbb.registrationDeadline}.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
