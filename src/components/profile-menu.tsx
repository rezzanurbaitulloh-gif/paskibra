"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { LayoutDashboard, UserCircle2, LogOut, LogIn, ChevronDown } from "lucide-react"

const ROLE_LABEL: Record<string, string> = {
  super_admin: "Admin",
  bendahara: "Bendahara",
  humas: "Humas",
}

export function ProfileMenu({ className = "" }: { className?: string }) {
  const { user, role, isStaff, loading, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  const handleLogout = async () => {
    await signOut()
    router.push("/")
    router.refresh()
  }

  if (loading) {
    return <div className={`h-8 w-24 rounded-lg bg-soft animate-pulse ${className}`} />
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className={`inline-flex items-center gap-1.5 rounded-lg gradient-primary px-3 py-1.5 text-xs font-medium text-white ${className}`}
      >
        <LogIn className="h-3.5 w-3.5" /> Masuk
      </Link>
    )
  }

  const displayName = (user.user_metadata?.name as string) || user.email || ""
  const initial = (displayName || "U").charAt(0).toUpperCase()
  const label = isStaff ? (ROLE_LABEL[role!] || "Pengurus") : "Pengguna"

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full border border-line bg-card py-1 pl-1 pr-2.5 transition-colors hover:border-accent/50"
        aria-label="Menu akun"
      >
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold text-white ${
            isStaff ? "gradient-primary" : "bg-muted-foreground/40"
          }`}
        >
          {initial}
        </span>
        <span className="hidden max-w-[110px] truncate text-xs font-medium sm:block">{label}</span>
        <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-line bg-card shadow-xl shadow-black/20">
          <div className="border-b border-line px-4 py-3">
            <p className="truncate text-xs font-semibold">{displayName}</p>
            <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{label} • {user.email}</p>
          </div>
          <div className="p-1.5">
            {isStaff && (
              <Link
                href="/admin/dashboard"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-soft"
              >
                <LayoutDashboard className="h-4 w-4 text-accent" /> Dashboard
              </Link>
            )}
            <Link
              href="/akun"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-soft"
            >
              <UserCircle2 className="h-4 w-4 text-accent" /> Pengaturan Akun
            </Link>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10"
            >
              <LogOut className="h-4 w-4" /> Keluar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}