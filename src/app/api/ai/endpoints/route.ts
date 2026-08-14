import { getAIEndpointInfo } from "@/lib/ai/providers"

export const runtime = "nodejs"

export async function GET() {
  return Response.json({
    total: getAIEndpointInfo().length,
    endpoints: getAIEndpointInfo(),
  })
}