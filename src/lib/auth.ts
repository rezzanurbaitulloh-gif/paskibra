import { supabase } from "@/lib/supabase/client"

export type UserRole = "super_admin" | "bendahara" | "humas"

/** Role internal dari email terdaftar di admin_users */
export async function getStaffRole(email: string | undefined | null): Promise<UserRole | null> {
  if (!email) return null
  const { data } = await supabase
    .from("admin_users")
    .select("role")
    .eq("email", email.toLowerCase())
    .maybeSingle()
  return (data?.role as UserRole) || null
}

/** Cek session saat ini + role (staff atau null untuk guest) */
export async function getSessionWithRole(): Promise<{
  user: { id: string; email: string | null } | null
  role: UserRole | null
  isStaff: boolean
}> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.user) return { user: null, role: null, isStaff: false }
  const role = await getStaffRole(session.user.email)
  return {
    user: { id: session.user.id, email: session.user.email || null },
    role,
    isStaff: Boolean(role),
  }
}

export async function signInWithGoogle(redirectTo: string) {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
    },
  })
  return { error }
}

export async function signOut() {
  await supabase.auth.signOut()
}