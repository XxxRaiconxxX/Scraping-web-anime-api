import type { VercelRequest, VercelResponse } from "@vercel/node"
import axios from "axios"
import { AXIOS_CONFIG, ok, fail } from "../lib/utils"

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { url } = req.query
  if (!url || typeof url !== "string") {
    return fail(res, "Missing url parameter", 400)
  }

  try {
    const { status, headers, data } = await axios.get(url, { 
      ...AXIOS_CONFIG, 
      validateStatus: () => true 
    })
    
    const bodyStr = typeof data === "string" ? data : JSON.stringify(data)
    const isCloudflare = bodyStr.toLowerCase().includes("cloudflare") || bodyStr.includes("Just a moment...")
    
    return ok(res, { 
      targetUrl: url,
      status, 
      server: headers["server"] || "unknown",
      isCloudflareBlocked: (status === 403 || status === 503) && isCloudflare,
      snippet: bodyStr.substring(0, 300)
    }, 0)
  } catch (err: any) {
    return fail(res, err.message, 500)
  }
}
