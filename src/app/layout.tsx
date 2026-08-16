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

export const metadata: Metadata = {
  title: "Satria Cengkara — Paskibra SMKN 1 Kertosono",
  description:
    "Organisasi Paskibra Satria Cengkara SMKN 1 Kertosono. Disiplin, tangguh, berintegritas.",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Satria Cengkara",
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
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <SiteSettingsProvider>
              <ThemeColorSync />
              <AnimatedBackground />
              <Navbar />
              <TooltipProvider>{children}</TooltipProvider>
            </SiteSettingsProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
