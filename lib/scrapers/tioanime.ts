import axios from "axios"
import * as cheerio from "cheerio"
import { AXIOS_CONFIG } from "../utils"

const BASE = "https://tioanime.com"

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
export async function tioanimeSearch(query: string): Promise<AnimeResult[]> {
  const url = `${BASE}/directorio?q=${encodeURIComponent(query)}`
  const { data } = await axios.get(url, AXIOS_CONFIG)
  const $ = cheerio.load(data)
  const results: AnimeResult[] = []

  $(".anime").each((_, el) => {
    const a = $(el).find("a")
    const href = a.attr("href") ?? ""
    const id = href.replace("/anime/", "").trim()
    const title = $(el).find(".title").text().trim()
    const image = $(el).find("img").attr("src") ?? ""

    results.push({
      id,
      title,
      image: image.startsWith("http") ? image : `${BASE}${image}`,
      type: "Anime",
      url: `${BASE}${href}`,
    })
  })

  return results
}

// ─── Info + lista de episodios ───────────────────────────────────────────────
export async function tioanimeInfo(animeId: string): Promise<AnimeInfo> {
  const url = `${BASE}/anime/${animeId}`
  const { data } = await axios.get(url, AXIOS_CONFIG)
  const $ = cheerio.load(data)

  const title = $("h1.title").text().trim()
  const image = $(".thumb img").attr("src") ?? ""
  const description = $(".sinopsis").text().trim()

  const genres: string[] = []
  $(".genres a").each((_, el) => {
    genres.push($(el).text().trim())
  })

  const status = $(".on-going, .finalizado").text().trim() || "Desconocido"
  const released = $(".year").text().trim() || "N/A"

  // TioAnime carga episodios vía un script JSON en el HTML
  const episodes: Episode[] = []
  const scripts = $("script")
  let episodesData: any[] = []

  scripts.each((_, script) => {
    const content = $(script).html() || ""
    if (content.includes("var episodes =")) {
      const match = content.match(/var episodes = (\[.*?\]);/)
      if (match) {
        episodesData = JSON.parse(match[1])
      }
    }
  })

  episodesData.forEach((ep) => {
    episodes.push({
      id: `${animeId}-${ep}`,
      number: ep.toString(),
    })
  })

  return {
    id: animeId,
    title,
    image: image.startsWith("http") ? image : `${BASE}${image}`,
    description,
    genres,
    status,
    released,
    episodes,
  }
}

// ─── Links de streaming ──────────────────────────────────────────────────────
export async function tioanimeServers(episodeId: string): Promise<Server[]> {
  const url = `${BASE}/ver/${episodeId}`
  const { data } = await axios.get(url, AXIOS_CONFIG)
  const $ = cheerio.load(data)
  
  const servers: Server[] = []
  const scripts = $("script")
  let videosData: any[] = []

  scripts.each((_, script) => {
    const content = $(script).html() || ""
    if (content.includes("var videos =")) {
      const match = content.match(/var videos = (\[.*?\]);/)
      if (match) {
        videosData = JSON.parse(match[1])
      }
    }
  })

  videosData.forEach((video) => {
    servers.push({
      name: video[0],
      link: video[1],
    })
  })

  return servers
}

// ─── Episodios recientes ──────────────────────────────────────────────────────
export async function tioanimeRecent() {
  const url = `${BASE}`
  const { data } = await axios.get(url, AXIOS_CONFIG)
  const $ = cheerio.load(data)
  const results: any[] = []

  $(".episode").each((_, el) => {
    const href = $(el).find("a").attr("href") ?? ""
    const id = href.replace("/ver/", "").trim()
    const title = $(el).find(".title").text().trim()
    const image = $(el).find("img").attr("src") ?? ""
    const epNum = id.split("-").pop() || "1"

    results.push({
      id: id.replace(`-${epNum}`, ""),
      episodeId: id,
      title,
      image: image.startsWith("http") ? image : `${BASE}${image}`,
      episodeNumber: epNum,
    })
  })

  return results
}
