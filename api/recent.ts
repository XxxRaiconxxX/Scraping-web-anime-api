import type { VercelRequest, VercelResponse } from "@vercel/node"
import { gogoanimeRecent } from "../lib/scrapers/gogoanime"
import { animeflvRecent } from "../lib/scrapers/animeflv"
import { monoschinosRecent } from "../lib/scrapers/monoschinos"
import { ok, fail, handleCors } from "../lib/utils"

// GET /api/recent?page=1&type=1&source=animeflv
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return

  const {
    page = "1",
    type = "1",
    source = "animeflv",
  } = req.query

  try {
    let results

    switch (source) {
      case "gogoanime":
        results = await gogoanimeRecent(Number(page), Number(type))
        break
      case "monoschinos":
        results = await monoschinosRecent()
        break
      case "animeflv":
      default:
        results = await animeflvRecent()
        break
    }

    return ok(res, { source, page: Number(page), results }, 60)
  } catch (err: any) {
    console.error("[recent]", err.message)
    return fail(res, `Error al obtener episodios recientes de ${source}: ${err.message}`)
  }
}

