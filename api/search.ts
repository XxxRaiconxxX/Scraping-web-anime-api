import type { VercelRequest, VercelResponse } from "@vercel/node"
import { gogoanimeSearch } from "../../lib/scrapers/gogoanime"
import { ok, fail, handleCors } from "../../lib/utils"

// GET /api/search?q=naruto&source=gogoanime
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return

  const { q, source = "gogoanime" } = req.query

  if (!q || typeof q !== "string") {
    return fail(res, "Parámetro 'q' requerido", 400)
  }

  try {
    let results

    switch (source) {
      case "gogoanime":
      default:
        results = await gogoanimeSearch(q)
        break
    }

    return ok(res, { source, query: q, results }, 180)
  } catch (err: any) {
    console.error("[search]", err.message)
    return fail(res, "Error al scrapear resultados")
  }
}
