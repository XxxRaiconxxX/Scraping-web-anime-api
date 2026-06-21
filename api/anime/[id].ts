import type { VercelRequest, VercelResponse } from "@vercel/node"
import { gogoanimeInfo } from "../../lib/scrapers/gogoanime"
import { animeflvInfo } from "../../lib/scrapers/animeflv"
import { tioanimeInfo } from "../../lib/scrapers/tioanime"
import { veranimeonlineInfo } from "../../lib/scrapers/veranimeonline"
import { ok, fail, handleCors, checkAuth } from "../../lib/utils"

// GET /api/anime/[id]?source=animeflv
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (!checkAuth(req, res)) return

  const { id, source = "animeflv" } = req.query

  if (!id || typeof id !== "string") {
    return fail(res, "ID de anime requerido", 400)
  }

  try {
    let info

    switch (source) {
      case "gogoanime":
        info = await gogoanimeInfo(id)
        break
      case "tioanime":
      case "monoschinos":
        info = await tioanimeInfo(id)
        break
      case "veranimeonline":
        info = await veranimeonlineInfo(id)
        break
      case "animeflv":
      default:
        info = await animeflvInfo(id)
        break
    }

    return ok(res, { source, ...info }, 600)
  } catch (err: any) {
    console.error("[anime/info]", err.message)
    return fail(res, `No se encontró el anime: ${id} en ${source}`)
  }
}

