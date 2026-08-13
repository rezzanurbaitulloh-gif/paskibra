import fs from "fs"
import os from "os"
import path from "path"

export interface AIEndpoint {
  url: string
  key: string
  models: string[]
}

interface RawEndpoint {
  url: string
  key: string
  models: string[]
}

const CONFIG_PATH = path.join(os.homedir(), ".config", "opencode", "opencode.json")

function readOpencodeConfig(): RawEndpoint[] {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, "utf8")
    const data = JSON.parse(raw)
    const out: RawEndpoint[] = []
    for (const provider of Object.values(data.provider || {})) {
      const p = provider as { options?: { baseURL?: string; apiKey?: string }; models?: Record<string, unknown> }
      const url = p?.options?.baseURL
      const key = p?.options?.apiKey
      const models = Object.keys(p?.models || {})
      if (!url || !key || models.length === 0) continue
      out.push({ url: url.replace(/\/+$/, ""), key, models })
    }
    return out
  } catch {
    return []
  }
}

function envEndpoints(): RawEndpoint[] {
  const out: RawEndpoint[] = []
  const push = (url: string, keys: string[], model: string) => {
    for (const key of keys) out.push({ url: url.replace(/\/+$/, ""), key, models: [model] })
  }
  push(
    process.env.NARA_BASE_URL || "https://router.bynara.id/v1",
    (process.env.NARA_KEYS || process.env.NEXT_PUBLIC_NARA_KEYS || "").split(",").filter(Boolean),
    process.env.NARA_MODEL || "mistral-large"
  )
  push(
    process.env.HCNSEC_BASE_URL || "https://api.hcnsec.cn/v1",
    (process.env.HCNSEC_KEYS || process.env.NEXT_PUBLIC_HCNSEC_KEYS || "").split(",").filter(Boolean),
    process.env.HCNSEC_MODEL || "DeepSeek-V4-Flash"
  )
  return out
}

export function getAIEndpoints(): AIEndpoint[] {
  const seen = new Set<string>()
  const config = readOpencodeConfig()
  const cloud = config.filter((e) => !/localhost|127\.0\.0\.1/.test(e.url))
  const local = config.filter((e) => /localhost|127\.0\.0\.1/.test(e.url))
  const all = [...envEndpoints(), ...cloud, ...local]
  return all.filter((e) => {
    const id = `${e.url}|${e.key}`
    if (seen.has(id)) return false
    seen.add(id)
    return true
  })
}