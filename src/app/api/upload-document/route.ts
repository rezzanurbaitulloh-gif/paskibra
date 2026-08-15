import { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const ALLOWED = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "text/plain": "txt",
  "text/csv": "csv",
  "application/zip": "zip",
}

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

    if (!(file.type in ALLOWED)) {
      return Response.json({ error: "Tipe file tidak didukung (PDF, DOC, XLS, PPT, TXT, ZIP)" }, { status: 400 })
    }
    if (file.size > 20 * 1024 * 1024) {
      return Response.json({ error: "Maksimal 20MB" }, { status: 400 })
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || ALLOWED[file.type as keyof typeof ALLOWED]
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    const { error: uploadError } = await admin.storage
      .from("documents")
      .upload(path, file, { contentType: file.type, cacheControl: "3600" })
    if (uploadError) {
      return Response.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: pub } = admin.storage.from("documents").getPublicUrl(path)
    return Response.json({ url: pub.publicUrl, fileName: file.name })
  } catch {
    return Response.json({ error: "Upload gagal" }, { status: 500 })
  }
}
