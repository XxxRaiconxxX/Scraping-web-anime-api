import axios from "axios"
import * as cheerio from "cheerio"
import { AXIOS_CONFIG } from "../utils"

const BASE = "https://anichi.to"

type AjaxHtmlPayload = {
  status?: number
  result?: unknown
  message?: unknown
}

type AjaxServerPayload = {
  status?: number
  result?: {
    url?: unknown
  }
  message?: unknown
}

export interface AnimeResult {
  id: string
  title: string
  image: string
  type?: string
  year?: string
  url: string
}

export interface Episode {
  id: string
  number: string
  title?: string
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
  year?: string
  score?: string
  totalEpisodes: number
  episodes: Episode[]
  url: string
}

function requestOptions(referer = `${BASE}/`) {
  return {
    timeout: AXIOS_CONFIG.timeout,
    headers: {
      ...AXIOS_CONFIG.headers,
      Accept: "application/json, text/javascript, */*; q=0.01",
      Referer: referer,
      "X-Requested-With": "XMLHttpRequest",
    },
  }
}

function pageRequestOptions() {
  return {
    timeout: AXIOS_CONFIG.timeout,
    headers: {
      ...AXIOS_CONFIG.headers,
      Referer: `${BASE}/`,
    },
  }
}

function ajaxHtml(payload: AjaxHtmlPayload, operation: string) {
  const result =
    typeof payload.result === "string"
      ? payload.result
      : payload.result && typeof payload.result === "object" && "html" in payload.result
        ? (payload.result as { html?: unknown }).html
        : null

  if (payload.status !== 200 || typeof result !== "string") {
    const message = typeof payload.message === "string" ? payload.message : "respuesta invalida"
    throw new Error(`AniChi ${operation}: ${message}`)
  }
  return result
}

function safeHttpUrl(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null
  try {
    const url = new URL(value.trim(), BASE)
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null
  } catch {
    return null
  }
}

function animeSlug(value: unknown) {
  const url = safeHttpUrl(value)
  if (!url) return null

  const parsed = new URL(url)
  if (parsed.origin !== BASE || !parsed.pathname.startsWith("/anime/")) return null

  try {
    const slug = decodeURIComponent(parsed.pathname.slice("/anime/".length)).replace(/\/$/, "")
    return slug && !slug.includes("/") && !slug.includes("..") ? slug : null
  } catch {
    return null
  }
}

export async function anichiSearch(query: string): Promise<AnimeResult[]> {
  const keyword = query.trim()
  if (keyword.length < 2) return []

  const { data } = await axios.get<AjaxHtmlPayload>(`${BASE}/ajax/anime/search`, {
    ...requestOptions(),
    params: { keyword },
  })
  const $ = cheerio.load(ajaxHtml(data, "search"))
  const results = new Map<string, AnimeResult>()

  $("a.aitem.tip").each((_, element) => {
    const item = $(element)
    const href = safeHttpUrl(item.attr("href"))
    const id = animeSlug(href)
    const title = item.find(".d-title").first().text().trim() || item.find("img").attr("alt")?.trim()
    const image = safeHttpUrl(item.find("img").attr("src") || item.find("img").attr("data-src"))
    if (!id || !href || !title || !image) return

    const info = item.find(".info").text().replace(/\s+/g, " ").trim()
    results.set(id, {
      id,
      title,
      image,
      type: item.find(".info b").first().text().trim() || "Anime",
      year: info.match(/\b(?:19|20)\d{2}\b/)?.[0],
      url: href,
    })
  })

  return [...results.values()]
}

async function fetchAniChiInfo(id: string, url: string): Promise<AnimeInfo> {
  const { data: page } = await axios.get<string>(url, pageRequestOptions())
  const $ = cheerio.load(page)
  const title = $("h1.series-title").first().text().trim()
  const image = safeHttpUrl($(".series-intro__poster img").first().attr("src"))
  const internalId = $(".series-fav[data-id]").first().attr("data-id")?.trim()
  if (!title || !image || !internalId) throw new Error("AniChi no entrego una ficha valida")

  const facts = new Map<string, string>()
  $(".series-fact").each((_, element) => {
    const label = $(element).find(".series-fact__label").text().trim().toLowerCase()
    const value = $(element).find(".series-fact__value").text().replace(/\s+/g, " ").trim()
    if (label && value) facts.set(label, value)
  })

  const { data: episodePayload } = await axios.get<AjaxHtmlPayload>(
    `${BASE}/ajax/episode/list/${encodeURIComponent(internalId)}`,
    requestOptions(url)
  )
  const $episodes = cheerio.load(ajaxHtml(episodePayload, "episodes"))
  const episodes: Episode[] = []
  const seenEpisodes = new Set<string>()

  $episodes("a[data-ids]").each((index, element) => {
    const item = $episodes(element)
    const episodeId = item.attr("data-ids")?.trim()
    const number = item.attr("data-num")?.trim() || item.attr("data-slug")?.trim() || String(index + 1)
    if (!episodeId || seenEpisodes.has(episodeId)) return
    seenEpisodes.add(episodeId)
    episodes.push({
      id: episodeId,
      number,
      title: item.find(".d-title").first().text().trim() || `Episodio ${number}`,
    })
  })

  const released = facts.get("aired") || facts.get("premiered") || "N/A"
  const genres = $(".series-genres__list a, .series-genre")
    .map((_, element) => $(element).text().trim())
    .get()
    .filter((genre, index, values) => Boolean(genre) && values.indexOf(genre) === index)

  return {
    id,
    title,
    image,
    description:
      $(".series-blurb__full").first().text().replace(/\s+/g, " ").trim() ||
      $(".series-blurb__short").first().text().replace(/\s+/g, " ").trim() ||
      "Sin sinopsis disponible.",
    genres,
    status: facts.get("status") || "Desconocido",
    released,
    year: released.match(/\b(?:19|20)\d{2}\b/)?.[0],
    score: $(".series-score").first().text().trim() || facts.get("mal"),
    totalEpisodes: episodes.length,
    episodes,
    url,
  }
}

export async function anichiInfo(animeId: string): Promise<AnimeInfo> {
  const id = animeId.trim()
  if (!id || id.includes("/") || id.includes("..")) throw new Error("ID de AniChi invalido")

  const url = `${BASE}/anime/${encodeURIComponent(id)}`
  try {
    return await fetchAniChiInfo(id, url)
  } catch {
    // ponytail: one retry absorbs transient AniChi HTML/AJAX responses; repeated failures stay visible.
    return fetchAniChiInfo(id, url)
  }
}

export async function anichiServers(
  episodeId: string,
  series?: string,
  episode?: string
): Promise<Server[]> {
  const ids = episodeId.trim()
  if (!ids || ids.length > 4096) throw new Error("ID de episodio AniChi invalido")

  if (series && episode) {
    return [
      {
        name: "Ver en AniChi (Reproductor Oficial)",
        link: `${BASE}/watch/${encodeURIComponent(series)}?ep=${encodeURIComponent(episode)}`,
      },
    ]
  }

  const { data: listPayload } = await axios.get<AjaxHtmlPayload>(`${BASE}/ajax/server/list`, {
    ...requestOptions(),
    params: { servers: ids },
  })
  const $ = cheerio.load(ajaxHtml(listPayload, "servers"))
  const candidates: Array<{ linkId: string; name: string }> = []
  const seen = new Set<string>()

  $(".type[data-type]").each((_, group) => {
    const type = ($(group).attr("data-type") || "stream").trim().toUpperCase()
    $(group).find("[data-link-id]").each((__, element) => {
      const item = $(element)
      const linkId = item.attr("data-link-id")?.trim()
      const label = item.text().replace(/\s+/g, " ").trim() || "Servidor"
      const key = `${type}:${linkId}`
      if (!linkId || seen.has(key)) return
      seen.add(key)
      candidates.push({ linkId, name: `${label} (${type})` })
    })
  })

  // ponytail: cap request fan-out; raise it only if AniChi publishes a batch API.
  const resolved = await Promise.allSettled(
    candidates.slice(0, 12).map(async ({ linkId, name }) => {
      const directLink = safeHttpUrl(linkId)
      if (directLink) return { name, link: directLink }

      const { data } = await axios.get<AjaxServerPayload>(`${BASE}/ajax/server`, {
        ...requestOptions(),
        params: { get: linkId },
      })
      const link = data.status === 200 ? safeHttpUrl(data.result?.url) : null
      if (!link) throw new Error(`AniChi no resolvio ${name}`)
      return { name, link }
    })
  )

  return resolved
    .filter((result): result is PromiseFulfilledResult<Server> => result.status === "fulfilled")
    .map((result) => result.value)
}
