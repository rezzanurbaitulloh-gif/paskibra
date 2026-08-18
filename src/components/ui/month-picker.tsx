"use client"

import * as React from "react"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

const DAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"]
const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
]

interface MonthPickerProps {
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  presets?: { value: string; label: string }[]
}

export function MonthPicker({ value, onChange, placeholder = "Pilih Bulan", className, presets }: MonthPickerProps) {
  const [open, setOpen] = React.useState(false)
  const [view, setView] = React.useState(() => {
    const n = new Date()
    return { y: n.getFullYear(), m: n.getMonth() }
  })

  const valueMonth = value && /^\d{4}-\d{2}$/.test(value) ? Number(value.slice(5, 7)) : null
  const activePreset = presets?.find((p) => p.value === value)
  const [prevOpen, setPrevOpen] = React.useState(open)

  if (prevOpen !== open) {
    setPrevOpen(open)
    if (open && valueMonth && value) {
      setView({ y: Number(value.slice(0, 4)), m: valueMonth - 1 })
    }
  }

  const firstDay = new Date(view.y, view.m, 1)
  const offset = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate()
  const today = new Date()
  const todayKey = `${today.getFullYear()}-${today.getMonth()}`

  const nav = (dir: number) => {
    const m = view.m + dir
    setView({ y: view.y + Math.floor(m / 12), m: ((m % 12) + 12) % 12 })
  }

  const pick = (day: number) => {
    const y = view.y
    const m = view.m
    const mKey = `${y}-${String(m + 1).padStart(2, "0")}`
    if (mKey === value) {
      onChange("")
    } else {
      onChange(mKey)
    }
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          "inline-flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-line bg-card px-3 text-xs text-foreground transition-colors hover:bg-soft sm:w-44",
          className
        )}
      >
        <span className="flex items-center gap-2">
          <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
          {activePreset ? activePreset.label : valueMonth && value ? `${MONTHS[valueMonth - 1]} ${value.slice(0, 4)}` : placeholder}
        </span>
        {value && !activePreset && (
          <span
            role="button"
            aria-label="Reset bulan"
            onClick={(e) => {
              e.stopPropagation()
              onChange("")
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3" />
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64">
        <div className="flex items-center justify-between">
          <button
            onClick={() => nav(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-soft hover:text-foreground"
            aria-label="Bulan sebelumnya"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="font-display text-xs font-bold">
            {MONTHS[view.m]} {view.y}
          </span>
          <button
            onClick={() => nav(1)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-soft hover:text-foreground"
            aria-label="Bulan berikutnya"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {DAYS.map((d) => (
            <span key={d} className="py-1 text-[10px] font-semibold text-muted-foreground">
              {d}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {Array.from({ length: offset }).map((_, i) => (
            <span key={`e-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
            const mKey = `${view.y}-${String(view.m + 1).padStart(2, "0")}`
            const isSelected = mKey === value
            const isToday = mKey === todayKey && day === today.getDate()
            return (
              <button
                key={day}
                onClick={() => pick(day)}
                className={cn(
                  "flex h-7 items-center justify-center rounded-md text-xs transition-colors hover:bg-soft hover:text-foreground",
                  isSelected && "bg-foreground font-bold text-background hover:bg-foreground hover:text-background",
                  isToday && !isSelected && "ring-1 ring-primary"
                )}
              >
                {day}
              </button>
            )
          })}
        </div>
        <p className="border-t border-line pt-2 text-center text-[10px] text-muted-foreground">
          Pilih hari untuk memfilter bulan tersebut
        </p>
        {presets && (
          <div className="flex flex-wrap gap-1 border-t border-line pt-2">
            {presets.map((p) => (
              <button
                key={p.value}
                onClick={() => {
                  onChange(p.value)
                  setOpen(false)
                }}
                className={cn(
                  "rounded-md px-2 py-1 text-[10px] font-medium transition-colors",
                  value === p.value
                    ? "bg-foreground text-background"
                    : "bg-soft text-muted-foreground hover:text-foreground"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
