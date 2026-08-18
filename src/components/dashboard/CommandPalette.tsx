"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Search, CornerDownLeft, Home, FileText, Image as ImageIcon, Trophy, Users, Package, DollarSign, MessageSquare, UserCog, Settings, LayoutDashboard, CalendarIcon, UserPlus } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAdmin } from "@/contexts/AdminContext"

interface Entry {
  label: string
  href: string
  icon: typeof Home
  roles: string[]
  hint?: string
}

const ENTRIES: Entry[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, roles: ["super_admin", "bendahara", "humas"] },
  { label: "Daftar Anggota", href: "/admin/pengurus", icon: Users, roles: ["super_admin"] },
  { label: "Galeri", href: "/admin/galeri", icon: ImageIcon, roles: ["super_admin", "humas"] },
  { label: "Artikel / Berita", href: "/admin/artikel", icon: FileText, roles: ["super_admin", "humas"] },
  { label: "Peserta LKBB", href: "/admin/lomba", icon: Trophy, roles: ["super_admin", "bendahara", "humas"] },
  { label: "Keuangan", href: "/admin/keuangan", icon: DollarSign, roles: ["super_admin", "bendahara"] },
  { label: "Inventaris", href: "/admin/inventaris", icon: Package, roles: ["super_admin"] },
  { label: "Kotak Saran", href: "/admin/saran", icon: MessageSquare, roles: ["super_admin", "humas"] },
  { label: "Kegiatan", href: "/admin/kegiatan", icon: CalendarIcon, roles: ["super_admin", "humas"] },
  { label: "Rekrutmen Anggota", href: "/admin/rekrutmen", icon: UserPlus, roles: ["super_admin"] },
  { label: "Pengguna", href: "/admin/users", icon: UserCog, roles: ["super_admin"] },
  { label: "Pengaturan", href: "/admin/settings", icon: Settings, roles: ["super_admin", "bendahara", "humas"] },
  { label: "Situs Publik", href: "/", icon: Home, roles: ["super_admin", "bendahara", "humas"], hint: "Buka halaman utama" },
  { label: "Berita Publik", href: "/berita", icon: FileText, roles: ["super_admin", "bendahara", "humas"], hint: "Halaman publik" },
  { label: "Prestasi Publik", href: "/prestasi", icon: Trophy, roles: ["super_admin", "bendahara", "humas"], hint: "Halaman publik" },
]

export function CommandPalette({
  open: controlled,
  onOpenChange,
}: {
  open?: boolean
  onOpenChange?: (o: boolean) => void
} = {}) {
  const router = useRouter()
  const { role } = useAdmin()
  const [internalOpen, setInternalOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const open = controlled ?? internalOpen
  const setOpen = (o: boolean) => {
    if (onOpenChange) onOpenChange(o)
    else setInternalOpen(o)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen(!(controlled ?? internalOpen))
      }
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controlled, internalOpen])

  useEffect(() => {
    if (open) {
      setQuery("")
      setActive(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = ENTRIES.filter((e) => !role || e.roles.includes(role))
    if (!q) return list
    return list.filter((e) => e.label.toLowerCase().includes(q) || e.href.toLowerCase().includes(q))
  }, [query, role])

  const go = (entry: Entry) => {
    setOpen(false)
    router.push(entry.href)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="top-[12%] w-[calc(100%-2rem)] max-w-lg border-line bg-card p-0">
        <DialogTitle className="sr-only">Cari menu admin</DialogTitle>
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActive(0)
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault()
                setActive((a) => Math.min(a + 1, results.length - 1))
              } else if (e.key === "ArrowUp") {
                e.preventDefault()
                setActive((a) => Math.max(a - 1, 0))
              } else if (e.key === "Enter" && results[active]) {
                go(results[active])
              }
            }}
            placeholder="Cari menu atau perintah..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-muted-foreground">
              Tidak ada hasil untuk &quot;{query}&quot;
            </p>
          ) : (
            results.map((entry, i) => (
              <button
                key={entry.href + entry.label}
                onClick={() => go(entry)}
                onMouseEnter={() => setActive(i)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                  i === active ? "bg-soft text-foreground" : "text-muted-foreground"
                )}
              >
                <entry.icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{entry.label}</span>
                {entry.hint && <span className="text-[10px] text-muted-foreground/70">{entry.hint}</span>}
                {i === active && <CornerDownLeft className="h-3.5 w-3.5 text-muted-foreground" />}
              </button>
            ))
          )}
        </div>
        <div className="flex items-center gap-3 border-t border-line px-4 py-2 text-[10px] text-muted-foreground">
          <span className="inline-flex items-center gap-1"><kbd className="rounded border border-line px-1">↑↓</kbd> navigasi</span>
          <span className="inline-flex items-center gap-1"><kbd className="rounded border border-line px-1">Enter</kbd> buka</span>
          <span className="inline-flex items-center gap-1"><kbd className="rounded border border-line px-1">Esc</kbd> tutup</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
