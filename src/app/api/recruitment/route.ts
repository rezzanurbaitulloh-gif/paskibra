import { NextRequest } from "next/server"
import { supabaseAdmin, getStaffUser } from "@/lib/admin"

export const runtime = "nodejs"

const KEY = "recruitment_applicants"

interface Applicant {
  id: string
  name: string
  kelas: string
  contact: string
  motivation: string
  status: "baru" | "diterima" | "ditolak"
  created_at: string
}

async function readAll(): Promise<Applicant[]> {
  const { data } = await supabaseAdmin
    .from("site_settings")
    .select("value")
    .eq("key", KEY)
    .maybeSingle()
  return Array.isArray(data?.value) ? (data.value as Applicant[]) : []
}

async function writeAll(list: Applicant[]) {
  await supabaseAdmin
    .from("site_settings")
    .upsert({ key: KEY, value: list, updated_at: new Date().toISOString() }, { onConflict: "key" })
}

function clean(s: unknown, max: number): string {
  return String(s ?? "").trim().slice(0, max)
}

/** POST publik — daftar jadi anggota */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const name = clean(body.name, 120)
    const kelas = clean(body.kelas, 60)
    const contact = clean(body.contact, 60)
    const motivation = clean(body.motivation, 400)

    if (!name) return Response.json({ error: "Nama wajib diisi" }, { status: 400 })
    if (!contact) return Response.json({ error: "Kontak wajib diisi" }, { status: 400 })

    const list = await readAll()
    const applicant: Applicant = {
      id: crypto.randomUUID(),
      name,
      kelas,
      contact,
      motivation,
      status: "baru",
      created_at: new Date().toISOString(),
    }
    list.unshift(applicant)
    await writeAll(list)
    return Response.json({ ok: true, id: applicant.id })
  } catch {
    return Response.json({ error: "Terjadi kesalahan" }, { status: 500 })
  }
}

/** GET staff — daftar pelamar */
export async function GET(request: NextRequest) {
  const staff = await getStaffUser(request)
  if (!staff) return Response.json({ error: "Tidak memiliki izin" }, { status: 403 })
  return Response.json({ applicants: await readAll() })
}

/** PATCH staff — terima/tolak pelamar; jika diterima, masukkan ke structure_members */
export async function PATCH(request: NextRequest) {
  const staff = await getStaffUser(request)
  if (!staff) return Response.json({ error: "Tidak memiliki izin" }, { status: 403 })

  const body = await request.json().catch(() => ({}))
  const id = clean(body.id, 64)
  const status = body.status as Applicant["status"]
  if (status !== "diterima" && status !== "ditolak") {
    return Response.json({ error: "Status tidak valid" }, { status: 400 })
  }

  const list = await readAll()
  const index = list.findIndex((a) => a.id === id)
  if (index === -1) return Response.json({ error: "Pelamar tidak ditemukan" }, { status: 404 })

  list[index].status = status

  if (status === "diterima") {
    const a = list[index]
    const division = clean(body.division, 60) || "Calon Anggota"
    const generation = clean(body.generation, 30) || String(new Date().getFullYear())
    const { error: memberError } = await supabaseAdmin.from("structure_members").insert({
      name: a.name,
      position: "Anggota",
      division,
      generation,
      photo_url: null,
    })
    if (memberError) {
      return Response.json({ error: "Gagal menambahkan ke daftar anggota" }, { status: 500 })
    }
  }

  await writeAll(list)
  return Response.json({ ok: true })
}
