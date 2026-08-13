"use client"

import { useCallback, useEffect, useRef, useState } from "react"

interface Pos {
  x: number
  y: number
}

export function useDraggableFloat(key: string, width = 48, height = 48) {
  const [pos, setPos] = useState<Pos | null>(null)
  const posRef = useRef<Pos | null>(null)
  const startRef = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null)
  const movedRef = useRef(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`float-pos-${key}`)
      if (raw) {
        const p = JSON.parse(raw) as Pos
        if (typeof p.x === "number" && typeof p.y === "number") {
          setPos(p)
          posRef.current = p
        }
      }
    } catch {
      // abaikan localStorage rusak
    }
  }, [key])

  const savePos = useCallback(
    (p: Pos) => {
      try {
        localStorage.setItem(`float-pos-${key}`, JSON.stringify(p))
      } catch {
        // abaikan
      }
    },
    [key]
  )

  const onMove = useCallback(
    (e: PointerEvent) => {
      const s = startRef.current
      if (!s) return
      const dx = e.clientX - s.px
      const dy = e.clientY - s.py
      if (Math.abs(dx) + Math.abs(dy) > 6) movedRef.current = true
      if (!movedRef.current) return
      const vw = window.innerWidth
      const vh = window.innerHeight
      const next = {
        x: Math.max(4, Math.min(s.ox + dx, vw - width - 4)),
        y: Math.max(4, Math.min(s.oy + dy, vh - height - 4)),
      }
      setPos(next)
      posRef.current = next
    },
    [width, height]
  )

  const onUp = useCallback(() => {
    startRef.current = null
    window.removeEventListener("pointermove", onMove)
    window.removeEventListener("pointerup", onUp)
    if (posRef.current) savePos(posRef.current)
  }, [onMove, savePos])

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (e.button !== 0) return
      const rect = e.currentTarget.getBoundingClientRect()
      startRef.current = { px: e.clientX, py: e.clientY, ox: rect.left, oy: rect.top }
      movedRef.current = false
      window.addEventListener("pointermove", onMove)
      window.addEventListener("pointerup", onUp)
    },
    [onMove, onUp]
  )

  return { pos, onPointerDown, movedRef }
}