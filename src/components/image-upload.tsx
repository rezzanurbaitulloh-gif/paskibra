"use client"

import { useRef, useState } from "react"
import { Upload, Loader2, X, Crop } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { ImageCropDialog } from "@/components/ui/image-crop-dialog"

async function uploadBlob(blob: Blob, filename: string) {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const fd = new FormData()
  fd.append("file", blob, filename)
  fd.append("name", filename)
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { Authorization: `Bearer ${session?.access_token}` },
    body: fd,
  })
  const data = await res.json()
  if (!res.ok || !data.url) throw new Error(data.error || "Upload gagal")
  return data.url as string
}

export function ImageUpload({
  value,
  onChange,
  label = "Upload Gambar",
  className = "",
  aspect = null,
  hideHint = false,
}: {
  value: string
  onChange: (url: string) => void
  label?: string
  className?: string
  aspect?: number | null
  hideHint?: boolean
}) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [cropOpen, setCropOpen] = useState(false)
  const [cropImage, setCropImage] = useState("")
  const ref = useRef<HTMLInputElement>(null)

  const handle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    setError("")
    const isRaster = ["image/png", "image/jpeg", "image/webp"].includes(file.type)
    if (!isRaster) {
      await doUpload(file)
      return
    }
    const url = URL.createObjectURL(file)
    setCropImage(url)
    setCropOpen(true)
  }

  const doUpload = async (file: Blob) => {
    setUploading(true)
    setError("")
    try {
      const url = await uploadBlob(file, `gambar-${Date.now()}.jpg`)
      onChange(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload gagal")
    } finally {
      setUploading(false)
    }
  }

  const handleCropConfirm = async (blob: Blob) => {
    const url = await uploadBlob(blob, `gambar-${Date.now()}.jpg`)
    setCropOpen(false)
    if (cropImage) URL.revokeObjectURL(cropImage)
    onChange(url)
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
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crop className="h-4 w-4" />}
        {uploading ? "Mengunggah..." : label}
      </button>
      {!hideHint && (
        <p className="mt-1 text-[10px] text-muted-foreground">
          Foto akan dibuka untuk disesuaikan (crop) sebelum diunggah.
        </p>
      )}
      <input
        ref={ref}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
        className="hidden"
        onChange={handle}
      />
      {error && <p className="mt-1 text-[10px] text-red-400">{error}</p>}
      <ImageCropDialog
        open={cropOpen}
        image={cropImage}
        defaultAspect={aspect}
        onCancel={() => {
          setCropOpen(false)
          if (cropImage) URL.revokeObjectURL(cropImage)
        }}
        onConfirm={handleCropConfirm}
      />
    </div>
  )
}
