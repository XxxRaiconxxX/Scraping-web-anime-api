import type { VercelRequest, VercelResponse } from "@vercel/node"
import { gogoanimeServers } from "../../lib/scrapers/gogoanime"
import { animeflvServers } from "../../lib/scrapers/animeflv"
import { monoschinosServers } from "../../lib/scrapers/monoschinos"
import { ok, fail, handleCors, checkAuth } from "../../lib/utils"

// GET /api/episode/[id]?source=animeflv
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (!checkAuth(req, res)) return

  const { id, source = "animeflv" } = req.query

  if (!id || typeof id !== "string") {
    return fail(res, "ID de episodio requerido", 400)
  }

  try {
    let servers

    switch (source) {
      case "gogoanime":
        servers = await gogoanimeServers(id)
        break
      case "monoschinos":
        servers = await monoschinosServers(id)
        break
      case "animeflv":
      default:
        servers = await animeflvServers(id)
        break
    }

    return ok(res, { source, episodeId: id, servers }, 120)
  } catch (err: any) {
    console.error("[episode/servers]", err.message)
    return fail(res, `No se encontraron servidores para: ${id} en ${source}`)
  }
}

