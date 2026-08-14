"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Loader2, LayoutDashboard, CheckCircle2 } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/AuthContext"

export default function AccountPage() {
  const { user, role, isStaff, loading } = useAuth()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = "/login"
    }
  }, [loading, user])

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage("")
    setError("")
    if (password.length < 6) {
      setError("Password minimal 6 karakter.")
      return
    }
    if (password !== confirm) {
      setError("Konfirmasi password tidak sama.")
      return
    }
    setSaving(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    setSaving(false)
    if (err) {
      setError(err.message)
      return
    }
    setPassword("")
    setConfirm("")
    setMessage("Password berhasil diperbarui.")
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    )
  }

  const roleLabel = isStaff
    ? { super_admin: "Admin", bendahara: "Bendahara", humas: "Humas" }[role!]
    : "Pengguna Biasa"

  return (
    <div className="min-h-screen">
      <div className="container mx-auto max-w-md px-4 pt-28 pb-16">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke Beranda
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-6 space-y-5"
        >
          <Card className="glass border-line">
            <CardHeader>
              <CardTitle className="font-display text-xl">Pengaturan Akun</CardTitle>
              <CardDescription className="break-all">{user?.email}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-line bg-soft px-4 py-3">
                <span className="text-xs text-muted-foreground">Role</span>
                <span className="text-xs font-semibold">{roleLabel}</span>
              </div>

              {isStaff && (
                <Link
                  href="/admin/dashboard"
                  className="flex items-center justify-center gap-2 rounded-xl border border-line bg-card px-4 py-3 text-xs font-medium transition-colors hover:border-accent/50"
                >
                  <LayoutDashboard className="h-4 w-4 text-accent" /> Buka Dashboard
                </Link>
              )}

              <form onSubmit={handlePassword} className="space-y-3 border-t border-line pt-4">
                <p className="text-xs font-semibold">Ubah Password</p>
                <div className="space-y-1.5">
                  <Label htmlFor="pw" className="text-xs text-muted-foreground">Password Baru</Label>
                  <Input
                    id="pw"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-10 border-line bg-soft"
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pw2" className="text-xs text-muted-foreground">Konfirmasi Password</Label>
                  <Input
                    id="pw2"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="h-10 border-line bg-soft"
                    placeholder="••••••••"
                  />
                </div>
                {message && (
                  <p className="flex items-center gap-1.5 text-xs text-green-500">
                    <CheckCircle2 className="h-3.5 w-3.5" /> {message}
                  </p>
                )}
                {error && <p className="text-xs text-red-400">{error}</p>}
                <Button type="submit" className="w-full gradient-primary text-white" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Simpan Password
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}