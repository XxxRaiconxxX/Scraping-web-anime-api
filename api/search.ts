import type { VercelRequest, VercelResponse } from "@vercel/node"
import { gogoanimeSearch } from "../lib/scrapers/gogoanime"
import { animeflvSearch } from "../lib/scrapers/animeflv"
import { ok, fail, handleCors } from "../lib/utils"

// GET /api/search?q=naruto&source=animeflv
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return

  const { q, source = "animeflv" } = req.query

  if (!q || typeof q !== "string") {
    return fail(res, "Parámetro 'q' requerido", 400)
  }

  try {
    let results

    switch (source) {
      case "gogoanime":
        results = await gogoanimeSearch(q)
        break
      case "animeflv":
      default:
        results = await animeflvSearch(q)
        break
    }

    return ok(res, { source, query: q, results }, 180)
  } catch (err: any) {
    console.error("[search]", err.message)
    return fail(res, `Error al scrapear resultados de ${source}: ${err.message}`)
  }
}

