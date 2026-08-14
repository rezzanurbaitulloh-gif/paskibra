"use client"

import { Home, Users, Image, Package, FileText, Settings, DollarSign, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAdmin } from "@/contexts/AdminContext"

const allNavItems = [
  { name: "Dashboard", icon: Home, href: "/admin/dashboard", roles: ["super_admin", "pembina", "bendahara", "humas", "sarpras"] },
  { name: "Pengurus", icon: Users, href: "/admin/pengurus", roles: ["super_admin", "pembina"] },
  { name: "Galeri", icon: Image, href: "/admin/galeri", roles: ["super_admin", "pembina", "humas"] },
  { name: "Keuangan", icon: DollarSign, href: "/admin/keuangan", roles: ["super_admin", "pembina", "bendahara"] },
  { name: "Inventaris", icon: Package, href: "/admin/inventaris", roles: ["super_admin", "pembina", "sarpras"] },
  { name: "Artikel", icon: FileText, href: "/admin/artikel", roles: ["super_admin", "pembina", "humas"] },
  { name: "Saran", icon: MessageSquare, href: "/admin/saran", roles: ["super_admin", "pembina", "humas"] },
  { name: "Pengaturan", icon: Settings, href: "/admin/settings", roles: ["super_admin", "pembina", "bendahara", "humas", "sarpras"] },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { role } = useAdmin()
  const navItems = allNavItems.filter(item => role && item.roles.includes(role))

  return (
    <div className="hidden md:flex flex-col w-64 bg-card border-r border-line h-screen fixed">
      <div className="p-4 border-b border-line">
        <h1 className="font-display font-bold text-xl">SATRIA CENGKARA</h1>
        <p className="text-xs text-muted-foreground">Admin Dashboard</p>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <Tooltip key={item.href}>
            <TooltipTrigger
              render={
                <Button
                  variant={pathname === item.href ? "secondary" : "ghost"}
                  className="w-full justify-start gap-3"
                  render={<Link href={item.href} />}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Button>
              }
            />
            <TooltipContent side="right">
              <p>{item.name}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </nav>
    </div>
  )
}