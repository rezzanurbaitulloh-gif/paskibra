"use client"

import { ReactNode, useEffect, useState } from "react"
import { motion } from "framer-motion"
import { AdminSidebar } from "@/components/dashboard/AdminSidebar"
import { AdminTopBar } from "@/components/dashboard/AdminTopBar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { AdminProvider } from "@/contexts/AdminContext"

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [role, setRole] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      const { data: adminCheck } = await supabase
        .from("admin_users")
        .select("role")
        .eq("user_id", session.user.id)
        .maybeSingle()

      if (adminCheck) {
        setIsAuthenticated(true)
        setRole(adminCheck.role)
      } else {
        router.push('/login')
      }
      setIsLoading(false)
    }
    checkAuth()
  }, [])

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <AdminProvider>
      <TooltipProvider>
        <div className="flex min-h-screen">
          <AdminSidebar />
          <div className="flex-1 flex flex-col">
            <AdminTopBar />
            <motion.main
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex-1 p-6 overflow-auto"
            >
              {children}
            </motion.main>
          </div>
        </div>
      </TooltipProvider>
    </AdminProvider>
  )
}