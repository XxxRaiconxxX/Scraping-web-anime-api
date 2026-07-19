import axios from "axios"
import * as cheerio from "cheerio"
import { AXIOS_CONFIG } from "../utils"

const BASE = "https://animeflv.or.at"

// ─── Tipos ───────────────────────────────────────────────────────────────────
export interface AnimeResult {
  id: string
  title: string
  image: string
  type?: string
  url: string
}

export interface Episode {
  id: string
  number: string
}

export interface Server {
  name: string
  link: string
}

export interface AnimeInfo {
  id: string
  title: string
  image: string
  description: string
  genres: string[]
  status: string
  released: string
  episodes: Episode[]
}

// ─── Buscar anime ────────────────────────────────────────────────────────────
export async function animeflvSearch(query: string): Promise<AnimeResult[]> {
  const url = `${BASE}/?s=${encodeURIComponent(query)}`
  const { data } = await axios.get(url, AXIOS_CONFIG)
  const $ = cheerio.load(data)
  const results: AnimeResult[] = []

  $(".search-series-card").each((_, el) => {
    const a = $(el).find("a.thumbnail-link")
    const href = a.attr("href") ?? ""
    const id = href.split("/anime/").pop()?.replace(/\/$/, "").trim() ?? ""
    if (!id) return

    const title = $(el).find(".entry-title").text().trim()
    const image = $(el).find("img.anime-image").attr("src") ?? ""

    results.push({
      id,
      title,
      image,
      type: "Anime",
      url: href,
    })
  })

  return results
}

// ─── Info + lista de episodios ───────────────────────────────────────────────
export async function animeflvInfo(animeId: string): Promise<AnimeInfo> {
  const url = `${BASE}/anime/${animeId}/`
  const { data } = await axios.get(url, AXIOS_CONFIG)
  const $ = cheerio.load(data)

  const title = $(".anime-title").text().trim()
  const image = $(".poster-image").attr("src") ?? ""
  
  // Obtener toda la sinopsis combinando los párrafos
  const description = $(".anime-synopsis p").map((_, el) => $(el).text().trim()).get().join("\n\n").trim()

  const genres: string[] = []
  $(".genre-tag").each((_, el) => {
    genres.push($(el).text().trim())
  })

  // Valores por defecto ya que no están presentes en el HTML del nuevo dominio
  const status = "Disponible"
  const released = "N/D"

  // Buscar episodios en el bloque de script JSON
  const dataNode = $(".animeflv-episodes-data")
  let episodes: Episode[] = []
  if (dataNode.length) {
    try {
      const episodesData = JSON.parse(dataNode.text() || "[]")
      episodes = episodesData.map((ep: any) => {
        const permalink = ep.permalink ?? ""
        // Hacemos que el ID del episodio sea la ruta relativa del permalink (ej: "2026/07/18/black-torch-episodio-3")
        const id = permalink.replace(`${BASE}/`, "").replace(/\/$/, "").trim()
        return {
          id,
          number: ep.number.toString()
        }
      })
      // Ordenar episodios por número ascendente
      episodes.sort((a, b) => Number(a.number) - Number(b.number))
    } catch (e) {
      console.error("[animeflvInfo] Error parsing episodes JSON:", e)
    }
  }

  return {
    id: animeId,
    title,
    image,
    description,
    genres,
    status,
    released,
    episodes,
  }
}

// ─── Links de streaming y descargas ──────────────────────────────────────────
export async function animeflvServers(episodeId: string): Promise<{ stream: Server[], download: Server[] }> {
  const url = `${BASE}/${episodeId}/`
  const { data } = await axios.get(url, AXIOS_CONFIG)
  const $ = cheerio.load(data)
  
  const stream: Server[] = []
  const download: Server[] = []

  // 1. Obtener streams desde botones con clase .iframe_btn
  $(".iframe_btn").each((_, el) => {
    const rawSrc = $(el).attr("data-src") ?? ""
    if (!rawSrc) return

    let decoded = ""
    try {
      // Decodificar Base64 a string
      decoded = Buffer.from(rawSrc, "base64").toString("utf-8")
    } catch (e) {
      decoded = rawSrc
    }

    // Nombre del servidor está en el elemento span hermano anterior
    const serverName = $(el).siblings(".tooltip-text").text().trim() || "Servidor"

    if (decoded) {
      stream.push({
        name: serverName,
        link: decoded
      })
    }
  })

  // 2. Obtener descargas desde la tabla styled-table
  $(".styled-table tbody tr").each((_, el) => {
    const cols = $(el).find("td")
    if (cols.length >= 4) {
      const serverName = $(cols[0]).text().trim()
      const downloadLink = $(cols[3]).find("a").attr("href") ?? ""
      
      if (downloadLink) {
        download.push({
          name: serverName,
          link: downloadLink
        })
      }
    }
  })

  return { stream, download }
}

// ─── Episodios recientes ──────────────────────────────────────────────────────
export async function animeflvRecent() {
  const url = `${BASE}`
  const { data } = await axios.get(url, AXIOS_CONFIG)
  const $ = cheerio.load(data)
  const results: any[] = []

  $(".Episode").each((_, el) => {
    const a = $(el).find("a")
    const href = a.attr("href") ?? ""
    const relPath = href.replace(`${BASE}/`, "").replace(/\/$/, "").trim()
    
    // Extraer animeSlug y epNum de la URL del episodio
    const lastPart = relPath.split("/").pop() ?? ""
    const parts = lastPart.split("-episodio-")
    const epNum = parts.pop() || "1"
    const animeId = parts.join("-episodio-") || lastPart.replace(/-episodio-\d+$/, "")

    results.push({
      id: animeId,
      episodeId: relPath,
      title: $(el).find(".Title").text().trim(),
      image: $(el).find("img").attr("src") ?? "",
      episodeNumber: epNum
    })
  })

  return results
}
