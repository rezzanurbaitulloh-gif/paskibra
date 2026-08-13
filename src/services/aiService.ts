"use client"

export async function streamResponse(prompt: string, onUpdate: (chunk: string) => void): Promise<string> {
  const response = await fetch("/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  })

  if (!response.ok) {
    let message = `HTTP error! status: ${response.status}`
    try {
      const data = await response.json()
      if (data?.error) message = data.error
    } catch {
      // abaikan
    }
    throw new Error(message)
  }

  if (!response.body) {
    throw new Error("Tidak ada response body")
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let result = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value, { stream: true })
    result += chunk
    onUpdate(chunk)
  }

  return result
}