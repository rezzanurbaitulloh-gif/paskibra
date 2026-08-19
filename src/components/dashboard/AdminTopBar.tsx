"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, LogOut, Search, Bell, Home } from "lucide-react"
import { AdminSidebar } from "./AdminSidebar"
import { NotificationBell } from "./NotificationBell"
import { CommandPalette } from "./CommandPalette"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAdmin } from "@/contexts/AdminContext"
import { useAuth } from "@/contexts/AuthContext"
import { useState } from "react"

const ROLE_LABEL: Record<string, string> = {
  super_admin: "Admin",
  bendahara: "Bendahara",
  humas: "Humas",
}

export function AdminTopBar() {
  const router = useRouter()
  const { role } = useAdmin()
  const { user } = useAuth()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const displayName = (user?.user_metadata?.name as string) || user?.email || "Admin"
  const initial = (displayName || "U").charAt(0).toUpperCase()
  const roleLabel = role ? (ROLE_LABEL[role] || role.replace('_', ' ')) : "—"

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-line bg-card/80 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg border border-line px-2.5 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:border-accent/50 hover:text-foreground"
          title="Kembali ke halaman utama"
        >
          <Home className="h-4 w-4" /> <span className="hidden lg:inline">Halaman Utama</span>
        </Link>

        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetTrigger
            className="md:hidden"
            render={
              <Button variant="ghost" size="icon" aria-label="Buka menu" className="h-10 w-10">
                <Menu className="h-5 w-5" />
              </Button>
            }
          />
          <SheetContent side="left" className="w-64 p-0" showCloseButton={false}>
            <AdminSidebar drawer onNavigate={() => setDrawerOpen(false)} />
          </SheetContent>
        </Sheet>

        <div className="relative hidden lg:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <button
            onClick={() => setPaletteOpen(true)}
            className="h-9 w-56 cursor-text rounded-lg border border-line bg-soft pl-9 pr-3 text-left text-xs text-muted-foreground outline-none transition-all hover:border-ring/50 focus:w-64 focus:border-ring focus:ring-2 focus:ring-ring/20 lg:w-64"
          >
            Cari menu atau perintah...
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-line bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              Ctrl K
            </span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
        <button
          onClick={() => setPaletteOpen(true)}
          className="hidden h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-soft hover:text-foreground sm:inline-flex lg:hidden"
          aria-label="Cari menu atau perintah"
        >
          <Search className="h-4 w-4" />
        </button>
        <NotificationBell />
        <ThemeToggle />
        <div className="mx-1 h-6 w-px bg-line" />
        <div className="flex items-center gap-2.5">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/logo.png" alt="Admin" />
            <AvatarFallback>{initial}</AvatarFallback>
          </Avatar>
          <div className="hidden leading-tight md:block">
            <p className="max-w-[160px] truncate text-xs font-semibold">{displayName}</p>
            <p className="text-[10px] text-muted-foreground capitalize">{roleLabel}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Keluar" className="h-10 w-10">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}