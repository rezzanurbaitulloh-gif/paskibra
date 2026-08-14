"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { supabase } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { useAdmin } from "@/contexts/AdminContext"
import { Users, Image, Package, FileText, DollarSign, MessageSquare } from "lucide-react"

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    pengurus: 0,
    galeri: 0,
    inventaris: 0,
    artikel: 0,
    keuangan: 0,
    saran: 0,
  })
  const { role } = useAdmin()

  useEffect(() => {
    const fetchStats = async () => {
      const [{ count: pengurus }, { count: galeri }, { count: inventaris }, { count: artikel }, { count: keuangan }, { count: saran }] = await Promise.all([
        supabase.from("structure_members").select("id", { count: "exact", head: true }),
        supabase.from("gallery").select("id", { count: "exact", head: true }),
        supabase.from("inventory").select("id", { count: "exact", head: true }),
        supabase.from("articles").select("id", { count: "exact", head: true }),
        supabase.from("financial_records").select("id", { count: "exact", head: true }),
        supabase.from("feedbacks").select("id", { count: "exact", head: true }),
      ])
      setStats({
        pengurus: pengurus || 0,
        galeri: galeri || 0,
        inventaris: inventaris || 0,
        artikel: artikel || 0,
        keuangan: keuangan || 0,
        saran: saran || 0,
      })
    }
    fetchStats()
  }, [])

  const cards = [
    { name: "Pengurus", count: stats.pengurus, icon: Users, href: "/admin/pengurus", roles: ["super_admin"] },
    { name: "Galeri", count: stats.galeri, icon: Image, href: "/admin/galeri", roles: ["super_admin", "humas"] },
    { name: "Inventaris", count: stats.inventaris, icon: Package, href: "/admin/inventaris", roles: ["super_admin"] },
    { name: "Artikel", count: stats.artikel, icon: FileText, href: "/admin/artikel", roles: ["super_admin", "humas"] },
    { name: "Keuangan", count: stats.keuangan, icon: DollarSign, href: "/admin/keuangan", roles: ["super_admin", "bendahara"] },
    { name: "Saran", count: stats.saran, icon: MessageSquare, href: "/admin/saran", roles: ["super_admin", "humas"] },
  ].filter(card => role && card.roles.includes(role))

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.href} className="p-5 card-glow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{card.name}</p>
                <p className="font-display text-2xl font-bold mt-1">{card.count}</p>
              </div>
              <div className="p-3 rounded-full bg-soft">
                <card.icon className="w-6 h-6 text-accent" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}