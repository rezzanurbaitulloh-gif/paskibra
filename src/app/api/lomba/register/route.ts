import { NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/admin"

export const runtime = "nodejs"

const MAX_FIELDS = 160

function clean(s: unknown): string {
  return String(s ?? "").trim().slice(0, MAX_FIELDS)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const schoolName = clean(body.school_name)
    const contact = clean(body.contact)
    const category = clean(body.category)
    const notes = clean(body.notes)

    if (!schoolName) {
      return Response.json({ error: "Nama sekolah wajib diisi" }, { status: 400 })
    }
    if (contact && !/^[0-9+\-\s()]{8,18}$/.test(contact.replace(/\s/g, ""))) {
      return Response.json({ error: "Nomor kontak tidak valid" }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from("lkbb_participants")
      .insert({
        school_name: schoolName,
        contact: contact || "—",
        category: category || "Umum",
        payment_status: "belum",
        amount: 0,
        notes: notes || "",
      })
      .select("id, school_name")
      .single()

    if (error) {
      return Response.json({ error: "Gagal menyimpan pendaftaran" }, { status: 500 })
    }

    return Response.json({ ok: true, id: data.id })
  } catch {
    return Response.json({ error: "Terjadi kesalahan" }, { status: 500 })
  }
}
