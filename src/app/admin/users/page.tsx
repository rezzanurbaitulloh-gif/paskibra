"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase/client"
import { Plus, Trash2, KeyRound, ShieldCheck, Inbox, Loader2 } from "lucide-react"
import { RequireRole } from "@/components/require-role"

interface UserRow {
  id: string
  email: string | null
  created_at: string
  last_sign_in_at: string | null
  role: string | null
}

const ROLE_LABEL: Record<string, string> = {
  super_admin: "Admin",
  bendahara: "Bendahara",
  humas: "Humas",
}

const ROLES = ["super_admin", "bendahara", "humas"]

export default function UsersAdminPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [search, setSearch] = useState("")
  const [fRole, setFRole] = useState("all")
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({ email: "", password: "", role: "bendahara" })
  const [showAdd, setShowAdd] = useState(false)
  const [passwordTarget, setPasswordTarget] = useState<UserRow | null>(null)
  const [newPassword, setNewPassword] = useState("")

  const token = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    return session?.access_token || ""
  }

  const fetchUsers = async () => {
    const t = await token()
    const res = await fetch("/api/admin/users", { headers: { Authorization: `Bearer ${t}` } })
    if (!res.ok) {
      setError("Gagal memuat daftar pengguna")
      setLoading(false)
      return
    }
    const data = await res.json()
    setUsers(data.users || [])
    setLoading(false)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch async dari Supabase (setState setelah await, bukan sinkron)
    fetchUsers()
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError("")
    const t = await token()
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setBusy(false)
    if (!res.ok) {
      setError(data.error || "Gagal menambahkan akun")
      return
    }
    setForm({ email: "", password: "", role: "bendahara" })
    setShowAdd(false)
    fetchUsers()
  }

  const handleRole = async (user: UserRow, role: string | null) => {
    const t = await token()
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
      body: JSON.stringify({ id: user.id, email: user.email, role: role || undefined, removeRole: !role }),
    })
    fetchUsers()
  }

  const handlePassword = async () => {
    if (!passwordTarget || !newPassword) return
    setBusy(true)
    const t = await token()
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
      body: JSON.stringify({ id: passwordTarget.id, password: newPassword }),
    })
    setBusy(false)
    setPasswordTarget(null)
    setNewPassword("")
  }

  const handleDelete = async (user: UserRow) => {
    if (!confirm(`Hapus akun ${user.email}?`)) return
    const t = await token()
    await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
      body: JSON.stringify({ id: user.id }),
    })
    fetchUsers()
  }

  return (
    <RequireRole path="/admin/users">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold md:text-3xl">Manajemen Pengguna</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Semua akun yang pernah masuk (termasuk Google). Hanya admin yang dapat mengelola.
            </p>
          </div>
          <Button onClick={() => setShowAdd(!showAdd)} className="gradient-primary text-white sm:w-auto w-full">
            <Plus className="mr-2 h-4 w-4" /> Tambah Akun
          </Button>
        </div>

        {error && (
          <p className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">{error}</p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari email..."
            className="h-9 w-full border-line bg-soft text-sm sm:w-56"
          />
          <select
            value={fRole}
            onChange={(e) => setFRole(e.target.value)}
            className="h-9 rounded-lg border border-line bg-card px-2 text-xs"
          >
            <option value="all">Semua Role</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>{ROLE_LABEL[r]}</option>
            ))}
            <option value="none">Tanpa Role</option>
          </select>
        </div>

        {showAdd && (
          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleAdd}
            className="grid gap-4 rounded-2xl border border-line bg-card p-5 md:grid-cols-[1fr_1fr_180px_auto]"
          >
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Email</Label>
              <Input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="nama@email.com"
                className="h-10 border-line bg-soft"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Password</Label>
              <PasswordInput
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="h-10 border-line bg-soft"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v ?? "bendahara" })}>
                <SelectTrigger className="h-10 border-line bg-soft"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{ROLE_LABEL[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={busy} className="gradient-primary text-white">
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                Simpan
              </Button>
            </div>
          </motion.form>
        )}

        {loading ? (
          <p className="py-12 text-center text-sm text-muted-foreground">Memuat...</p>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Inbox className="h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">Belum ada pengguna.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-line bg-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-[11px] uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Terdaftar</th>
                    <th className="px-4 py-3">Terakhir Masuk</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {users
                    .filter((u) => (u.email || "").toLowerCase().includes(search.toLowerCase()))
                    .filter((u) => fRole === "all" || (u.role || "none") === fRole)
                    .map((u) => (
                    <tr key={u.id} className="border-b border-line/50 last:border-0 hover:bg-soft/50">
                      <td className="px-4 py-3 font-medium">{u.email}</td>
                      <td className="px-4 py-3">
                        <Select
                          value={u.role || "none"}
                          onValueChange={(v) => handleRole(u, v === "none" ? null : v)}
                        >
                          <SelectTrigger className="h-9 w-36 border-line bg-soft">
                            <SelectValue placeholder="User biasa" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">User biasa</SelectItem>
                            {ROLES.map((r) => (
                              <SelectItem key={r} value={r}>{ROLE_LABEL[r]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString("id-ID")}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {u.last_sign_in_at
                          ? new Date(u.last_sign_in_at).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric" })
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 w-9"
                            onClick={() => setPasswordTarget(u)}
                            title="Ubah sandi"
                          >
                            <KeyRound className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-9 w-9" onClick={() => handleDelete(u)} title="Hapus akun">
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {passwordTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => setPasswordTarget(null)}
          >
            <div
              className="w-full max-w-sm rounded-2xl border border-line bg-card p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-display font-bold">Ubah Sandi</h3>
              <p className="mt-1 text-xs text-muted-foreground">{passwordTarget.email}</p>
              <PasswordInput
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Password baru"
                className="mt-4 h-10 border-line bg-soft"
              />
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setPasswordTarget(null)}>Batal</Button>
                <Button className="gradient-primary text-white" disabled={busy || !newPassword} onClick={handlePassword}>
                  Simpan
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </RequireRole>
  )
}