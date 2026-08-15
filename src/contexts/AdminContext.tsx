"use client"

import { createContext, useContext, ReactNode, useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"

interface AdminContextType {
  role: string | null
  setRole: (role: string) => void
}

const AdminContext = createContext<AdminContextType>({ role: null, setRole: () => {} })

export function AdminProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session?.user || cancelled) return
      const { data } = await supabase
        .from("admin_users")
        .select("role")
        .eq("user_id", session.user.id)
        .maybeSingle()
      if (!cancelled && data?.role) setRole(data.role)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <AdminContext.Provider value={{ role, setRole }}>
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  return useContext(AdminContext)
}