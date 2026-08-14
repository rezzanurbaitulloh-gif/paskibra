import type { Metadata } from "next";
import { Syne, Plus_Jakarta_Sans } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip"
import { ThemeProvider } from "next-themes"
import { AnimatedBackground } from "@/components/animated-background";
import { AuthProvider } from "@/contexts/AuthContext";
import { SiteSettingsProvider } from "@/contexts/SiteSettingsContext";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-display",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Satria Cengkara — Paskibra SMKN 1 Kertosono",
  description:
    "Organisasi Paskibra Satria Cengkara SMKN 1 Kertosono. Disiplin, tangguh, berintegritas.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
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
      <body className={`${syne.variable} ${plusJakarta.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <AuthProvider>
            <AnimatedBackground />
            <TooltipProvider>{children}</TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
