import { supabase } from "@/lib/supabase/server"
import Link from "next/link"
import { Newspaper, ArrowRight } from "lucide-react"
import { EmptyState } from "@/components/ui/empty-state"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Berita & Pengumuman — Satria Cengkara",
  description: "Kabar terbaru dari Paskibra Satria Cengkara SMKN 1 Kertosono.",
}

export default async function BeritaPage() {
  const { data: articles } = await supabase
    .from("articles")
    .select("*")
    .order("created_at", { ascending: false })

  return (
    <div id="konten" className="min-h-screen">
      <div className="container mx-auto px-4 pt-28 pb-16">
        <div className="mt-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Informasi Resmi</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold md:text-4xl">Berita & Pengumuman</h1>
          <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground">
            Informasi terbaru seputar kegiatan, lomba, dan agenda Satria Cengkara.
          </p>
        </div>

        <div className="mt-10">
          {!articles || articles.length === 0 ? (
            <EmptyState
              icon={Newspaper}
              title="Belum ada berita"
              description="Pengumuman dan kabar terbaru akan tampil di sini."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {articles.map((a, index) => (
                <Link
                  key={a.id}
                  href={`/berita/${a.slug}`}
                  className="group flex flex-col rounded-2xl border border-line bg-card p-6 transition-all card-glow hover:border-accent/40"
                >
                  <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <Newspaper className="h-3.5 w-3.5 text-accent" />
                    {new Date(a.created_at).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </div>
                  <h2 className="mt-3 font-display text-lg font-bold leading-snug group-hover:text-accent">
                    {a.title}
                  </h2>
                  <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                    {a.content}
                  </p>
                  <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-xs font-medium text-accent">
                    Baca selengkapnya
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
