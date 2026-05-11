import type { VercelRequest, VercelResponse } from "@vercel/node"

// ─── Headers comunes para evitar bloqueos ───────────────────────────────────
export const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Accept-Encoding": "gzip, deflate, br",
  Connection: "keep-alive",
}

// ─── Respuesta de éxito ──────────────────────────────────────────────────────
export function ok(res: VercelResponse, data: unknown, maxAge = 300) {
  res.setHeader("Cache-Control", `s-maxage=${maxAge}, stale-while-revalidate`)
  return res.status(200).json({ success: true, data })
}

// ─── Respuesta de error ──────────────────────────────────────────────────────
export function fail(res: VercelResponse, message: string, status = 500) {
  return res.status(status).json({ success: false, error: message })
}

// ─── CORS preflight ──────────────────────────────────────────────────────────
export function handleCors(req: VercelRequest, res: VercelResponse): boolean {
  if (req.method === "OPTIONS") {
    res.status(200).end()
    return true
  }
  return false
}
