import type { Metadata } from "next";
import {
  Plus_Jakarta_Sans,
  Inter,
  Poppins,
  Montserrat,
  Lato,
  DM_Sans,
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

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
  preload: false,
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
  preload: false,
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-montserrat",
  display: "swap",
  preload: false,
});

const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-lato",
  display: "swap",
  preload: false,
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-dmsans",
  display: "swap",
  preload: false,
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
    "theme-color": "#0f172a",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body
        className={`${plusJakarta.variable} ${inter.variable} ${poppins.variable} ${montserrat.variable} ${lato.variable} ${dmSans.variable} antialiased`}
      >
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
