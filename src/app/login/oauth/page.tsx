"use client"

import { Suspense } from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { BackHomeButton } from "@/components/back-home-button"
import { Loader2 } from "lucide-react"
import { getSessionWithRole } from "@/lib/auth"

function OAuthCallbackInner() {
  const router = useRouter()
  const [status, setStatus] = useState("Memproses login...")

  useEffect(() => {
    const handle = async () => {
      const { user, role } = await getSessionWithRole()

      if (!user) {
        setStatus("Login gagal. Silakan coba lagi.")
        setTimeout(() => router.push("/login?error=login_failed"), 1500)
        return
      }

      if (role) {
        router.push("/admin/dashboard")
      } else {
        router.push("/")
      }
    }
    handle()
  }, [router])

  return (
    <div className="relative min-h-screen">
      <BackHomeButton />
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4">
      <Loader2 className="h-8 w-8 animate-spin text-accent" />
      <p className="text-sm text-muted-foreground">{status}</p>
    </div>
    </div>
  )
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Memproses login...</div>}>
      <OAuthCallbackInner />
    </Suspense>
  )
}
