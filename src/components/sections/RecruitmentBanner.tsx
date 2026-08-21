import Link from "next/link"
import { UserPlus, ArrowRight, ClipboardCheck, Users2, Award } from "lucide-react"

const STEPS = [
  {
    icon: ClipboardCheck,
    title: "Daftar Online",
    desc: "Isi formulir rekrutmen — butuh waktu kurang dari 2 menit.",
  },
  {
    icon: Users2,
    title: "Ikuti Seleksi",
    desc: "Tim kami menghubungi Anda untuk latihan & seleksi.",
  },
  {
    icon: Award,
    title: "Jadi Anggota",
    desc: "Resmi bergabung dan dilantik sebagai anggota Satria Cengkara.",
  },
]

export function RecruitmentBanner() {
  return (
    <section className="relative py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="relative overflow-hidden rounded-3xl gradient-primary p-8 text-white shadow-glow-red md:p-12">
          <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/4 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

          <div className="relative grid items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider backdrop-blur">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
                </span>
                Open Recruitment — Sedang Dibuka
              </p>
              <h2 className="mt-4 font-display text-3xl font-bold leading-tight md:text-4xl">
                Rekrutmen Anggota Baru
              </h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-white/85 md:text-base">
                Ingin bergabung dengan Paskibra Satria Cengkara? Daftar sekarang — pelatihan
                baris-berbaris, kedisiplinan, dan pengalaman berorganisasi yang berharga menantimu.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/pengurus"
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-6 text-sm font-bold text-primary shadow-lg transition-transform hover:scale-[1.03]"
                >
                  <UserPlus className="h-4 w-4" />
                  Daftar Jadi Anggota
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="#pengurus"
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/30 px-6 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/10"
                >
                  Lihat Struktur Organisasi
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {STEPS.map((step, i) => (
                <div
                  key={step.title}
                  className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
                      <step.icon className="h-5 w-5" />
                    </span>
                    <p className="text-xs font-bold uppercase tracking-wider text-white/60">
                      Langkah {i + 1}
                    </p>
                  </div>
                  <p className="mt-3 text-sm font-bold">{step.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-white/80">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
