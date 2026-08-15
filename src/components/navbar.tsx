"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"
import { ProfileMenu } from "@/components/profile-menu"
import { useAuth } from "@/contexts/AuthContext"
import { useSiteSettings } from "@/contexts/SiteSettingsContext"

const NAV_LINKS = [
  { label: "Beranda", href: "#beranda" },
  { label: "Sekolah", href: "#sekolah" },
  { label: "Daftar Anggota", href: "#pengurus" },
  { label: "Galeri", href: "#galeri" },
  { label: "Sejarah", href: "#sejarah" },
  { label: "Layanan", href: "#penyewaan" },
  { label: "Kontak", href: "#kontak" },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const { user } = useAuth()
  const { settings } = useSiteSettings()
  const pathname = usePathname()
  const brandWords = (settings.branding.orgName || "SATRIA CENGKARA").toUpperCase().split(/\s+/).filter(Boolean)
  const navLinks = settings.nav.links.length > 0 ? settings.nav.links : NAV_LINKS
  const [mobileOpen, setMobileOpen] = useState(false)

  const isHome = pathname === "/"
  const isAdminArea = pathname.startsWith("/admin")
  const effectiveScrolled = scrolled || !isHome

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  if (isAdminArea) return null

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        effectiveScrolled ? "py-2" : "py-4"
      )}
    >
      <div className="container mx-auto px-4">
        <nav
          className={cn(
            "flex items-center justify-between rounded-2xl px-4 py-2.5 transition-all duration-300",
            effectiveScrolled
              ? "glass shadow-lg shadow-black/20"
              : "bg-transparent border border-transparent"
          )}
        >
          <Link href="/" className="flex items-center gap-3">
            <div className="relative h-9 w-9 rounded-full overflow-hidden ring-1 ring-white/15 bg-card">
              <Image src={settings.branding.logoUrl || "/logo.png"} alt="Satria Cengkara" fill sizes="3rem" className="object-cover" />
            </div>
            <div className="hidden sm:block leading-tight">
              <p className="font-display font-bold text-sm tracking-wide">
                {brandWords[0] || "SATRIA CENGKARA"}
              </p>
              <p className="text-[10px] text-muted-foreground">Paskibra {settings.branding.schoolName}</p>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const href = link.href.startsWith("#") && !isHome ? "/" + link.href : link.href
              return (
                <a
                  key={link.href}
                  href={href}
                  className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-soft"
                >
                  {link.label}
                </a>
              )
            })}
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <ProfileMenu />
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line text-muted-foreground hover:text-foreground"
              aria-label="Menu"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </nav>

        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden mt-2 rounded-2xl border border-line bg-background p-3 shadow-xl"
          >
            <div className="flex flex-col">
              {navLinks.map((link) => {
                const href = link.href.startsWith("#") && !isHome ? "/" + link.href : link.href
                return (
                  <a
                    key={link.href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className="px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-soft rounded-lg transition-colors"
                  >
                    {link.label}
                  </a>
                )
              })}
              {user ? (
                <>
                  <Link
                    href="/akun"
                    onClick={() => setMobileOpen(false)}
                    className="mt-2 px-3 py-2.5 text-sm rounded-lg border border-line text-center hover:bg-soft transition-colors"
                  >
                    Pengaturan Akun
                  </Link>
                  <Link
                    href="/admin/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="mt-2 px-3 py-2.5 text-sm rounded-lg border border-line text-center hover:bg-soft transition-colors"
                  >
                    Dashboard
                  </Link>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="mt-2 px-3 py-2.5 text-sm rounded-lg gradient-primary text-center text-white transition-colors"
                >
                  Masuk
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </header>
  )
}
