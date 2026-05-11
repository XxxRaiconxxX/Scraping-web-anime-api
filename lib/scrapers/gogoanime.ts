import axios from "axios"
import * as cheerio from "cheerio"
import { BROWSER_HEADERS } from "../utils"

const BASE = "https://anitaku.pe"
const AJAX = "https://ajax.gogocdn.net"

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
export async function gogoanimeSearch(query: string): Promise<AnimeResult[]> {
  const url = `${BASE}/search.html?keyword=${encodeURIComponent(query)}`
  const { data } = await axios.get(url, { headers: BROWSER_HEADERS })
  const $ = cheerio.load(data)
  const results: AnimeResult[] = []

  $(".items li").each((_, el) => {
    const href = $(el).find("p.name a").attr("href") ?? ""
    const id = href.replace("/category/", "").trim()
    if (!id) return
    results.push({
      id,
      title: $(el).find("p.name a").text().trim(),
      image: $(el).find("img").attr("src") ?? "",
      released: $(el).find("p.released").text().replace("Released:", "").trim(),
      url: `${BASE}/category/${id}`,
    })
  })

  return results
}

// ─── Info + lista de episodios de un anime ───────────────────────────────────
export async function gogoanimeInfo(animeId: string): Promise<AnimeInfo> {
  const url = `${BASE}/category/${animeId}`
  const { data } = await axios.get(url, { headers: BROWSER_HEADERS })
  const $ = cheerio.load(data)

  const title = $(".anime_info_body_bg h1").text().trim()
  const image = $(".anime_info_body_bg img").attr("src") ?? ""
  const description = $("div.description").text().trim()

  const genres: string[] = []
  $('p.type a[href*="genre"]').each((_, el) => {
    genres.push($(el).text().trim())
  })

  const status = $('p.type:contains("Status")').find("a").text().trim()
  const released = $('p.type:contains("Released")').text().replace("Released:", "").trim()

  // IDs necesarios para el fetch de episodios
  const movieId = $("#movie_id").attr("value") ?? ""
  const alias = $("#alias_anime").attr("value") ?? ""
  const epEnd = $("#episode_page a").last().attr("ep_end") ?? "0"
  const epStart = $("#episode_page a").first().attr("ep_start") ?? "0"
  const totalEpisodes = parseInt(epEnd)

  // Fetch de la lista de episodios via endpoint AJAX de gogoanime
  const epRes = await axios.get(
    `${AJAX}/ajax/load-list-episode?ep_start=${epStart}&ep_end=${epEnd}&id=${movieId}&default_ep=0&alias=${alias}`,
    { headers: BROWSER_HEADERS }
  )
  const $ep = cheerio.load(epRes.data)
  const episodes: Episode[] = []

  $ep("#episode_related li").each((_, el) => {
    const epHref = $ep(el).find("a").attr("href")?.trim() ?? ""
    const epId = epHref.replace("/", "")
    const epNum = $ep(el).find(".name").text().replace("EP ", "").trim()
    if (epId) episodes.push({ id: epId, number: epNum })
  })

  episodes.reverse() // orden ascendente

  return {
    id: animeId,
    title,
    image,
    description,
    genres,
    status,
    released,
    totalEpisodes,
    episodes,
  }
}

// ─── Links de streaming de un episodio ──────────────────────────────────────
export async function gogoanimeServers(episodeId: string): Promise<Server[]> {
  const url = `${BASE}/${episodeId}`
  const { data } = await axios.get(url, { headers: BROWSER_HEADERS })
  const $ = cheerio.load(data)
  const servers: Server[] = []

  $(".anime_muti_link ul li").each((_, el) => {
    const name = $(el).attr("class") ?? "unknown"
    const link = $(el).find("a").attr("data-video") ?? ""
    if (link) servers.push({ name, link })
  })

  return servers
}

// ─── Episodios recientes ──────────────────────────────────────────────────────
export async function gogoanimeRecent(page = 1, type = 1) {
  const url = `${AJAX}/ajax/page-recent-release.html?page=${page}&type=${type}`
  const { data } = await axios.get(url, { headers: BROWSER_HEADERS })
  const $ = cheerio.load(data)
  const results: any[] = []

  $(".items li").each((_, el) => {
    const href = $(el).find("a").attr("href") ?? ""
    results.push({
      id: href.split("/")[1],
      episodeId: href.replace("/", ""),
      title: $(el).find(".name a").text().trim(),
      image: $(el).find("img").attr("src") ?? "",
      episodeNumber: $(el).find(".episode").text().trim(),
      subOrDub: href.includes("-dub") ? "DUB" : "SUB",
    })
  })

  return results
}
