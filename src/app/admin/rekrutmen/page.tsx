"use client"

import { useCallback, useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { EmptyState } from "@/components/ui/empty-state"
import { useToast } from "@/components/ui/toast"
import { Skeleton } from "@/components/ui/skeleton"
import { supabase } from "@/lib/supabase/client"
import { UserPlus, Check, X } from "lucide-react"

interface Applicant {
  id: string
  name: string
  kelas: string
  contact: string
  motivation: string
  status: "baru" | "diterima" | "ditolak"
  created_at: string
}

const STATUS_META: Record<string, { label: string; badge: string }> = {
  baru: { label: "Baru", badge: "bg-primary/10 text-primary" },
  diterima: { label: "Diterima", badge: "bg-emerald-500/15 text-emerald-500" },
  ditolak: { label: "Ditolak", badge: "bg-red-500/15 text-red-400" },
}

function getToken(): Promise<string | null> {
  return supabase.auth.getSession().then(({ data }) => data.session?.access_token || null)
}

export default function RekrutmenPage() {
  const toast = useToast()
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [loading, setLoading] = useState(true)
  const [acceptTarget, setAcceptTarget] = useState<Applicant | null>(null)
  const [division, setDivision] = useState("")
  const [generation, setGeneration] = useState(String(new Date().getFullYear()))
  const [busy, setBusy] = useState(false)

  const fetchAll = useCallback(async () => {
    const token = await getToken()
    if (!token) return
    const res = await fetch(`/api/recruitment`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    setApplicants(data.applicants || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch async (setState setelah await)
    fetchAll()
  }, [fetchAll])

  const decide = async (target: Applicant, status: "diterima" | "ditolak") => {
    const token = await getToken()
    if (!token) return
    setBusy(true)
    const res = await fetch(`/api/recruitment`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        id: target.id,
        status,
        division: status === "diterima" ? division : undefined,
        generation: status === "diterima" ? generation : undefined,
      }),
    })
    if (res.ok) {
      toast({
        type: status === "diterima" ? "success" : "info",
        title: status === "diterima" ? "Pelamar diterima & masuk daftar anggota" : "Permohonan ditolak",
      })
      setAcceptTarget(null)
      setDivision("")
      setGeneration(String(new Date().getFullYear()))
      fetchAll()
    } else {
      const data = await res.json().catch(() => ({}))
      toast({ type: "error", title: data.error || "Gagal memperbarui status" })
    }
    setBusy(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold md:text-3xl">Rekrutmen Anggota</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Permohonan masuk anggota dari formulir publik halaman Pengurus.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : applicants.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          title="Belum ada permohonan"
          description="Permohonan yang dikirim melalui halaman Pengurus akan muncul di sini."
        />
      ) : (
        <div className="space-y-3">
          {applicants.map((a, index) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="rounded-2xl border border-line bg-card p-5 card-glow"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold">{a.name}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_META[a.status].badge}`}>
                      {STATUS_META[a.status].label}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {a.kelas || "Kelas tidak diisi"} • {a.contact}
                  </p>
                </div>
                <p className="shrink-0 text-[10px] text-muted-foreground">
                  {new Date(a.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              {a.motivation && (
                <p className="mt-3 rounded-xl bg-soft p-3 text-xs leading-relaxed text-muted-foreground">
                  &ldquo;{a.motivation}&rdquo;
                </p>
              )}
              {a.status === "baru" && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    className="h-9 bg-emerald-500 text-white hover:bg-emerald-600"
                    onClick={() => setAcceptTarget(a)}
                  >
                    <Check className="mr-1.5 h-3.5 w-3.5" /> Terima
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 border-red-500/30 text-red-400 hover:bg-red-500/10"
                    disabled={busy}
                    onClick={() => decide(a, "ditolak")}
                  >
                    <X className="mr-1.5 h-3.5 w-3.5" /> Tolak
                  </Button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={!!acceptTarget} onOpenChange={(o) => !o && setAcceptTarget(null)}>
        <DialogContent className="border-line bg-card">
          <DialogHeader>
            <DialogTitle className="font-display">Terima {acceptTarget?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Pelamar akan ditambahkan ke daftar anggota publik (Struktur Organisasi).
            </p>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Divisi</Label>
              <Input
                value={division}
                onChange={(e) => setDivision(e.target.value)}
                placeholder="Contoh: Calon Anggota"
                className="h-10 border-line bg-soft"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Angkatan / Generasi</Label>
              <Input
                value={generation}
                onChange={(e) => setGeneration(e.target.value)}
                className="h-10 border-line bg-soft"
              />
            </div>
            <Button
              disabled={busy || !division.trim()}
              className="w-full bg-emerald-500 text-white hover:bg-emerald-600"
              onClick={() => acceptTarget && decide(acceptTarget, "diterima")}
            >
              {busy ? "Memproses..." : "Terima & Tambahkan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
