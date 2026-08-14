import Image from "next/image"
import { Mail, MapPin, Phone } from "lucide-react"

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  )
}

const socials = [
  { label: "Instagram", href: "https://www.instagram.com/satria_cengkara", Icon: InstagramIcon },
  { label: "TikTok", href: "https://www.tiktok.com/@satria_cengkara", Icon: TikTokIcon },
]

const links = [
  { label: "Beranda", href: "/#beranda" },
  { label: "Profil Sekolah", href: "/#sekolah" },
  { label: "Pengurus", href: "/pengurus" },
  { label: "Galeri", href: "/galeri" },
  { label: "Layanan Sewa", href: "/layanan" },
  { label: "Kotak Saran", href: "/saran" },
]

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer id="kontak" className="border-t border-line bg-card/50">
      <div className="container mx-auto px-4 py-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 overflow-hidden rounded-full ring-1 ring-white/15">
                <Image src="/logo.png" alt="Satria Cengkara" fill className="object-cover" />
              </div>
              <div className="leading-tight">
                <p className="font-display font-bold text-sm">SATRIA CENGKARA</p>
                <p className="text-[10px] text-muted-foreground">Paskibra SMKN 1 Kertosono</p>
              </div>
            </div>
            <p className="mt-4 max-w-xs text-xs leading-relaxed text-muted-foreground">
              Membentuk generasi muda yang disiplin, tangguh, dan berintegritas melalui
              pendidikan baris-berbaris dan pengembangan karakter kepemimpinan.
            </p>
            <div className="mt-5 flex gap-2">
              {socials.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-muted-foreground transition-all hover:border-white/25 hover:text-foreground"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-display text-sm font-bold">Tautan</h4>
            <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5">
              {links.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="text-xs text-muted-foreground transition-colors hover:text-foreground">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display text-sm font-bold">Kontak</h4>
            <ul className="mt-4 space-y-3 text-xs text-muted-foreground">
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                SMKN 1 Kertosono, Kab. Nganjuk, Jawa Timur
              </li>
              <li className="flex items-start gap-2.5">
                <Phone className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                0812-3456-7890
              </li>
              <li className="flex items-start gap-2.5">
                <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                <a href="mailto:satriacengkara@gmail.com" className="transition-colors hover:text-foreground">
                  satriacengkara@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-line pt-6 text-[11px] text-muted-foreground md:flex-row">
          <p>© {year} Paskibra Satria Cengkara — SMKN 1 Kertosono</p>
          <p>
            Dibuat dengan <span className="text-primary">♥</span> oleh Tim Satria Cengkara
          </p>
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground/60">
          Foto watermark: Wikimedia Commons (CC BY-SA 4.0)
        </p>
      </div>
    </footer>
  )
}