import axios from "axios"
import * as cheerio from "cheerio"
import { AXIOS_CONFIG } from "../utils"

const BASE = "https://veranimeonline.co"

// ─── Tipos ───────────────────────────────────────────────────────────────────
export interface AnimeResult {
  id: string
  title: string
  image: string
  released?: string
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
  totalEpisodes: number
  episodes: Episode[]
}

// ─── Buscar anime ────────────────────────────────────────────────────────────
export async function veranimeonlineSearch(query: string): Promise<AnimeResult[]> {
  const url = `${BASE}/?s=${encodeURIComponent(query)}`
  const { data } = await axios.get(url, AXIOS_CONFIG)
  const $ = cheerio.load(data)
  const results: AnimeResult[] = []

  $("article.item").each((_, el) => {
    const href = $(el).find("a").attr("href") ?? ""
    if (!href) return

    // id will be the pathname without slashes e.g. "series/naruto" or "anime/naruto"
    const urlObj = new URL(href)
    let id = urlObj.pathname.replace(/^\/|\/$/g, "") 

    const title = $(el).find("h3").text().trim() || $(el).find("h4").text().trim() || $(el).find(".title").text().trim()
    const image = $(el).find("img").attr("src") || ""
    const released = $(el).find(".year").text().trim() || "Desconocido"

    results.push({
      id,
      title,
      image,
      released,
      url: href,
    })
  })

  return results
}

// ─── Info + lista de episodios de un anime ───────────────────────────────────
export async function veranimeonlineInfo(animeId: string): Promise<AnimeInfo> {
  const url = `${BASE}/${animeId}/`
  const { data } = await axios.get(url, AXIOS_CONFIG)
  const $ = cheerio.load(data)

  const title = $("h1").text().trim()
  const image = $(".poster img").attr("src") || ""
  const description = $(".wp-content p").first().text().trim() || $(".sheader .data .custom_fields").text().trim()

  const genres: string[] = []
  $(".sgeneros a").each((_, el) => {
    genres.push($(el).text().trim())
  })

  const status = "Desconocido"
  const released = $(".date").first().text().trim() || "Desconocido"

  const episodes: Episode[] = []
  $("#seasons ul.episodios li").each((_, el) => {
    const epHref = $(el).find(".episodiotitle a").attr("href")
    const epNum = $(el).find(".numerando").text().trim() || $(el).find(".episodiotitle a").text().trim()
    if (epHref) {
      const urlObj = new URL(epHref)
      const epId = urlObj.pathname.replace(/^\/|\/$/g, "")
      episodes.push({
        id: epId,
        number: epNum,
      })
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
    totalEpisodes: episodes.length,
    episodes,
  }
}

// ─── Links de streaming de un episodio ──────────────────────────────────────
export async function veranimeonlineServers(episodeId: string): Promise<Server[]> {
  const url = `${BASE}/${episodeId}/`
  const { data } = await axios.get(url, AXIOS_CONFIG)
  const $ = cheerio.load(data)
  const servers: Server[] = []

  // Extracción de iframes
  const iframes = $("iframe")
  iframes.each((i, el) => {
    const src = $(el).attr("src")
    if (src && src.includes("http")) {
      servers.push({
        name: `Server ${i + 1}`,
        link: src,
      })
    }
  })

  // Extracción de player options de Dooplay
  $("#playeroptions ul li").each((_, el) => {
    let urlAttr = $(el).attr("data-url") ?? $(el).attr("data-video")
    const title = $(el).find(".title").text().trim() || $(el).text().trim() || "Server"
    
    if (urlAttr) {
      // Aveces data-url es un hash en base64 en temas Dooplay/Toroplay
      // Si la URL no empieza con http o //, intentamos decodificar en base64
      if (!urlAttr.startsWith("http") && !urlAttr.startsWith("//")) {
        try {
          urlAttr = Buffer.from(urlAttr, "base64").toString("utf-8")
        } catch(e) {
          // ignore
        }
      }

      // Añadimos protocolo si es //
      if (urlAttr.startsWith("//")) {
         urlAttr = `https:${urlAttr}`
      }

      if (urlAttr.startsWith("http")) {
        servers.push({
          name: title,
          link: urlAttr
        })
      }
    }
  })

  // Des-duplicar
  const uniqueServers: Server[] = []
  const seenUrls = new Set()
  for (const s of servers) {
    if (!seenUrls.has(s.link)) {
      seenUrls.add(s.link)
      uniqueServers.push(s)
    }
  }

  return uniqueServers
}
