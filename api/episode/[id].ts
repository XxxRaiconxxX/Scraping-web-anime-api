import type { VercelRequest, VercelResponse } from "@vercel/node"
import { gogoanimeServers } from "../../lib/scrapers/gogoanime"
import { animeflvServers } from "../../lib/scrapers/animeflv"
import { animeflvoneServers } from "../../lib/scrapers/animeflvone"
import { tioanimeServers } from "../../lib/scrapers/tioanime"
import { veranimeonlineServers } from "../../lib/scrapers/veranimeonline"
import { anichiServers } from "../../lib/scrapers/anichi"
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
      case "anichi":
        servers = await anichiServers(
          id,
          typeof req.query.series === "string" ? req.query.series : undefined,
          typeof req.query.episode === "string" ? req.query.episode : undefined
        )
        break
      case "gogoanime":
        servers = await gogoanimeServers(id)
        break
      case "tioanime":
      case "monoschinos":
        servers = await tioanimeServers(id)
        break
      case "veranimeonline":
        servers = await veranimeonlineServers(id)
        break
      case "animeav1":
        const { animeav1Servers } = await import("../../lib/scrapers/animeav1")
        servers = await animeav1Servers(id)
        break
      case "jkanime":
        const { jkanimeServers } = await import("../../lib/scrapers/jkanime")
        servers = await jkanimeServers(id)
        break
      case "animeflvone":
        servers = await animeflvoneServers(id)
        break
      case "animeflv":
      default:
        servers = await animeflvServers(id)
        break
    }

    if (servers && typeof servers === "object" && !Array.isArray(servers)) {
      return ok(res, { source, episodeId: id, ...servers }, 120)
    }
    return ok(res, { source, episodeId: id, servers }, 120)
  } catch (err: any) {
    console.error("[episode/servers]", err.message)
    return fail(res, `No se encontraron servidores para: ${id} en ${source}`)
  }
}

