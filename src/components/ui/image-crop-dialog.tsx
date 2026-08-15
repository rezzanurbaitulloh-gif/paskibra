"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Cropper from "react-easy-crop"
import { Button } from "@/components/ui/button"
import { Loader2, RotateCw, X } from "lucide-react"
import { cn } from "@/lib/utils"

const ASPECT_PRESETS: { label: string; value: number | null }[] = [
  { label: "Bebas", value: null },
  { label: "Kotak", value: 1 },
  { label: "4:3", value: 4 / 3 },
  { label: "3:4", value: 3 / 4 },
  { label: "16:9", value: 16 / 9 },
]

function rotateSize(w: number, h: number, rotation: number) {
  const rad = (rotation * Math.PI) / 180
  return rotation % 180 === 0
    ? { w, h }
    : {
        w: Math.round(Math.abs(w * Math.cos(rad)) + Math.abs(h * Math.sin(rad))),
        h: Math.round(Math.abs(w * Math.sin(rad)) + Math.abs(h * Math.cos(rad))),
      }
}

async function getCroppedBlob(
  src: string,
  area: { x: number; y: number; width: number; height: number },
  rotation: number,
  maxSize = 1600
): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })

  const { w: rotatedW, h: rotatedH } = rotateSize(area.width, area.height, rotation)
  const full = document.createElement("canvas")
  full.width = rotatedW
  full.height = rotatedH
  const fctx = full.getContext("2d")!
  fctx.imageSmoothingQuality = "high"
  fctx.translate(rotatedW / 2, rotatedH / 2)
  fctx.rotate((rotation * Math.PI) / 180)
  fctx.translate(-rotatedW / 2, -rotatedH / 2)
  fctx.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, area.width, area.height)

  const scale = Math.min(1, maxSize / Math.max(rotatedW, rotatedH))
  if (scale >= 1) {
    const blob = await new Promise<Blob | null>((resolve) =>
      full.toBlob(resolve, "image/jpeg", 0.92)
    )
    if (!blob) throw new Error("Gagal memproses gambar")
    return blob
  }

  const out = document.createElement("canvas")
  out.width = Math.round(rotatedW * scale)
  out.height = Math.round(rotatedH * scale)
  const octx = out.getContext("2d")!
  octx.imageSmoothingQuality = "high"
  octx.drawImage(full, 0, 0, out.width, out.height)
  const blob = await new Promise<Blob | null>((resolve) => out.toBlob(resolve, "image/jpeg", 0.92))
  if (!blob) throw new Error("Gagal memproses gambar")
  return blob
}

export function ImageCropDialog({
  open,
  image,
  defaultAspect = null,
  onCancel,
  onConfirm,
}: {
  open: boolean
  image: string
  defaultAspect?: number | null
  onCancel: () => void
  onConfirm: (blob: Blob) => Promise<void> | void
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [aspect, setAspect] = useState<number | null>(defaultAspect)
  const [busy, setBusy] = useState(false)
  const areaRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null)

  useEffect(() => {
    if (open) {
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setRotation(0)
      setAspect(defaultAspect)
      areaRef.current = null
    }
  }, [open, image, defaultAspect])

  const onCropComplete = useCallback(
    (_: unknown, croppedAreaPixels: { x: number; y: number; width: number; height: number }) => {
      areaRef.current = croppedAreaPixels
    },
    []
  )

  const handleConfirm = async () => {
    if (!areaRef.current || busy) return
    setBusy(true)
    try {
      const blob = await getCroppedBlob(image, areaRef.current, rotation)
      await onConfirm(blob)
    } catch (err) {
      console.error("Crop gagal:", err)
    } finally {
      setBusy(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-line bg-card shadow-2xl">
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

        <div className="relative h-72 w-full bg-black/80">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect ?? undefined}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="space-y-3 px-5 py-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {ASPECT_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setAspect(p.value)}
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
            <button
              type="button"
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-line bg-soft px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <RotateCw className="h-3 w-3" /> Putar
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">Perbesar</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-soft accent-[var(--primary)]"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="ghost" onClick={onCancel} className="flex-1 border border-line" disabled={busy}>
              Batal
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={busy}
              className="gradient-primary flex-1 text-white"
            >
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {busy ? "Memproses..." : "Simpan & Unggah"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
