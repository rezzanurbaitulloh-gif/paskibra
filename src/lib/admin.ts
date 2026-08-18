import { createClient } from "@supabase/supabase-js"
import { NextRequest } from "next/server"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

export const supabaseAdmin = createClient(url, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export type StaffUser = { id: string; email: string; role: string }

/** Verifikasi token Bearer dari session auth → staff yang terdaftar di admin_users */
export async function getStaffUser(request: NextRequest): Promise<StaffUser | null> {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "")
    if (!token) return null
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token)
    if (error || !user) return null
    const { data } = await supabaseAdmin
      .from("admin_users")
      .select("role")
      .eq("email", (user.email || "").toLowerCase())
      .maybeSingle()
    if (!data?.role) return null
    return { id: user.id, email: user.email || "", role: data.role }
  } catch {
    return null
  }
}
