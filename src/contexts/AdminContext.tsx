"use client"

import { createContext, useContext, ReactNode, useState, useEffect } from "react"

interface AdminContextType {
  role: string | null
  setRole: (role: string) => void
}

const AdminContext = createContext<AdminContextType>({ role: null, setRole: () => {} })

export function AdminProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<string | null>(null)

  return (
    <AdminContext.Provider value={{ role, setRole }}>
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  return useContext(AdminContext)
}