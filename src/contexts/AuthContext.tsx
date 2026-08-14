"use client"

import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase/client"
import { getStaffRole, type UserRole } from "@/lib/auth"

interface AuthState {
  user: { id: string; email: string | null } | null
  role: UserRole | null
  isStaff: boolean
  loading: boolean
  refresh: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState>({
  user: null,
  role: null,
  isStaff: false,
  loading: true,
  refresh: async () => {},
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthState["user"]>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session?.user) {
      setUser(null)
      setRole(null)
      setLoading(false)
      return
    }
    const staffRole = await getStaffRole(session.user.email)
    setUser({ id: session.user.id, email: session.user.email || null })
    setRole(staffRole)
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      refresh()
    })
    return () => sub.subscription.unsubscribe()
  }, [refresh])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    setRole(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isStaff: Boolean(role),
        loading,
        refresh,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}