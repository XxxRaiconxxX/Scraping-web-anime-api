import type { VercelRequest, VercelResponse } from "@vercel/node"
import { gogoanimeRecent } from "../../lib/scrapers/gogoanime"
import { ok, fail, handleCors } from "../../lib/utils"

// GET /api/recent?page=1&type=1&source=gogoanime
// type: 1=SUB, 2=DUB, 3=CN
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return

  const {
    page = "1",
    type = "1",
    source = "gogoanime",
  } = req.query

  try {
    let results

    switch (source) {
      case "gogoanime":
      default:
        results = await gogoanimeRecent(Number(page), Number(type))
        break
    }

    return ok(res, { source, page: Number(page), results }, 60)
  } catch (err: any) {
    console.error("[recent]", err.message)
    return fail(res, "Error al obtener episodios recientes")
  }
}
