"use client"

import { useEffect, useState } from "react"
import { Download, X } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => {
      setDeferred(null)
      setDismissed(true)
    }
    window.addEventListener("beforeinstallprompt", onPrompt)
    window.addEventListener("appinstalled", onInstalled)
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt)
      window.removeEventListener("appinstalled", onInstalled)
    }
  }, [])

  if (!deferred || dismissed) return null

  const install = async () => {
    await deferred.prompt()
    const { outcome } = await deferred.userChoice
    if (outcome === "accepted") setDeferred(null)
    setDismissed(true)
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-line bg-card p-4 shadow-2xl">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl gradient-primary">
        <Download className="h-5 w-5 text-white" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">Pasang Aplikasi</p>
        <p className="text-[11px] text-muted-foreground">Akses cepat Satria Cengkara dari layar utama.</p>
      </div>
      <button
        onClick={install}
        className="shrink-0 rounded-lg gradient-primary px-3.5 py-2 text-xs font-semibold text-white"
      >
        Pasang
      </button>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Tutup"
        className="shrink-0 rounded-lg px-2 py-2 text-xs text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
