import { NextRequest } from "next/server"
import { supabaseAdmin, getStaffUser } from "@/lib/admin"

export const runtime = "nodejs"

const ALLOWED_KEYS = ["events", "recruitment_applicants", "announcements"]

function parseJsonArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

/** GET publik — ambil nilai key dari site_settings */
export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key")
  if (!key || !ALLOWED_KEYS.includes(key)) {
    return Response.json({ error: "Key tidak valid" }, { status: 400 })
  }
  const { data, error } = await supabaseAdmin
    .from("site_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ value: parseJsonArray(data?.value) })
}

/** PUT staff — timpa seluruh nilai key */
export async function PUT(request: NextRequest) {
  const staff = await getStaffUser(request)
  if (!staff) return Response.json({ error: "Tidak memiliki izin" }, { status: 403 })

  const key = request.nextUrl.searchParams.get("key")
  if (!key || !ALLOWED_KEYS.includes(key)) {
    return Response.json({ error: "Key tidak valid" }, { status: 400 })
  }
  const body = await request.json().catch(() => ({}))
  if (!Array.isArray(body.value)) {
    return Response.json({ error: "value harus array" }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from("site_settings")
    .upsert({ key, value: body.value, updated_at: new Date().toISOString() }, { onConflict: "key" })
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
