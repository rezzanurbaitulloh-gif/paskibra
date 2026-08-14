"use client"

import { useAdmin } from "@/contexts/AdminContext"
import { ReactNode } from "react"

const allowedRoles: Record<string, string[]> = {
  "/admin/keuangan": ["super_admin", "pembina", "bendahara"],
  "/admin/saran": ["super_admin", "pembina", "humas"],
  "/admin/galeri": ["super_admin", "pembina", "humas"],
  "/admin/artikel": ["super_admin", "pembina", "humas"],
  "/admin/inventaris": ["super_admin", "pembina", "sarpras"],
  "/admin/pengurus": ["super_admin", "pembina"],
  "/admin/settings": ["super_admin", "pembina", "bendahara", "humas", "sarpras"],
  "/admin/dashboard": ["super_admin", "pembina", "bendahara", "humas", "sarpras"],
}

export function RequireRole({ path, children }: { path: string; children: ReactNode }) {
  const { role } = useAdmin()
  if (!role || !(allowedRoles[path] || []).includes(role)) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="rounded-2xl border border-line bg-card p-8 text-center">
          <p className="font-display text-lg font-bold">Akses Ditolak</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Role Anda tidak memiliki izin untuk halaman ini.
          </p>
        </div>
      </div>
    )
  }
  return <>{children}</>
}