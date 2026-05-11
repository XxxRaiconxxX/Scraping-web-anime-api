import axios from "axios"
import * as cheerio from "cheerio"
import { AXIOS_CONFIG } from "../utils"

const BASE = "https://www3.animeflv.net"

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
  const url = `${BASE}/browse?q=${encodeURIComponent(query)}`
  const { data } = await axios.get(url, AXIOS_CONFIG)
  const $ = cheerio.load(data)
  const results: AnimeResult[] = []

  $(".ListAnimes li").each((_, el) => {
    const href = $(el).find("a").attr("href") ?? ""
    const id = href.replace("/anime/", "").trim()
    if (!id) return
    
    results.push({
      id,
      title: $(el).find(".Title").text().trim(),
      image: $(el).find("img").attr("src") ?? "",
      type: $(el).find(".Type").text().trim(),
      url: `${BASE}${href}`,
    })
  })

  return results
}

// ─── Info + lista de episodios ───────────────────────────────────────────────
export async function animeflvInfo(animeId: string): Promise<AnimeInfo> {
  const url = `${BASE}/anime/${animeId}`
  const { data } = await axios.get(url, AXIOS_CONFIG)
  const $ = cheerio.load(data)

  const title = $(".Ficha .Title").text().trim()
  const image = `${BASE}${ $(".AnimeCover img").attr("src") ?? "" }`
  const description = $(".Description p").text().trim()

  const genres: string[] = []
  $(".Nvgnrs a").each((_, el) => {
    genres.push($(el).text().trim())
  })

  const status = $(".fa-tv").parent().text().trim()
  const released = $(".AnmStts span").text().trim()

  // AnimeFLV carga los episodios via un script embebido
  const scripts = $("script")
  let episodes: Episode[] = []

  scripts.each((_, script) => {
    const content = $(script).html() ?? ""
    if (content.includes("var episodes =")) {
      // Extraer el array de episodios usando regex simple
      const epMatch = content.match(/var episodes = (\[.*\]);/)
      const infoMatch = content.match(/var anime_info = (\[.*\]);/)
      
      if (epMatch && infoMatch) {
        const epData = JSON.parse(epMatch[1])
        const infoData = JSON.parse(infoMatch[1]) // [id, title, slug]
        const animeSlug = infoData[2]

        episodes = epData.map((ep: any) => ({
          id: `${animeSlug}-${ep[0]}`,
          number: ep[0].toString()
        }))
      }
    }
  })

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

// ─── Links de streaming ──────────────────────────────────────────────────────
export async function animeflvServers(episodeId: string): Promise<Server[]> {
  // episodeId suele ser "slug-numero"
  const parts = episodeId.split("-")
  const epNum = parts.pop()
  const slug = parts.join("-")
  
  const url = `${BASE}/ver/${slug}-${epNum}`
  const { data } = await axios.get(url, AXIOS_CONFIG)
  const $ = cheerio.load(data)
  
  const scripts = $("script")
  let servers: Server[] = []

  scripts.each((_, script) => {
    const content = $(script).html() ?? ""
    if (content.includes("var videos =")) {
      const videoMatch = content.match(/var videos = (\{.*\});/)
      if (videoMatch) {
        const videoData = JSON.parse(videoMatch[1])
        // videoData tiene { "SUB": [ {server: '...', code: '...'}, ... ] }
        if (videoData.SUB) {
          servers = videoData.SUB.map((v: any) => ({
            name: v.server,
            link: v.code.includes("http") ? v.code : `https://www3.animeflv.net/video/${v.code}` 
          }))
        }
      }
    }
  })

  return servers
}

// ─── Episodios recientes ──────────────────────────────────────────────────────
export async function animeflvRecent() {
  const url = `${BASE}`
  const { data } = await axios.get(url, AXIOS_CONFIG)
  const $ = cheerio.load(data)
  const results: any[] = []

  $(".ListEpisodios li").each((_, el) => {
    const href = $(el).find("a").attr("href") ?? ""
    const idParts = href.replace("/ver/", "").split("-")
    const epNum = idParts.pop()
    const animeId = idParts.join("-")

    results.push({
      id: animeId,
      episodeId: href.replace("/ver/", ""),
      title: $(el).find(".Title").text().trim(),
      image: $(el).find("img").attr("src") ?? "",
      episodeNumber: epNum,
    })
  })

  return results
}
