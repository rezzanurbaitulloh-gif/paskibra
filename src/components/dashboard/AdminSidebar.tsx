"use client"

import { Home, Users, Image as ImageIcon, Package, FileText, Settings, DollarSign, MessageSquare, UserCog, ChevronRight } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAdmin } from "@/contexts/AdminContext"
import { useSiteSettings } from "@/contexts/SiteSettingsContext"
import { useAuth } from "@/contexts/AuthContext"
import { cn } from "@/lib/utils"

const navGroups: { label: string; items: { name: string; icon: typeof Home; href: string; roles: string[] }[] }[] = [
  {
    label: "Utama",
    items: [{ name: "Dashboard", icon: Home, href: "/admin/dashboard", roles: ["super_admin", "bendahara", "humas"] }],
  },
  {
    label: "Konten",
    items: [
      { name: "Pengurus", icon: Users, href: "/admin/pengurus", roles: ["super_admin"] },
      { name: "Galeri", icon: ImageIcon, href: "/admin/galeri", roles: ["super_admin", "humas"] },
      { name: "Artikel", icon: FileText, href: "/admin/artikel", roles: ["super_admin", "humas"] },
    ],
  },
  {
    label: "Operasional",
    items: [
      { name: "Keuangan", icon: DollarSign, href: "/admin/keuangan", roles: ["super_admin", "bendahara"] },
      { name: "Inventaris", icon: Package, href: "/admin/inventaris", roles: ["super_admin"] },
      { name: "Saran", icon: MessageSquare, href: "/admin/saran", roles: ["super_admin", "humas"] },
    ],
  },
  {
    label: "Sistem",
    items: [
      { name: "Pengguna", icon: UserCog, href: "/admin/users", roles: ["super_admin"] },
      { name: "Pengaturan", icon: Settings, href: "/admin/settings", roles: ["super_admin", "bendahara", "humas"] },
    ],
  },
]

const ROLE_LABEL: Record<string, string> = {
  super_admin: "Admin",
  bendahara: "Bendahara",
  humas: "Humas",
}

export function AdminSidebar() {
  const pathname = usePathname()
  const { role } = useAdmin()
  const { settings } = useSiteSettings()
  const { user } = useAuth()
  const orgName = settings.branding.orgName || "SATRIA CENGKARA"
  const displayName = (user?.user_metadata?.name as string) || user?.email || "Pengguna"
  const initial = (displayName || "U").charAt(0).toUpperCase()
  const roleLabel = role ? ROLE_LABEL[role] || role : "Pengguna"

  const groups = navGroups
    .map((g) => ({ ...g, items: g.items.filter((i) => role && i.roles.includes(role)) }))
    .filter((g) => g.items.length > 0)

  return (
    <div className="hidden md:flex flex-col w-64 bg-card border-r border-line h-full md:h-screen md:fixed md:left-0 md:top-0">
      <div className="flex items-center gap-3 border-b border-line px-4 py-4">
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg ring-1 ring-white/15">
          <Image
            src={settings.branding.logoUrl || "/logo.png"}
            alt={orgName}
            fill
            sizes="2.5rem"
            className="object-cover"
          />
        </div>
        <div className="leading-tight">
          <p className="font-display font-bold text-sm">{orgName}</p>
          <p className="text-[10px] text-muted-foreground">Admin Dashboard</p>
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const active = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-foreground text-background shadow-sm"
                        : "text-muted-foreground hover:bg-soft hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1">{item.name}</span>
                    <ChevronRight className={cn("h-3.5 w-3.5 opacity-0 transition-opacity", active && "opacity-60")} />
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-line p-3">
        <div className="flex items-center gap-3 rounded-xl bg-soft px-3 py-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-[12px] font-bold text-background">
            {initial}
          </span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-xs font-semibold">{displayName}</p>
            <p className="text-[10px] text-muted-foreground">{roleLabel}</p>
          </div>
        </div>
      </div>
    </div>
  )
}