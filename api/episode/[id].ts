import type { VercelRequest, VercelResponse } from "@vercel/node"
import { gogoanimeServers } from "../../../lib/scrapers/gogoanime"
import { ok, fail, handleCors } from "../../../lib/utils"

// GET /api/episode/[id]?source=gogoanime
// Ejemplo: /api/episode/naruto-shippuden-episode-1
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return

  const { id, source = "gogoanime" } = req.query

  if (!id || typeof id !== "string") {
    return fail(res, "ID de episodio requerido", 400)
  }

  try {
    let servers

    switch (source) {
      case "gogoanime":
      default:
        servers = await gogoanimeServers(id)
        break
    }

    return ok(res, { source, episodeId: id, servers }, 120)
  } catch (err: any) {
    console.error("[episode/servers]", err.message)
    return fail(res, `No se encontraron servidores para: ${id}`)
  }
}
