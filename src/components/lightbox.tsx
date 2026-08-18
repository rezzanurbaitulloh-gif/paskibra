"use client"

import { useCallback, useEffect } from "react"
import Image from "next/image"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { ChevronLeft, ChevronRight, X } from "lucide-react"

export interface LightboxImage {
  src: string
  alt: string
}

export function Lightbox({
  open,
  onClose,
  items,
  index,
  onIndexChange,
}: {
  open: boolean
  onClose: () => void
  items: LightboxImage[]
  index: number
  onIndexChange: (i: number) => void
}) {
  const prev = useCallback(
    () => onIndexChange((index - 1 + items.length) % items.length),
    [index, items.length, onIndexChange]
  )
  const next = useCallback(
    () => onIndexChange((index + 1) % items.length),
    [index, items.length, onIndexChange]
  )

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev()
      if (e.key === "ArrowRight") next()
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, prev, next, onClose])

  const item = items[index]

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/90" />
        <DialogPrimitive.Popup className="fixed inset-0 z-50 flex items-center justify-center p-4 outline-none">
          <DialogPrimitive.Title className="sr-only">{item?.alt || "Pratinjau galeri"}</DialogPrimitive.Title>

          <button
            onClick={onClose}
            aria-label="Tutup pratinjau"
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>

          {items.length > 1 && (
            <>
              <button
                onClick={prev}
                aria-label="Sebelumnya"
                className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={next}
                aria-label="Berikutnya"
                className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          {item && (
            <figure className="flex max-h-full flex-col items-center">
              <div className="max-h-[82vh] w-auto overflow-hidden">
                <Image
                  src={item.src}
                  alt={item.alt}
                  width={1600}
                  height={1200}
                  sizes="100vw"
                  className="h-auto max-h-[82vh] w-auto max-w-full rounded-xl object-contain"
                />
              </div>
              <figcaption className="mt-4 max-w-xl text-center text-sm text-white/90">
                {item.alt}
                {items.length > 1 && (
                  <span className="ml-2 text-xs text-white/50">
                    {index + 1} / {items.length}
                  </span>
                )}
              </figcaption>
            </figure>
          )}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
