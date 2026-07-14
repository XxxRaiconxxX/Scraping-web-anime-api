import type { VercelRequest, VercelResponse } from "@vercel/node"

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
]

export function getHeaders() {
  return {
    "User-Agent": USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
    "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
    Connection: "keep-alive",
  }
}

export const AXIOS_CONFIG = {
  get headers() {
    return getHeaders()
  },
  timeout: 10000, // 10 segundos max para no exceder Vercel
}

// ─── Respuesta de éxito ──────────────────────────────────────────────────────
export function ok(res: VercelResponse, data: unknown, maxAge = 300) {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Cache-Control", `s-maxage=${maxAge}, stale-while-revalidate`)
  return res.status(200).json({ success: true, data })
}

// ─── Respuesta de error ──────────────────────────────────────────────────────
export function fail(res: VercelResponse, message: string, status = 500) {
  res.setHeader("Access-Control-Allow-Origin", "*")
  return res.status(status).json({ success: false, error: message })
}

// ─── Autenticación ──────────────────────────────────────────────────────────
export function checkAuth(req: VercelRequest, res: VercelResponse): boolean {
  const authHeader = req.headers.authorization || ""
  const token = authHeader.replace("Bearer ", "")
  const queryToken = Array.isArray(req.query.key) ? req.query.key[0] : req.query.key
  const expectedKey = process.env.ANIME_HUB_API_KEY || process.env.VITE_ANIME_HUB_API_KEY

  if (!expectedKey) {
    fail(res, "ANIME_HUB_API_KEY no esta configurada en el servidor.", 503)
    return false
  }

  if (token !== expectedKey && queryToken !== expectedKey) {
    fail(res, "No autorizado. API Key inválida.", 401)
    return false
  }
  return true
}

// ─── CORS preflight ──────────────────────────────────────────────────────────
export function handleCors(req: VercelRequest, res: VercelResponse): boolean {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")

  if (req.method === "OPTIONS") {
    res.status(200).end()
    return true
  }
  return false
}

