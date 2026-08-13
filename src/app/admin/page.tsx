"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Users, Image, ShoppingBag, DollarSign, Package, MessageSquare } from "lucide-react"
import { motion } from "framer-motion"
import { supabase } from "@/lib/supabase/client"
import { useEffect, useState } from "react"

interface StatCardProps {
  title: string
  value: number
  icon: React.ReactNode
}

function StatCard({ title, value, icon }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="glass border-border/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {icon}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    members: 0,
    gallery: 0,
    rentals: 0,
    financial: 0,
    inventory: 0,
    feedbacks: 0
  })

  useEffect(() => {
    const fetchStats = async () => {
      const { count: members } = await supabase.from("structure_members").select("*", { count: "exact", head: true })
      const { count: gallery } = await supabase.from("gallery").select("*", { count: "exact", head: true })
      const { count: rentals } = await supabase.from("rentals").select("*", { count: "exact", head: true })
      const { count: financial } = await supabase.from("financial_records").select("*", { count: "exact", head: true })
      const { count: inventory } = await supabase.from("inventory").select("*", { count: "exact", head: true })
      const { count: feedbacks } = await supabase.from("feedbacks").select("*", { count: "exact", head: true })

      setStats({
        members: members || 0,
        gallery: gallery || 0,
        rentals: rentals || 0,
        financial: financial || 0,
        inventory: inventory || 0,
        feedbacks: feedbacks || 0
      })
    }

    fetchStats()
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">Dashboard Admin</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Pengurus" value={stats.members} icon={<Users className="h-4 w-4 text-muted-foreground" />} />
        <StatCard title="Galeri" value={stats.gallery} icon={<Image className="h-4 w-4 text-muted-foreground" />} />
        <StatCard title="Penyewaan" value={stats.rentals} icon={<ShoppingBag className="h-4 w-4 text-muted-foreground" />} />
        <StatCard title="Keuangan" value={stats.financial} icon={<DollarSign className="h-4 w-4 text-muted-foreground" />} />
        <StatCard title="Inventaris" value={stats.inventory} icon={<Package className="h-4 w-4 text-muted-foreground" />} />
        <StatCard title="Saran" value={stats.feedbacks} icon={<MessageSquare className="h-4 w-4 text-muted-foreground" />} />
      </div>
    </div>
  )
}