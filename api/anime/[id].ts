import type { VercelRequest, VercelResponse } from "@vercel/node"
import { gogoanimeInfo } from "../../lib/scrapers/gogoanime"
import { animeflvInfo } from "../../lib/scrapers/animeflv"
import { monoschinosInfo } from "../../lib/scrapers/monoschinos"
import { ok, fail, handleCors } from "../../lib/utils"

// GET /api/anime/[id]?source=animeflv
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return

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
      case "monoschinos":
        info = await monoschinosInfo(id)
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

