"use client"

import { Home, Users, Image, ShoppingBag, FileText, Settings, DollarSign, MessageSquare, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import Link from "next/link"
import { usePathname } from "next/navigation"

const navItems = [
  { name: "Dashboard", icon: Home, href: "/admin" },
  { name: "Pengurus", icon: Users, href: "/admin/structure" },
  { name: "Galeri", icon: Image, href: "/admin/gallery" },
  { name: "Penyewaan", icon: ShoppingBag, href: "/admin/rentals" },
  { name: "Keuangan", icon: DollarSign, href: "/admin/financial" },
  { name: "Inventaris", icon: Package, href: "/admin/inventory" },
  { name: "Artikel", icon: FileText, href: "/admin/articles" },
  { name: "Saran", icon: MessageSquare, href: "/admin/feedbacks" },
  { name: "Pengaturan", icon: Settings, href: "/admin/settings" },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <div className="hidden md:flex flex-col w-64 bg-card border-r border-border/20 h-screen fixed">
      <div className="p-4 border-b border-border/20">
        <h1 className="font-display font-bold text-xl">SATRIA CENGKARA</h1>
        <p className="text-xs text-muted-foreground">Admin Dashboard</p>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <Tooltip key={item.href}>
            <TooltipTrigger asChild>
              <Button
                variant={pathname === item.href ? "secondary" : "ghost"}
                className="w-full justify-start gap-3"
                asChild
              >
                <Link href={item.href}>
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{item.name}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </nav>
    </div>
  )
}