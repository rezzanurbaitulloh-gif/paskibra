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

  const IMG_RE = /!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g

  const renderParagraph = (p: string, key: number) => {
    const isImageOnly = /^!\[[^\]]*\]\(https?:\/\/[^\s)]+\)$/.test(p)
    if (isImageOnly) {
      const m = p.match(/^!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)$/)!
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={key}
          src={m[2]}
          alt={m[1] || "Ilustrasi artikel"}
          className="w-full rounded-xl border border-line"
          loading="lazy"
        />
      )
    }
    if (!IMG_RE.test(p)) {
      return (
        <p key={key} className="text-sm leading-relaxed text-muted-foreground md:text-base">
          {p}
        </p>
      )
    }
    IMG_RE.lastIndex = 0
    const parts: React.ReactNode[] = []
    let last = 0
    let m: RegExpExecArray | null
    while ((m = IMG_RE.exec(p))) {
      if (m.index > last) parts.push(<span key={`t${last}`}>{p.slice(last, m.index)}</span>)
      parts.push(
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={`i${m.index}`}
          src={m[2]}
          alt={m[1] || "Ilustrasi artikel"}
          className="my-3 w-full rounded-xl border border-line"
          loading="lazy"
        />
      )
      last = m.index + m[0].length
    }
    if (last < p.length) parts.push(<span key={`t${last}`}>{p.slice(last)}</span>)
    return (
      <p key={key} className="text-sm leading-relaxed text-muted-foreground md:text-base">
        {parts}
      </p>
    )
  }

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
            {paragraphs.map((p: string, i: number) => renderParagraph(p, i))}
          </div>
        </article>
      </div>
    </div>
  )
}
