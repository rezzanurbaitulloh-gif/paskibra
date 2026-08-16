"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import ReactCrop, { type Crop } from "react-image-crop"
import { Button } from "@/components/ui/button"
import { Loader2, X } from "lucide-react"
import { cn } from "@/lib/utils"

const ASPECT_PRESETS: { label: string; value: number | null }[] = [
  { label: "Gambar Penuh", value: null },
  { label: "Kotak", value: 1 },
  { label: "4:3", value: 4 / 3 },
  { label: "3:4", value: 3 / 4 },
  { label: "16:9", value: 16 / 9 },
]

async function getCroppedBlob(
  src: string,
  area: { x: number; y: number; width: number; height: number },
  maxSize = 2560
): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })

  const scale = Math.min(1, maxSize / Math.max(area.width, area.height))
  const out = document.createElement("canvas")
  out.width = Math.max(1, Math.round(area.width * scale))
  out.height = Math.max(1, Math.round(area.height * scale))
  const octx = out.getContext("2d")!
  octx.imageSmoothingQuality = "high"
  octx.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, out.width, out.height)
  const blob = await new Promise<Blob | null>((resolve) => out.toBlob(resolve, "image/jpeg", 0.92))
  if (!blob) throw new Error("Gagal memproses gambar")
  return blob
}

export function ImageCropDialog({
  open,
  image,
  originalFile = null,
  onUploadOriginal,
  onCancel,
  onConfirm,
}: {
  open: boolean
  image: string
  originalFile?: File | null
  onUploadOriginal?: (file: File) => Promise<void> | void
  onCancel: () => void
  onConfirm: (blob: Blob) => Promise<void> | void
}) {
  const [crop, setCrop] = useState<Crop>({ unit: "%", x: 0, y: 0, width: 100, height: 100 })
  const [aspect, setAspect] = useState<number | null>(null)
  const [sizePct, setSizePct] = useState(100)
  const [imgSize, setImgSize] = useState({ width: 0, height: 0 })
  const [busy, setBusy] = useState(false)
  const readyRef = useRef(false)
  const [prevOpen, setPrevOpen] = useState(open)
  const [prevImage, setPrevImage] = useState(image)

  if (open && (prevOpen !== open || prevImage !== image)) {
    setPrevOpen(open)
    setPrevImage(image)
    setAspect(null)
    setSizePct(100)
    setCrop({ unit: "%", x: 0, y: 0, width: 100, height: 100 })
    setBusy(false)
  }

  useEffect(() => {
    readyRef.current = false
    if (!open || !image) return
    const img = new Image()
    img.onload = () => {
      setImgSize({ width: img.naturalWidth, height: img.naturalHeight })
      setCrop({ unit: "%", x: 0, y: 0, width: 100, height: 100 })
      readyRef.current = true
    }
    img.onerror = () => {
      readyRef.current = true
    }
    img.src = image
  }, [open, image])

  const centeredAspectCrop = (ratio: number, widthPct: number): Crop => {
    let w = widthPct
    let h = w / ratio
    if (h > 100) {
      h = 100
      w = h * ratio
    }
    return { unit: "%", x: (100 - w) / 2, y: (100 - h) / 2, width: w, height: h }
  }

  const pickAspect = (value: number | null) => {
    setAspect(value)
    if (value) {
      setCrop(centeredAspectCrop(value, sizePct))
    } else {
      const w = Math.min(100, Math.max(20, sizePct))
      const h = Math.min(100, Math.max(20, (crop.height / crop.width) * w))
      setCrop({ unit: "%", x: (100 - w) / 2, y: (100 - h) / 2, width: w, height: h })
    }
  }

  const applySize = (pct: number) => {
    setSizePct(pct)
    if (aspect) {
      setCrop(centeredAspectCrop(aspect, pct))
    } else {
      setCrop((prev) => {
        const w = pct
        const h = Math.min(100, Math.max(5, (prev.height / prev.width) * w))
        return { unit: "%", x: prev.x + (prev.width - w) / 2, y: prev.y + (prev.height - h) / 2, width: w, height: h }
      })
    }
  }

  const onCropComplete = useCallback(
    (_: Crop, percentCrop: Crop) => {
      setCrop(percentCrop)
      setSizePct(percentCrop.width)
    },
    []
  )

  const handleConfirm = async () => {
    if (busy || imgSize.width === 0) return
    setBusy(true)
    try {
      const area = {
        x: Math.round((crop.x / 100) * imgSize.width),
        y: Math.round((crop.y / 100) * imgSize.height),
        width: Math.round((crop.width / 100) * imgSize.width),
        height: Math.round((crop.height / 100) * imgSize.height),
      }
      const blob = await getCroppedBlob(image, area)
      await onConfirm(blob)
    } catch (err) {
      console.error("Crop gagal:", err)
    } finally {
      setBusy(false)
    }
  }

  const handleUploadOriginal = async () => {
    if (busy || !originalFile) return
    setBusy(true)
    try {
      await onUploadOriginal?.(originalFile)
    } catch (err) {
      console.error("Upload asli gagal:", err)
    } finally {
      setBusy(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-line bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h3 className="font-display font-bold">Sesuaikan Gambar</h3>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-soft hover:text-foreground"
            aria-label="Tutup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative flex h-64 w-full items-center justify-center overflow-hidden bg-black/80 sm:h-72">
          <ReactCrop
            crop={crop}
            onChange={(_, pct) => setCrop(pct)}
            onComplete={onCropComplete}
            aspect={aspect ?? undefined}
            minWidth={5}
            minHeight={5}
            keepSelection
            style={{ width: "100%", height: "100%" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt="" className="max-h-full max-w-full" />
          </ReactCrop>
        </div>

        <div className="space-y-3 px-5 py-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {ASPECT_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => pickAspect(p.value)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  aspect === p.value
                    ? "border-primary/60 bg-primary/15 text-primary"
                    : "border-line bg-soft text-muted-foreground hover:text-foreground"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <span className="shrink-0 text-xs text-muted-foreground">Ukuran area</span>
            <input
              type="range"
              min={20}
              max={100}
              step={1}
              value={sizePct}
              onChange={(e) => applySize(Number(e.target.value))}
              className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-soft accent-[var(--primary)]"
            />
            <span className="w-9 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
              {Math.round(sizePct)}%
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Seret sudut/handle kotak untuk mengubah ukuran area crop, atau geser slider. Rasio “Gambar Penuh”
            = area bebas sesuai ukuran asli foto.
          </p>

          <div className="flex gap-2 pt-1">
            {originalFile && (
              <Button
                variant="ghost"
                onClick={handleUploadOriginal}
                disabled={busy}
                className="flex-1 border border-line"
                title="File diunggah apa adanya tanpa dipotong/kompresi"
              >
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {busy ? "Mengunggah..." : "Unggah Asli"}
              </Button>
            )}
            <Button
              onClick={handleConfirm}
              disabled={busy || imgSize.width === 0}
              className="flex-1 text-white gradient-primary"
            >
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {busy ? "Memproses..." : "Simpan & Unggah"}
            </Button>
          </div>
          {originalFile && (
            <p className="text-center text-[11px] text-muted-foreground">
              {"\u201cUnggah Asli\u201d menyimpan foto sesuai resolusi aslinya tanpa dipotong. Ukuran maksimal 10MB."}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
