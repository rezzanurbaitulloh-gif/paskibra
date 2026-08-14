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

/** Baca SEMUA provider + apiKey + model dari config opencode saat ini */
function readOpencodeConfig(): RawEndpoint[] {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, "utf8")
    const data = JSON.parse(raw)
    const out: RawEndpoint[] = []
    for (const [name, provider] of Object.entries(data.provider || {})) {
      const p = provider as { options?: { baseURL?: string; apiKey?: string }; models?: Record<string, unknown> }
      const url = p?.options?.baseURL
      const key = p?.options?.apiKey
      const models = Object.keys(p?.models || {})
      if (!url || !key || models.length === 0) continue
      out.push({ url: url.replace(/\/+$/, ""), key, models, provider: name })
    }
    return out
  } catch {
    return []
  }
}

/** Tambahan dari env (jika ada key yang tidak ada di JSON) */
function envEndpoints(): RawEndpoint[] {
  const out: RawEndpoint[] = []
  const push = (provider: string, url: string, keys: string[], models: string[]) => {
    for (const key of keys) out.push({ url: url.replace(/\/+$/, ""), key, models, provider })
  }
  push(
    "env-nara",
    process.env.NARA_BASE_URL || "https://router.bynara.id/v1",
    (process.env.NARA_KEYS || process.env.NEXT_PUBLIC_NARA_KEYS || "").split(",").filter(Boolean),
    [(process.env.NARA_MODEL || "mistral-large")]
  )
  push(
    "env-hcnsec",
    process.env.HCNSEC_BASE_URL || "https://api.hcnsec.cn/v1",
    (process.env.HCNSEC_KEYS || process.env.NEXT_PUBLIC_HCNSEC_KEYS || "").split(",").filter(Boolean),
    [
      process.env.HCNSEC_MODEL || "DeepSeek-V4-Flash",
      "Qwen3-Coder-Next-FP8",
      "Qwen3.5-397B-A17B",
    ]
  )
  return out
}

export function getAIEndpoints(): AIEndpoint[] {
  const seen = new Set<string>()
  const config = readOpencodeConfig()
  const cloud = config.filter((e) => !/localhost|127\.0\.0\.1/.test(e.url))
  const local = config.filter((e) => /localhost|127\.0\.0\.1/.test(e.url))
  const all = [...cloud, ...envEndpoints(), ...local]
  return all.filter((e) => {
    const id = `${e.url}|${e.key}`
    if (seen.has(id)) return false
    seen.add(id)
    return true
  })
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