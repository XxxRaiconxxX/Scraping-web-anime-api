import axios from "axios"
import * as cheerio from "cheerio"
import { AXIOS_CONFIG } from "../utils"

const BASE = "https://monoschinos2.com"

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
export async function monoschinosSearch(query: string): Promise<AnimeResult[]> {
  const url = `${BASE}/buscar?q=${encodeURIComponent(query)}`
  const { data } = await axios.get(url, AXIOS_CONFIG)
  const $ = cheerio.load(data)
  const results: AnimeResult[] = []

  $(".heros .row .col-md-4, .row .col-md-3").each((_, el) => {
    const a = $(el).find("a")
    const href = a.attr("href") ?? ""
    if (!href.includes("/anime/")) return

    const id = href.replace(`${BASE}/anime/`, "").replace("/anime/", "").trim()
    const title = $(el).find("h3").text().trim()
    
    // La imagen suele estar en un div con background-image
    const style = $(el).find(".anime-card").attr("style") || ""
    const imgMatch = style.match(/url\(['"]?(.*?)['"]?\)/)
    const image = imgMatch ? imgMatch[1] : ""

    results.push({
      id,
      title,
      image,
      type: "Anime",
      url: href.startsWith("http") ? href : `${BASE}${href}`,
    })
  })

  return results
}

// ─── Info + lista de episodios ───────────────────────────────────────────────
export async function monoschinosInfo(animeId: string): Promise<AnimeInfo> {
  const url = `${BASE}/anime/${animeId}`
  const { data } = await axios.get(url, AXIOS_CONFIG)
  const $ = cheerio.load(data)

  const title = $("h1").text().trim()
  const image = $(".anime-image img").attr("src") ?? ""
  const description = $(".sinopsis").text().trim()

  const genres: string[] = []
  $(".genres a").each((_, el) => {
    genres.push($(el).text().trim())
  })

  const status = $(".status").text().trim() || "Desconocido"
  const released = $(".year").text().trim() || "N/A"

  const episodes: Episode[] = []
  // En MonosChinos los episodios están en enlaces con clase .ko
  $("a.ko").each((_, el) => {
    const href = $(el).attr("href") ?? ""
    const id = href.replace(`${BASE}/ver/`, "").replace("/ver/", "").trim()
    const numberMatch = $(el).find("h2").text().match(/\d+/)
    const number = numberMatch ? numberMatch[0] : episodes.length.toString()

    episodes.push({
      id,
      number
    })
  })

  return {
    id: animeId,
    title,
    image,
    description,
    genres,
    status,
    released,
    episodes: episodes.reverse(), // Suelen venir del último al primero
  }
}

// ─── Links de streaming ──────────────────────────────────────────────────────
export async function monoschinosServers(episodeId: string): Promise<Server[]> {
  const url = `${BASE}/ver/${episodeId}`
  const { data } = await axios.get(url, AXIOS_CONFIG)
  const $ = cheerio.load(data)
  
  const servers: Server[] = []

  // Los servidores están en botones .play-video con data-player
  $(".play-video").each((_, el) => {
    const name = $(el).text().trim()
    const playerBase64 = $(el).attr("data-player") ?? ""
    
    if (playerBase64) {
      try {
        const link = Buffer.from(playerBase64, 'base64').toString('utf-8')
        if (link.includes("http")) {
          servers.push({ name, link })
        }
      } catch (e) {
        console.error("Error decoding player link", e)
      }
    }
  })

  return servers
}

// ─── Episodios recientes ──────────────────────────────────────────────────────
export async function monoschinosRecent() {
  const url = `${BASE}`
  const { data } = await axios.get(url, AXIOS_CONFIG)
  const $ = cheerio.load(data)
  const results: any[] = []

  $(".sh_cap").each((_, el) => {
    const href = $(el).find("a").attr("href") ?? ""
    const id = href.replace(`${BASE}/ver/`, "").replace("/ver/", "").trim()
    
    // El id del anime suele estar en el slug antes del episodio
    // Pero en MonosChinos a veces el slug es diferente.
    // Usaremos el id completo para el episodio.
    
    const title = $(el).find(".sh_title").text().trim()
    const image = $(el).find("img").attr("src") ?? ""
    const epNum = $(el).find(".sh_episode").text().trim()

    results.push({
      id: id.split("-episodio-")[0],
      episodeId: id,
      title,
      image,
      episodeNumber: epNum,
    })
  })

  return results
}
