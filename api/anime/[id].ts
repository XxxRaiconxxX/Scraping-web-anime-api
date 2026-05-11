import type { VercelRequest, VercelResponse } from "@vercel/node"
import { gogoanimeInfo } from "../../../lib/scrapers/gogoanime"
import { ok, fail, handleCors } from "../../../lib/utils"

// GET /api/anime/[id]?source=gogoanime
// Ejemplo: /api/anime/naruto-shippuden
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return

  const { id, source = "gogoanime" } = req.query

  if (!id || typeof id !== "string") {
    return fail(res, "ID de anime requerido", 400)
  }

  try {
    let info

    switch (source) {
      case "gogoanime":
      default:
        info = await gogoanimeInfo(id)
        break
    }

    return ok(res, { source, ...info }, 600)
  } catch (err: any) {
    console.error("[anime/info]", err.message)
    return fail(res, `No se encontró el anime: ${id}`)
  }
}
