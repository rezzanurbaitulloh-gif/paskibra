import { HeroSection } from "@/components/sections/HeroSection"
import { SchoolBentoGrid } from "@/components/sections/SchoolBentoGrid"
import { StructureMembers } from "@/components/sections/StructureMembers"
import { AchievementsGallery } from "@/components/sections/AchievementsGallery"
import { RentalCatalog } from "@/components/sections/RentalCatalog"
import { HistoryTimeline, LogoPhilosophy } from "@/components/sections/HistoryTimeline"
import { FeedbackForm } from "@/components/sections/FeedbackForm"
import { Footer } from "@/components/sections/Footer"
import { AIChatWidget } from "@/components/widgets/AIChatWidget"
import { FloatingWhatsApp } from "@/components/widgets/FloatingWhatsApp"
import { supabase } from "@/lib/supabase/server"

export default async function Home() {
  const { data: members } = await supabase.from("structure_members").select("*")
  const { data: achievements } = await supabase.from("gallery").select("*")
  const { data: allGallery } = await supabase.from("gallery").select("category")
  const { data: rentals } = await supabase.from("inventory").select("*")

  const categories = [...new Set((allGallery || []).map(g => g.category))]

  const realStats = [
    { value: `${members?.length || 0}`, label: "Total Anggota" },
    { value: `${new Set((members || []).map((m) => m.generation).filter(Boolean)).size}`, label: "Total Generasi" },
    { value: `${achievements?.length || 0}`, label: "Dokumentasi Kegiatan" },
  ]

  return (
    <main>
      <HeroSection realStats={realStats} />
      <SchoolBentoGrid />
      {members && <StructureMembers members={members} />}
      {achievements && (
        <AchievementsGallery
          achievements={achievements.map(a => ({
            ...a,
            image_url: a.image_url || "",
            year: new Date(a.created_at).getFullYear().toString()
          }))}
          categories={categories}
        />
      )}
      <HistoryTimeline />
      <LogoPhilosophy />
      {rentals && (
        <RentalCatalog
          items={rentals.map(r => ({
            ...r,
            available: r.is_available,
            image_url: r.image_url || "",
            description: r.description || "",
          }))}
        />
      )}
      <FeedbackForm />
      <Footer />
      <FloatingWhatsApp />
      <AIChatWidget />
    </main>
  )
}