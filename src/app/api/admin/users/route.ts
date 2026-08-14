import { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
const admin = createClient(url, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const VALID_ROLES = ["super_admin", "bendahara", "humas"] as const

async function isSuperAdmin(request: NextRequest): Promise<boolean> {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "")
    if (!token) return false
    const {
      data: { user },
      error,
    } = await admin.auth.getUser(token)
    if (error || !user) return false
    const { data } = await admin
      .from("admin_users")
      .select("role")
      .eq("email", (user.email || "").toLowerCase())
      .maybeSingle()
    return data?.role === "super_admin"
  } catch {
    return false
  }
}

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  if (!(await isSuperAdmin(request))) {
    return Response.json({ error: "Tidak memiliki izin" }, { status: 403 })
  }

  const { data: users, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (error) return Response.json({ error: error.message }, { status: 500 })

  const { data: roles } = await admin.from("admin_users").select("email, role")

  const roleMap: Record<string, string> = {}
  for (const r of roles || []) roleMap[(r.email || "").toLowerCase()] = r.role

  const list = (users?.users || []).map((u) => ({
    id: u.id,
    email: u.email,
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at,
    role: roleMap[(u.email || "").toLowerCase()] || null,
  }))

  return Response.json({ users: list })
}

export async function POST(request: NextRequest) {
  if (!(await isSuperAdmin(request))) {
    return Response.json({ error: "Tidak memiliki izin" }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const { email, password, role } = body as { email?: string; password?: string; role?: string }

  if (!email || !password) {
    return Response.json({ error: "Email dan password wajib diisi" }, { status: 400 })
  }
  if (role && !VALID_ROLES.includes(role as (typeof VALID_ROLES)[number])) {
    return Response.json({ error: "Role tidak valid" }, { status: 400 })
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: email.toLowerCase().trim(),
    password,
    email_confirm: true,
  })
  if (error) return Response.json({ error: error.message }, { status: 400 })

  if (role && data.user) {
    await admin
      .from("admin_users")
      .upsert(
        { user_id: data.user.id, email: data.user.email!.toLowerCase(), role },
        { onConflict: "user_id" }
      )
  }

  return Response.json({ user: { id: data.user!.id, email: data.user!.email } })
}

export async function PATCH(request: NextRequest) {
  if (!(await isSuperAdmin(request))) {
    return Response.json({ error: "Tidak memiliki izin" }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const { id, email, password, role, removeRole } = body as {
    id?: string
    email?: string
    password?: string
    role?: string
    removeRole?: boolean
  }

  if (!id) return Response.json({ error: "ID user wajib" }, { status: 400 })

  if (password) {
    const { error } = await admin.auth.admin.updateUserById(id, { password })
    if (error) return Response.json({ error: error.message }, { status: 400 })
  }

  if (email) {
    const { error } = await admin.auth.admin.updateUserById(id, { email: email.toLowerCase().trim() })
    if (error) return Response.json({ error: error.message }, { status: 400 })
  }

  if (removeRole) {
    await admin.from("admin_users").delete().eq("user_id", id)
  } else if (role) {
    if (!VALID_ROLES.includes(role as (typeof VALID_ROLES)[number])) {
      return Response.json({ error: "Role tidak valid" }, { status: 400 })
    }
    const { data: u } = await admin.auth.admin.getUserById(id)
    await admin
      .from("admin_users")
      .upsert(
        {
          user_id: id,
          email: (email || u.user?.email || "").toLowerCase(),
          role,
        },
        { onConflict: "user_id" }
      )
  }

  return Response.json({ ok: true })
}

export async function DELETE(request: NextRequest) {
  if (!(await isSuperAdmin(request))) {
    return Response.json({ error: "Tidak memiliki izin" }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const { id } = body as { id?: string }
  if (!id) return Response.json({ error: "ID user wajib" }, { status: 400 })

  await admin.from("admin_users").delete().eq("user_id", id)
  const { error } = await admin.auth.admin.deleteUser(id)
  if (error) return Response.json({ error: error.message }, { status: 400 })

  return Response.json({ ok: true })
}