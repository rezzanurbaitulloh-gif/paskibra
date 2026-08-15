"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Home } from "lucide-react"

export function BackHomeButton() {
  const router = useRouter()
  const [canGoBack, setCanGoBack] = useState(false)

  useEffect(() => {
    setCanGoBack(window.history.length > 1)
  }, [])

  const handleBack = () => {
    if (canGoBack) router.back()
    else router.push("/")
  }

  return (
    <div className="fixed left-4 top-4 z-40 flex items-center gap-2">
      <button
        onClick={handleBack}
        className="flex h-11 items-center gap-2 rounded-full border border-line bg-card/90 px-4 text-xs font-semibold text-foreground shadow-lg shadow-black/20 backdrop-blur transition-all hover:border-accent/50 active:scale-95"
        title="Kembali ke halaman sebelumnya"
      >
        <ArrowLeft className="h-4 w-4 text-accent" />
        Kembali
      </button>
      <Link
        href="/"
        className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-card/90 text-muted-foreground shadow-lg shadow-black/20 backdrop-blur transition-all hover:border-accent/50 hover:text-foreground active:scale-95"
        title="Ke halaman utama"
        aria-label="Ke halaman utama"
      >
        <Home className="h-4 w-4" />
      </Link>
    </div>
  )
}
