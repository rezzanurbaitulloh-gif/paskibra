"use client"

import { useEffect } from "react"
import { useTheme } from "next-themes"
import { useSiteSettings } from "@/contexts/SiteSettingsContext"

export function ThemeColorSync() {
  const { resolvedTheme } = useTheme()
  const { settings } = useSiteSettings()

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty("--primary", settings.colors.primary)
    root.style.setProperty("--secondary", settings.colors.secondary)
    root.style.setProperty("--accent", settings.colors.accent)
    if (resolvedTheme === "dark") {
      root.style.removeProperty("--foreground")
      root.style.removeProperty("--background")
    } else {
      root.style.setProperty("--foreground", settings.colors.foreground)
    }
  }, [resolvedTheme, settings.colors.primary, settings.colors.secondary, settings.colors.accent, settings.colors.foreground])

  return null
}
