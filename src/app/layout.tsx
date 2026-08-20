import type { Metadata } from "next";
import {
  Plus_Jakarta_Sans,
  Bebas_Neue,
} from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip"
import { ThemeProvider } from "next-themes"
import { AnimatedBackground } from "@/components/animated-background";
import { Navbar } from "@/components/navbar";
import { AuthProvider } from "@/contexts/AuthContext";
import { SiteSettingsProvider } from "@/contexts/SiteSettingsContext";
import { ThemeColorSync } from "@/components/theme-color-sync";
import { ToastProvider } from "@/components/ui/toast";
import { MotionConfig } from "framer-motion";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-pjs",
  display: "swap",
});

const bebas = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bebas",
  display: "swap",
  preload: true,
});

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://satriacengkar.vercel.app").replace(/\/$/, "")

export const metadata: Metadata = {
  title: {
    default: "Satria Cengkara — Paskibra SMKN 1 Kertosono",
    template: "%s — Satria Cengkara",
  },
  description:
    "Organisasi Paskibra Satria Cengkara SMKN 1 Kertosono. Disiplin, tangguh, berintegritas. Berita, galeri, prestasi, dan pendaftaran LKBB.",
  manifest: "/manifest.json",
  metadataBase: new URL(siteUrl),
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Satria Cengkara",
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: siteUrl,
    siteName: "Satria Cengkara",
    title: "Satria Cengkara — Paskibra SMKN 1 Kertosono",
    description:
      "Organisasi Paskibra Satria Cengkara SMKN 1 Kertosono. Disiplin, tangguh, berintegritas.",
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "Logo Satria Cengkara" }],
  },
  twitter: {
    card: "summary",
    title: "Satria Cengkara — Paskibra SMKN 1 Kertosono",
    description:
      "Organisasi Paskibra Satria Cengkara SMKN 1 Kertosono. Disiplin, tangguh, berintegritas.",
    images: ["/logo.png"],
  },
  other: {
    "theme-color": "#010281",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${plusJakarta.variable} ${bebas.variable}`}
    >
      <body className={`antialiased`}>
        <a
          href="#konten"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-foreground focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-background"
        >
          Langsung ke konten
        </a>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <MotionConfig reducedMotion="user">
            <ToastProvider>
              <AuthProvider>
                <SiteSettingsProvider>
                  <ThemeColorSync />
                  <AnimatedBackground />
                  <Navbar />
                  <TooltipProvider>{children}</TooltipProvider>
                  <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                      __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Organization",
                        name: "Paskibra Satria Cengkara",
                        alternateName: "Satria Cengkara",
                        url: siteUrl,
                        logo: `${siteUrl}/logo.png`,
                        description:
                          "Organisasi Paskibra Satria Cengkara SMKN 1 Kertosono. Disiplin, tangguh, berintegritas.",
                      }),
                    }}
                  />
                </SiteSettingsProvider>
              </AuthProvider>
            </ToastProvider>
          </MotionConfig>
        </ThemeProvider>
      </body>
    </html>
  );
}
