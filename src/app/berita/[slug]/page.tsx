import { notFound } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase/server"
import { ArrowLeft, Newspaper } from "lucide-react"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { data: article } = await supabase
    .from("articles")
    .select("title, content")
    .eq("slug", slug)
    .maybeSingle()
  return {
    title: article ? `${article.title} — Satria Cengkara` : "Berita — Satria Cengkara",
    description: article ? article.content.slice(0, 160) : "Berita Satria Cengkara",
  }
}

export default async function BeritaDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { data: article } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .maybeSingle()

  if (!article) notFound()

  const paragraphs = String(article.content || "")
    .split(/\n{2,}/)
    .map((p: string) => p.trim())
    .filter(Boolean)

  return (
    <div id="konten" className="min-h-screen">
      <div className="container mx-auto max-w-3xl px-4 pt-28 pb-16">
        <Link
          href="/berita"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Semua Berita
        </Link>

        <article className="mt-6 rounded-2xl border border-line bg-card p-6 md:p-10">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Newspaper className="h-3.5 w-3.5 text-accent" />
            {new Date(article.created_at).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>
          <h1 className="mt-4 font-display text-3xl font-extrabold leading-tight md:text-4xl">
            {article.title}
          </h1>
          <div className="mt-6 space-y-4">
            {paragraphs.map((p: string, i: number) => (
              <p key={i} className="text-sm leading-relaxed text-muted-foreground md:text-base">
                {p}
              </p>
            ))}
          </div>
        </article>
      </div>
    </div>
  )
}
