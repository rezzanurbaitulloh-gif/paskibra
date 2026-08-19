/** Aman terhadap body kosong (mis. timeout serverless/proxy) — hindari "unexpected end of JSON input" */
export async function safeJson<T = Record<string, unknown>>(
  res: Response
): Promise<{ ok: boolean; status: number; data: T }> {
  const raw = await res.text()
  let data: T = {} as T
  if (raw) {
    try {
      data = JSON.parse(raw) as T
    } catch {
      data = {} as T
    }
  }
  return { ok: res.ok, status: res.status, data }
}