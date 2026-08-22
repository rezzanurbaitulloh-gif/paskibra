"use client"

import { useEffect, useRef, useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Pipette } from "lucide-react"

interface Hsva {
  h: number
  s: number
  v: number
  a: number
}

function clamp(n: number, min = 0, max = 255) {
  return Math.min(max, Math.max(min, n))
}

export function parseColor(input: string): { r: number; g: number; b: number; a: number } | null {
  const s = input.trim().toLowerCase()
  let m = s.match(/^#([0-9a-f]{3})$/)
  if (m)
    return {
      r: parseInt(m[1][0] + m[1][0], 16),
      g: parseInt(m[1][1] + m[1][1], 16),
      b: parseInt(m[1][2] + m[1][2], 16),
      a: 100,
    }
  m = s.match(/^#([0-9a-f]{6})([0-9a-f]{2})?$/)
  if (m) {
    const r = parseInt(m[1].slice(0, 2), 16)
    const g = parseInt(m[1].slice(2, 4), 16)
    const b = parseInt(m[1].slice(4, 6), 16)
    const a = m[2] ? Math.round((parseInt(m[2], 16) / 255) * 100) : 100
    if ([r, g, b].some(Number.isNaN)) return null
    return { r, g, b, a }
  }
  m = s.match(/^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[/,\s]+([\d.]+%?))?\s*\)$/)
  if (m) {
    let a = 100
    if (m[4]) a = m[4].endsWith("%") ? clamp(parseFloat(m[4]), 0, 100) : clamp(parseFloat(m[4]) * 100, 0, 100)
    return { r: clamp(+m[1]), g: clamp(+m[2]), b: clamp(+m[3]), a }
  }
  return null
}

function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  const rr = r / 255
  const gg = g / 255
  const bb = b / 255
  const max = Math.max(rr, gg, bb)
  const min = Math.min(rr, gg, bb)
  const d = max - min
  let h = 0
  if (d !== 0) {
    if (max === rr) h = ((gg - bb) / d + (gg < bb ? 6 : 0)) * 60
    else if (max === gg) h = ((bb - rr) / d + 2) * 60
    else h = ((rr - gg) / d + 4) * 60
  }
  return { h: Math.round(h), s: max === 0 ? 0 : Math.round((d / max) * 100), v: Math.round(max * 100) }
}

function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  const sv = s / 100
  const vv = v / 100
  const c = vv * sv
  const hh = (h % 360) / 60
  const x = c * (1 - Math.abs((hh % 2) - 1))
  let rgb: [number, number, number] = [0, 0, 0]
  if (hh >= 0 && hh < 1) rgb = [c, x, 0]
  else if (hh < 2) rgb = [x, c, 0]
  else if (hh < 3) rgb = [0, c, x]
  else if (hh < 4) rgb = [0, x, c]
  else if (hh < 5) rgb = [x, 0, c]
  else rgb = [c, 0, x]
  const mm = vv - c
  return {
    r: Math.round((rgb[0] + mm) * 255),
    g: Math.round((rgb[1] + mm) * 255),
    b: Math.round((rgb[2] + mm) * 255),
  }
}

const CHECKER =
  "repeating-conic-gradient(#80808080 0% 25%, #ffffff00 0% 50%) 50% / 10px 10px"

export function ColorPicker({
  value,
  onChange,
  presets = [],
}: {
  value: string
  onChange: (v: string) => void
  presets?: string[]
}) {
  const parsed = parseColor(value)
  const initial = useRef(
    parsed ? { ...rgbToHsv(parsed.r, parsed.g, parsed.b), a: parsed.a } : { h: 220, s: 80, v: 60, a: 100 }
  )
  const [hsva, setHsva] = useState<Hsva>(initial.current)
  const [hexText, setHexText] = useState(value)
  const areaRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  // Sinkron saat nilai diubah dari luar (mis. undo/reset)
  useEffect(() => {
    const p = parseColor(value)
    if (!p) return
    const next = { ...rgbToHsv(p.r, p.g, p.b), a: p.a }
    setHsva((prev) =>
      prev.h === next.h && prev.s === next.s && prev.v === next.v && prev.a === next.a ? prev : next
    )
    setHexText(value)
  }, [value])

  const emit = (next: Hsva) => {
    const { r, g, b } = hsvToRgb(next.h, next.s, next.v)
    onChange(next.a >= 100 ? "#" + [r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("") : `rgba(${r}, ${g}, ${b}, ${Math.round(next.a) / 100})`)
  }

  const update = (patch: Partial<Hsva>) => {
    setHsva((prev) => {
      const next = { ...prev, ...patch }
      emit(next)
      return next
    })
  }

  const rgb = hsvToRgb(hsva.h, hsva.s, hsva.v)
  const hueRgb = hsvToRgb(hsva.h, 100, 100)

  const handleArea = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = areaRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const s = clamp(Math.round(((e.clientX - rect.left) / rect.width) * 100), 0, 100)
    const v = clamp(Math.round(((e.clientY - rect.top) / rect.height) * 100), 0, 100)
    update({ s, v: 100 - v })
  }

  const applyHexText = () => {
    const p = parseColor(hexText)
    if (p) {
      update({ ...rgbToHsv(p.r, p.g, p.b), a: p.a })
    } else {
      setHexText(value)
    }
  }

  const pickEyedropper = async () => {
    if (!("EyeDropper" in window)) return
    try {
      const EyeDropperCtor = (window as unknown as { EyeDropper: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper
      const res = await new EyeDropperCtor().open()
      const p = parseColor(res.sRGBHex)
      if (p) update({ ...rgbToHsv(p.r, p.g, p.b), a: 100 })
    } catch {
      /* dibatalkan pengguna */
    }
  }

  return (
    <Popover>
      <PopoverTrigger
        aria-label="Buka pemilih warna"
        className="flex h-9 w-full items-center gap-2 rounded-lg border border-line bg-card px-2 transition-colors hover:border-accent/50"
      >
        <span
          className="h-6 w-6 shrink-0 rounded-md border border-line"
          style={{ backgroundColor: value, ...(!parsed || parsed.a < 100 ? { backgroundImage: CHECKER } : {}) }}
        />
        <span className="truncate font-mono text-xs text-muted-foreground">{value}</span>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={6} className="w-64 space-y-3 border-line bg-card">
        {/* Area geser Saturasi × Kecerahan */}
        <div
          ref={areaRef}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId)
            dragging.current = true
            handleArea(e)
          }}
          onPointerMove={(e) => dragging.current && handleArea(e)}
          onPointerUp={(e) => {
            e.currentTarget.releasePointerCapture(e.pointerId)
            dragging.current = false
          }}
          className="relative h-32 w-full cursor-crosshair touch-none overflow-hidden rounded-lg border border-line"
          style={{
            backgroundColor: `hsl(${hsva.h} 100% 50%)`,
            backgroundImage:
              "linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent)",
          }}
        >
          <span
            className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,.5)]"
            style={{ left: `${hsva.s}%`, top: `${100 - hsva.v}%`, backgroundColor: `rgb(${rgb.r},${rgb.g},${rgb.b})` }}
          />
        </div>

        {/* Slider Hue */}
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={360}
            value={hsva.h}
            onChange={(e) => update({ h: +e.target.value })}
            aria-label="Hue"
            className="h-3 w-full cursor-pointer appearance-none rounded-full [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-transparent [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-transparent"
            style={{
              background:
                "linear-gradient(90deg,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)",
            }}
          />
        </div>

        {/* Slider Opacity */}
        <div className="flex items-center gap-2">
          <div
            className="relative h-3 flex-1 overflow-hidden rounded-full border border-line"
            style={{ backgroundImage: CHECKER }}
          >
            <input
              type="range"
              min={0}
              max={100}
              value={hsva.a}
              onChange={(e) => update({ a: +e.target.value })}
              aria-label="Opacity"
              className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-[0_0_0_1px_rgba(0,0,0,.5)] [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white"
              style={{
                background: `linear-gradient(90deg, rgba(${hueRgb.r},${hueRgb.g},${hueRgb.b},0), rgba(${hueRgb.r},${hueRgb.g},${hueRgb.b},1))`,
              }}
            />
          </div>
          <span className="w-10 shrink-0 text-right font-mono text-xs text-muted-foreground">{hsva.a}%</span>
        </div>

        {/* Input RGB */}
        <div className="grid grid-cols-3 gap-2">
          {(["r", "g", "b"] as const).map((ch) => (
            <div key={ch} className="space-y-1">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {ch.toUpperCase()}
              </label>
              <Input
                type="number"
                min={0}
                max={255}
                value={rgb[ch]}
                onChange={(e) => {
                  const n = clamp(+e.target.value || 0)
                  const cur = hsvToRgb(hsva.h, hsva.s, hsva.v)
                  const nextRgb = { ...cur, [ch]: n }
                  update({ ...rgbToHsv(nextRgb.r, nextRgb.g, nextRgb.b) })
                }}
                className="h-8 border-line bg-soft px-2 text-xs"
              />
            </div>
          ))}
        </div>

        {/* Hex + Eyedropper */}
        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-1">
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Hex</label>
            <Input
              value={hexText}
              onChange={(e) => setHexText(e.target.value)}
              onBlur={applyHexText}
              onKeyDown={(e) => e.key === "Enter" && applyHexText()}
              placeholder="#RRGGBB atau rgba()"
              className="h-8 border-line bg-soft font-mono text-xs"
            />
          </div>
          {"EyeDropper" in window && (
            <button
              type="button"
              onClick={pickEyedropper}
              aria-label="Ambil warna dari layar"
              title="Ambil warna dari layar"
              className="inline-flex h-8 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-soft text-muted-foreground transition-colors hover:text-foreground"
            >
              <Pipette className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Preset dari palet saat ini */}
        {presets.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {presets.map((p, i) => (
              <button
                key={`${p}-${i}`}
                type="button"
                aria-label={`Gunakan ${p}`}
                onClick={() => {
                  const pc = parseColor(p)
                  if (!pc) return
                  update({ ...rgbToHsv(pc.r, pc.g, pc.b), a: pc.a })
                }}
                className="h-6 w-6 rounded-md border border-line transition-transform hover:scale-110"
                style={{ backgroundColor: p }}
              />
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
