"use client"

import { useRef, useState } from "react"
import { Upload, Loader2, X } from "lucide-react"
import { supabase } from "@/lib/supabase/client"

export function ImageUpload({
  value,
  onChange,
  label = "Upload Gambar",
  className = "",
}: {
  value: string
  onChange: (url: string) => void
  label?: string
  className?: string
}) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const ref = useRef<HTMLInputElement>(null)

  const handle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError("")
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const fd = new FormData()
    fd.append("file", file)
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${session?.access_token}` },
      body: fd,
    })
    const data = await res.json()
    setUploading(false)
    if (res.ok && data.url) {
      onChange(data.url)
    } else {
      setError(data.error || "Upload gagal")
    }
    e.target.value = ""
  }

  return (
    <div className={className}>
      {value && (
        <div className="relative mb-2 h-28 w-full overflow-hidden rounded-lg border border-line bg-soft">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white transition-colors hover:bg-black/80"
            aria-label="Hapus gambar"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={() => ref.current?.click()}
        disabled={uploading}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-line bg-soft px-3 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:border-accent/50 hover:text-foreground disabled:opacity-60"
      >
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {uploading ? "Mengunggah..." : label}
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
        className="hidden"
        onChange={handle}
      />
      {error && <p className="mt-1 text-[10px] text-red-400">{error}</p>}
    </div>
  )
}