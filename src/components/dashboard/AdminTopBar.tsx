"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, LogOut } from "lucide-react"
import { AdminSidebar } from "./AdminSidebar"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAdmin } from "@/contexts/AdminContext"

export function AdminTopBar() {
  const router = useRouter()
  const { role } = useAdmin()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  return (
    <header className="flex items-center justify-between p-4 border-b border-line bg-card">
      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger
          className="md:hidden"
          render={
            <Button variant="ghost" size="icon">
              <Menu className="w-5 h-5" />
            </Button>
          }
        />
        <SheetContent side="left" className="w-64 p-0">
          <AdminSidebar />
        </SheetContent>
      </Sheet>

      {/* User Profile */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Avatar className="w-8 h-8">
            <AvatarImage src="/logo.png" alt="Admin" />
            <AvatarFallback>SC</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">Admin</p>
            <p className="text-xs text-muted-foreground">Role: {role?.replace('_', ' ')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Keluar">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}