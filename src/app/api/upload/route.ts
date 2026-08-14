import { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "")
    if (!token) {
      return Response.json({ error: "Tidak terautentikasi" }, { status: 401 })
    }
    const {
      data: { user },
      error: authError,
    } = await admin.auth.getUser(token)
    if (authError || !user) {
      return Response.json({ error: "Sesi tidak valid" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file")
    if (!(file instanceof File)) {
      return Response.json({ error: "File tidak ditemukan" }, { status: 400 })
    }

    const allowed = ["image/png", "image/jpeg", "image/webp", "image/svg+xml", "image/gif"]
    if (!allowed.includes(file.type)) {
      return Response.json({ error: "Tipe file tidak didukung" }, { status: 400 })
    }
    if (file.size > 10 * 1024 * 1024) {
      return Response.json({ error: "Maksimal 10MB" }, { status: 400 })
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "png"
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    const { error: uploadError } = await admin.storage
      .from("images")
      .upload(path, file, { contentType: file.type, cacheControl: "3600" })
    if (uploadError) {
      return Response.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: pub } = admin.storage.from("images").getPublicUrl(path)
    return Response.json({ url: pub.publicUrl })
  } catch {
    return Response.json({ error: "Upload gagal" }, { status: 500 })
  }
}