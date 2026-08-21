import fs from "fs"
import os from "os"
import path from "path"

export interface AIEndpoint {
  url: string
  key: string
  models: string[]
  provider: string
}

interface RawEndpoint {
  url: string
  key: string
  models: string[]
  provider: string
}

const CONFIG_PATH = path.join(os.homedir(), ".config", "opencode", "opencode.json")

/** Key yang sengaja kosong/"none" = endpoint publik tanpa autentikasi */
const NO_AUTH_KEY = /^(none|no.?key|n\/a|skip)$/i
/** Key placeholder yang belum diisi — jangan dipakai */
const PLACEHOLDER_KEY = /(placeholder|ganti.*key|xxxx|your.?key)/i

/** Baca SEMUA provider + apiKey + model dari config opencode saat ini */
function readOpencodeConfig(): RawEndpoint[] {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, "utf8")
    const data = JSON.parse(raw)
    const out: RawEndpoint[] = []
    for (const [name, provider] of Object.entries(data.provider || {})) {
      const p = provider as { options?: { baseURL?: string; apiKey?: string }; models?: Record<string, unknown> }
      const url = p?.options?.baseURL
      const key = String(p?.options?.apiKey || "").trim()
      const models = Object.keys(p?.models || {})
      if (!url || models.length === 0) continue
      if (NO_AUTH_KEY.test(key)) {
        out.push({ url: url.replace(/\/+$/, ""), key: "", models, provider: name })
        continue
      }
      if (!key || PLACEHOLDER_KEY.test(key)) continue
      out.push({ url: url.replace(/\/+$/, ""), key, models, provider: name })
    }
    return out
  } catch {
    return []
  }
}

/** Gemini (OpenAI-compatible) — prioritas utama jika GEMINI_API_KEY tersedia */
function geminiEndpoint(): RawEndpoint[] {
  const key = String(process.env.GEMINI_API_KEY || "").trim()
  if (!key) return []
  const model = process.env.GEMINI_MODEL || "gemini-3.6-flash"
  return [
    {
      url: "https://generativelanguage.googleapis.com/v1beta/openai",
      key,
      models: [model],
      provider: "gemini",
    },
  ]
}

/** Tambahan dari env (jika ada key yang tidak ada di JSON) — Nara sebagai default utama */
function envEndpoints(): RawEndpoint[] {
  const out: RawEndpoint[] = []
  for (const key of (process.env.NARA_KEYS || process.env.NEXT_PUBLIC_NARA_KEYS || "").split(",").filter(Boolean)) {
    out.push({
      url: (process.env.NARA_BASE_URL || "https://router.bynara.id/v1").replace(/\/+$/, ""),
      key,
      models: [process.env.NARA_MODEL || "mistral-large"],
      provider: "env-nara",
    })
  }
  return out
}

/** Endpoint dari env AI_ENDPOINTS (JSON) — untuk deployment cloud (Vercel) yang tidak punya file config opencode */
function envJsonEndpoints(): RawEndpoint[] {
  const raw = process.env.AI_ENDPOINTS || ""
  if (!raw) return []
  try {
    const list = JSON.parse(raw) as { url?: string; key?: string; models?: string[]; provider?: string }[]
    return list
      .filter((e) => e?.url && Array.isArray(e.models) && e.models.length > 0)
      .map((e) => ({
        url: (e.url || "").replace(/\/+$/, ""),
        key: String(e.key || "").trim(),
        models: e.models as string[],
        provider: e.provider || "env-json",
      }))
  } catch {
    return []
  }
}

/** Endpoint publik tanpa auth — fallback terakhir agar AI selalu punya kandidat (termasuk di Vercel) */
function publicFallback(): RawEndpoint[] {
  const base = process.env.QWEN_BASE_URL || "https://g9hnto0u7lvbu837.us-east-2.aws.endpoints.huggingface.cloud/v1"
  const model = process.env.QWEN_MODEL || "Qwen/Qwen3.8-27B"
  if (process.env.DISABLE_QWEN_FALLBACK === "1") return []
  return [{ url: base.replace(/\/+$/, ""), key: "", models: [model], provider: "public-qwen" }]
}

export function getAIEndpoints(): AIEndpoint[] {
  const seen = new Set<string>()
  const config = readOpencodeConfig()
  const cloud = config.filter((e) => !/localhost|127\.0\.0\.1/.test(e.url))
  const local = config.filter((e) => /localhost|127\.0\.0\.1/.test(e.url))
  const all = [...geminiEndpoint(), ...envEndpoints(), ...envJsonEndpoints(), ...cloud, ...local, ...publicFallback()]
    // hcnsec: model "auto" adalah router ke backend sehat — pastikan selalu dicoba lebih dulu
    .map((e) =>
      /api\.hcnsec\.cn/.test(e.url)
        ? { ...e, models: ["auto", ...e.models.filter((m) => m !== "auto")] }
        : e,
    )
    // endpoint yang terbukti sehat (hcnsec) dicoba sebelum yang flaky (bynara)
    .sort((a, b) => Number(/api\.hcnsec\.cn/.test(b.url)) - Number(/api\.hcnsec\.cn/.test(a.url)))
  return all.filter((e) => {
    const id = `${e.url}|${e.key}`
    if (seen.has(id)) return false
    seen.add(id)
    return true
  })
}

const aiFailCache = new Map<string, number>()

/** Tandai endpoint gagal — dilewati 60 detik berikutnya agar request tidak menunggu */
export function markEndpointFailed(url: string) {
  aiFailCache.set(url, Date.now())
}

export function shouldSkipEndpoint(url: string): boolean {
  const t = aiFailCache.get(url)
  if (!t) return false
  if (Date.now() - t < 60_000) return true
  aiFailCache.delete(url)
  return false
}

/** Daftar endpoint dengan key disembunyikan — untuk debug/monitoring */
export function getAIEndpointInfo(): { provider: string; url: string; keyHint: string; models: string[] }[] {
  return getAIEndpoints().map((e) => ({
    provider: e.provider,
    url: e.url,
    keyHint: `${e.key.slice(0, 8)}...${e.key.slice(-4)}`,
    models: e.models,
  }))
}