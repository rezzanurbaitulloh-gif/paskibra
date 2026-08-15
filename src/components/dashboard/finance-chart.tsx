"use client"

import * as React from "react"
import { fmtIDR } from "@/lib/fmt"

const ID_MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]

export interface ChartBar {
  key: string
  label: string
  full: string
  inc: number
  exp: number
}

function niceMax(v: number) {
  if (v <= 0) return 100000
  const exp = Math.pow(10, Math.floor(Math.log10(v)))
  const f = v / exp
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10
  return nice * exp
}

function fmtShort(v: number) {
  if (v === 0) return "0"
  if (v < 1000) return String(v)
  if (v < 1_000_000) return `${(v / 1000).toFixed(0)}rb`
  const jt = v / 1_000_000
  const s = jt >= 100 ? jt.toFixed(0) : jt.toFixed(1).replace(/\.0$/, "")
  return `${s.replace(".", ",")}jt`
}

function RoundedTopPath(x: number, y: number, w: number, h: number, r: number) {
  if (h <= 0) return ""
  const rr = Math.min(r, w / 2, h)
  return `M${x},${y + h} L${x},${y + rr} Q${x},${y} ${x + rr},${y} L${x + w - rr},${y} Q${x + w},${y} ${x + w},${y + rr} L${x + w},${y + h} Z`
}

export function FinanceChart({ bars }: { bars: ChartBar[] }) {
  const wrapRef = React.useRef<HTMLDivElement>(null)
  const [width, setWidth] = React.useState(0)
  const [hover, setHover] = React.useState<number | null>(null)

  React.useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setWidth(e.contentRect.width)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const Y_W = 48
  const X_H = 26
  const PAD_T = 18
  const H = 250
  const cw = Math.max(0, width - Y_W - 10)
  const ch = H - X_H - PAD_T

  const maxVal = niceMax(Math.max(0.01, ...bars.map((b) => Math.max(b.inc, b.exp))))
  const ticks = [0, 1, 2, 3, 4].map((i) => (maxVal * i) / 4)

  const n = Math.max(1, bars.length)
  const slot = cw / n
  const barW = Math.max(8, Math.min(20, slot * 0.3))
  const gap = 3

  const xTickEvery = n > 31 ? 1 : Math.ceil(n / 7)
  const xTicks = bars.filter((b, i) => i % xTickEvery === 0 || i === n - 1)

  const active = hover !== null ? bars[hover] : null
  const hasData = bars.some((b) => b.inc > 0 || b.exp > 0)

  const barY = (v: number) => PAD_T + ch - (v / maxVal) * ch
  const slotX = (i: number) => i * slot

  return (
    <div ref={wrapRef} className="relative mt-4 select-none" role="img" aria-label="Grafik batang pemasukan dan pengeluaran">
      <svg width="100%" height={H} className="block">
        {ticks.map((t) => {
          const y = barY(t)
          return (
            <g key={t}>
              <line x1={Y_W} x2={width} y1={y} y2={y} className="stroke-[#f1f5f9] dark:stroke-slate-800" strokeWidth={1} />
              <text x={Y_W - 6} y={y + 3} textAnchor="end" className="fill-muted-foreground text-[10px]">
                {fmtShort(t)}
              </text>
            </g>
          )
        })}

        {bars.map((b, i) => {
          const has = b.inc > 0 || b.exp > 0
          const dim = hover !== null && hover !== i
          const series = [b.inc > 0, b.exp > 0].filter(Boolean).length
          const two = series === 2
          const x0 = slotX(i) + slot / 2 - (two ? barW + gap / 2 : barW / 2)
          return (
            <g key={b.key}>
              {has && (
                <>
                  {b.inc > 0 && (
                    <path
                      d={RoundedTopPath(x0, barY(b.inc), barW, PAD_T + ch - barY(b.inc), 4)}
                      fill="#22c55e"
                      opacity={dim ? 0.45 : 1}
                      className="transition-opacity"
                    />
                  )}
                  {b.exp > 0 && (
                    <path
                      d={RoundedTopPath(x0 + (b.inc > 0 ? barW + gap : 0), barY(b.exp), barW, PAD_T + ch - barY(b.exp), 4)}
                      fill="#ef4444"
                      opacity={dim ? 0.45 : 1}
                      className="transition-opacity"
                    />
                  )}
                </>
              )}
              <rect
                x={slotX(i)}
                y={PAD_T}
                width={slot}
                height={ch}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onClick={() => setHover(hover === i ? null : i)}
              />
              {has && hover === i && (
                <rect x={slotX(i) + 1} y={PAD_T} width={slot - 2} height={ch} fill="#0f172a" opacity={0.05} pointerEvents="none" />
              )}
            </g>
          )
        })}

        {xTicks.map((b, ti) => {
          const i = bars.findIndex((x) => x.key === b.key)
          const x = slotX(i) + slot / 2
          return (
            <text key={b.key + ti} x={x} y={H - 7} textAnchor="middle" className="fill-muted-foreground text-[10px]">
              {b.label}
            </text>
          )
        })}
      </svg>

      {active && (active.inc > 0 || active.exp > 0) && (
        <div
          className="pointer-events-none absolute top-0 z-10 w-44 rounded-lg border border-line bg-background/95 px-3 py-2 text-xs shadow-lg backdrop-blur-sm"
          style={{
            left: Math.min(Math.max(8, slotX(hover!) + slot / 2 - 88), Math.max(8, width - 184)),
          }}
        >
          <p className="font-display font-bold">{active.full}</p>
          {active.inc > 0 && (
            <p className="mt-1 flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="h-2 w-2 rounded-sm bg-[#22c55e]" /> Pemasukan
              </span>
              <span className="font-semibold">{fmtIDR(active.inc)}</span>
            </p>
          )}
          {active.exp > 0 && (
            <p className="mt-1 flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="h-2 w-2 rounded-sm bg-[#ef4444]" /> Pengeluaran
              </span>
              <span className="font-semibold">{fmtIDR(active.exp)}</span>
            </p>
          )}
        </div>
      )}

      {!hasData && (
        <p className="absolute inset-x-0 top-0 pt-24 text-center text-xs text-muted-foreground">Belum ada data keuangan.</p>
      )}
    </div>
  )
}
