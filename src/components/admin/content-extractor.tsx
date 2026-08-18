"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ListEditor, type ListField } from "@/components/admin/ListEditor"
import { supabase } from "@/lib/supabase/client"
import { Sparkles, Upload, Loader2, Check, RefreshCw } from "lucide-react"

export type ExtractMode = "sejarah" | "filosofi" | "sekolah" | "text"

interface ContentExtractorProps {
  mode: ExtractMode
  title: string
  description?: string
  contextLabel?: string
  fields?: ListField[]
  value: Record<string, unknown>[] | string
  onApply: (value: Record<string, unknown>[] | string) => void
}

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"]

export function ContentExtractor({ mode, title, description, contextLabel, fields, value, onApply }: ContentExtractorProps) {
  const [file, setFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState("")
  const [busy, setBusy] = useState(false)
  const [refining, setRefining] = useState(false)
  const [error, setError] = useState("")
  const [instruction, setInstruction] = useState("")
  const [items, setItems] = useState<Record<string, unknown>[]>([])
  const [text, setText] = useState("")

  const hasResult = mode === "text" ? text.length > 0 : items.length > 0

  const getToken = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    return session?.access_token || ""
  }

  const uploadImage = async (f: File) => {
    const form = new FormData()
    form.append("file", f)
    form.append("name", f.name)
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${await getToken()}` },
      body: form,
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || "Gagal mengunggah gambar")
    return data.url as string
  }

  const runExtract = async (params: {
    body?: FormData
    json?: Record<string, unknown>
  }) => {
    const headers: Record<string, string> = { Authorization: `Bearer ${await getToken()}` }
    if (params.json) headers["Content-Type"] = "application/json"
    const res = await fetch("/api/ai/extract", {
      method: "POST",
      headers,
      body: params.body ?? JSON.stringify(params.json),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || "Terjadi kesalahan")
    if (data.data) setItems(data.data as Record<string, unknown>[])
    if (data.text) setText(data.text as string)
  }

  const handleExtract = async () => {
    if (!file) {
      setError("Pilih file dokumen atau gambar terlebih dahulu.")
      return
    }
    setBusy(true)
    setError("")
    try {
      if (IMAGE_TYPES.includes(file.type)) {
        const url = await uploadImage(file)
        setImageUrl(url)
        await runExtract({
          json: { mode, imageUrl: url, context: contextLabel },
        })
      } else {
        const body = new FormData()
        body.append("file", file)
        body.append("mode", mode)
        if (contextLabel) body.append("context", contextLabel)
        await runExtract({ body })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengekstrak konten")
    } finally {
      setBusy(false)
    }
  }

  const handleRefine = async () => {
    if (!instruction.trim()) return
    setRefining(true)
    setError("")
    try {
      const current = mode === "text"
        ? text || (typeof value === "string" ? value : "")
        : items.length > 0
          ? items
          : Array.isArray(value)
            ? value
            : []
      const json: Record<string, unknown> = {
        mode,
        existing: current,
        instruction,
        context: contextLabel,
      }
      if (imageUrl) json.imageUrl = imageUrl
      await runExtract({ json })
      setInstruction("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memperbaiki konten")
    } finally {
      setRefining(false)
    }
  }

  const handleApply = () => {
    if (mode === "text") onApply(text)
    else onApply(items)
  }

  return (
    <Card className="border-line bg-soft/40">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 font-display text-base">
          <Sparkles className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent className="space-y-4">
        <label
          className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-line bg-card/50 px-4 py-3 transition-colors hover:border-primary/50"
        >
          <Upload className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate text-sm">
            {file ? file.name : "Pilih dokumen (.docx/.txt/.pdf) atau gambar (PNG/JPG/WebP)"}
          </span>
          <input
            type="file"
            accept=".docx,.doc,.txt,.pdf,.xlsx,.xls,.csv,.png,.jpeg,.jpg,.webp,.gif"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) {
                setFile(f)
                setError("")
              }
            }}
          />
        </label>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            onClick={handleExtract}
            disabled={!file || busy}
            variant="outline"
            className="border-primary/40 text-primary"
          >
            {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1.5 h-4 w-4" />}
            {busy ? "AI sedang menganalisis..." : "Ekstrak dengan AI"}
          </Button>
        </div>

        {hasResult && (
          <div className="space-y-4 border-t border-line pt-4">
            {mode === "text" ? (
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={4}
                className="glass border-line resize-none"
              />
            ) : (
              <ListEditor
                fields={fields || []}
                items={items}
                onChange={setItems}
                itemLabel="Item"
                addText="Tambah Item"
              />
            )}

            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">
                Perbaiki dengan AI <span className="font-normal">(opsional — tulis instruksi)</span>
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  placeholder="contoh: buat lebih ringkas / tambahkan detail upacara bendera"
                  className="h-9 border-line bg-card"
                />
                <Button
                  type="button"
                  onClick={handleRefine}
                  disabled={!instruction.trim() || refining}
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                >
                  {refining ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-1.5 h-4 w-4" />}
                  {refining ? "Memperbaiki..." : "Perbaiki"}
                </Button>
              </div>
            </div>

            <Button type="button" onClick={handleApply} className="gradient-primary w-full sm:w-auto">
              <Check className="mr-1.5 h-4 w-4" />
              Terapkan ke form
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
