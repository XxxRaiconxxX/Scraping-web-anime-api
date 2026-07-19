import axios from "axios"
import * as cheerio from "cheerio"
import { AXIOS_CONFIG } from "../utils"

const BASE = "https://vww.animeflv.one"

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

function hex2a(hex: string): string {
  let str = ""
  for (let i = 0; i < hex.length; i += 2) {
    str += String.fromCharCode(parseInt(hex.substr(i, 2), 16))
  }
  return str
}

// ─── Buscar anime ────────────────────────────────────────────────────────────
export async function animeflvoneSearch(query: string): Promise<AnimeResult[]> {
  const url = `${BASE}/animes?buscar=${encodeURIComponent(query)}`
  const { data } = await axios.get(url, AXIOS_CONFIG)
  const $ = cheerio.load(data)
  const results: AnimeResult[] = []

  $(".ul .li").each((_, el) => {
    const a = $(el).find(".h a")
    if (!a.length) return

    const href = a.attr("href") ?? ""
    const id = href.replace("./anime/", "").replace("/anime/", "").replace(/^\.\//, "").trim()
    if (!id) return

    const title = a.text().trim()
    let image = $(el).find("img").attr("data-src") || $(el).find("img").attr("src") || ""
    if (image.startsWith("./")) {
      image = BASE + image.substring(1)
    } else if (image.startsWith("/")) {
      image = BASE + image
    }

    results.push({
      id,
      title,
      image,
      type: "Anime",
      url: BASE + href.replace(/^\./, ""),
    })
  })

  return results
}

// ─── Info + lista de episodios ───────────────────────────────────────────────
export async function animeflvoneInfo(animeId: string): Promise<AnimeInfo> {
  const url = `${BASE}/anime/${animeId}`
  const { data } = await axios.get(url, AXIOS_CONFIG)
  const $ = cheerio.load(data)

  // Remover " Anime" del final del título si está presente
  const title = $(".info-t .ti h2").text().trim().replace(/\s*Anime$/, "")
  
  let image = $(".info-l .i img").attr("data-src") || $(".info-l .i img").attr("src") || ""
  if (image.startsWith("./")) {
    image = BASE + image.substring(1)
  } else if (image.startsWith("/")) {
    image = BASE + image
  }

  const description = $(".info-r .tx p").text().trim()

  const genres: string[] = []
  $(".info-r .gn li a").each((_, el) => {
    genres.push($(el).text().trim())
  })

  const status = "Disponible"
  const released = "N/D"

  // Buscar episodios en las variables script (var eps = [...])
  let episodes: Episode[] = []
  
  let epsVar: any[] = []
  let slVar = animeId

  $("script").each((_, el) => {
    const code = $(el).html() || ""
    if (code.includes("var eps =") || code.includes("var sl =")) {
      // Intentar extraer el array eps
      const epsMatch = code.match(/var eps\s*=\s*(\[\[[^]*?\]\]);/)
      if (epsMatch) {
        try {
          epsVar = JSON.parse(epsMatch[1])
        } catch (e) {
          console.error("[animeflvoneInfo] Error parsing eps JSON match:", e)
        }
      }
      // Intentar extraer el slug sl
      const slMatch = code.match(/var sl\s*=\s*["']([^"']+)["']/)
      if (slMatch) {
        slVar = slMatch[1]
      }
    }
  })

  if (epsVar.length > 0) {
    episodes = epsVar.map((ep: any) => {
      const epNum = ep[0].toString()
      const cod = ep[2] ? ep[2].toString() : ""
      // Hacemos que el ID del episodio sea la ruta relativa del episodio (ej: "ver/clevatess-ii-majuu-no-ou-to-itsuwari-no-yuusha-denshou-2")
      const id = `ver/${slVar}-${epNum}${cod ? `-${cod}` : ""}`
      return {
        id,
        number: epNum
      }
    })
    // Ordenar episodios por número ascendente
    episodes.sort((a, b) => Number(a.number) - Number(b.number))
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
export async function animeflvoneServers(episodeId: string): Promise<{ stream: Server[], download: Server[] }> {
  // Asegurar que episodeId empiece con "ver/"
  const cleanEpId = episodeId.startsWith("ver/") ? episodeId : `ver/${episodeId}`
  const url = `${BASE}/${cleanEpId}`
  const { data } = await axios.get(url, AXIOS_CONFIG)
  const $ = cheerio.load(data)
  
  const stream: Server[] = []
  const download: Server[] = []

  // 1. Obtener streams desde el POST AJAX a /flv
  const encrypt = $(".opt").attr("data-encrypt")
  if (encrypt) {
    try {
      const flvUrl = `${BASE}/flv`
      const { data: responseHtml } = await axios.post(
        flvUrl,
        `acc=opt&i=${encrypt}`,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "User-Agent": AXIOS_CONFIG.headers["User-Agent"],
            "Referer": url,
            "X-Requested-With": "XMLHttpRequest",
            "Origin": BASE,
            "Accept": "*/*"
          }
        }
      )

      if (responseHtml) {
        const $$ = cheerio.load(responseHtml)
        $$("li").each((_, el) => {
          const serverName = $$(el).find("span").text().trim() || $$(el).text().trim()
          const encryptedUrl = $$(el).attr("encrypt") ?? ""
          if (encryptedUrl) {
            const decryptedUrl = hex2a(encryptedUrl)
            stream.push({
              name: serverName,
              link: decryptedUrl
            })
          }
        })
      }
    } catch (err: any) {
      console.error("[animeflvoneServers] Error loading options from /flv POST:", err.message)
    }
  }

  // 2. Obtener descargas desde data-dwn de .dwn
  const dataDwn = $(".dwn").attr("data-dwn")
  if (dataDwn) {
    try {
      const urls: string[] = JSON.parse(dataDwn)
      urls.forEach((u) => {
        // Derivar nombre del servidor de la URL de descarga
        let serverName = "Descarga"
        try {
          const hostname = new URL(u).hostname.toLowerCase()
          if (hostname.includes("mega")) serverName = "Mega"
          else if (hostname.includes("doodstream") || hostname.includes("dood")) serverName = "Doodstream"
          else if (hostname.includes("voe")) serverName = "Voe"
          else if (hostname.includes("mixdrop")) serverName = "Mixdrop"
          else if (hostname.includes("mp4upload")) serverName = "Mp4Upload"
          else if (hostname.includes("streamwish") || hostname.includes("dhcplay")) serverName = "Streamwish"
          else if (hostname.includes("vidhide") || hostname.includes("movearnpre")) serverName = "Vidhide"
          else if (hostname.includes("filemoon") || hostname.includes("bysesukior")) serverName = "Filemoon"
          else if (hostname.includes("vidguard") || hostname.includes("listeamed")) serverName = "Vidguard"
          else {
            const parts = hostname.split(".")
            serverName = parts[parts.length - 2] || "Descarga"
          }
        } catch (e) {}

        download.push({
          name: serverName,
          link: u
        })
      })
    } catch (err: any) {
      console.error("[animeflvoneServers] Error parsing data-dwn JSON:", err.message)
    }
  }

  return { stream, download }
}

// ─── Episodios recientes ──────────────────────────────────────────────────────
export async function animeflvoneRecent(): Promise<any[]> {
  const url = `${BASE}`
  const { data } = await axios.get(url, AXIOS_CONFIG)
  const $ = cheerio.load(data)
  const results: any[] = []

  $(".ul.hm .li").each((_, el) => {
    const a = $(el).find("a")
    const href = a.attr("href") ?? ""
    // Filtrar para que solo sean episodios (los cuales van a /ver/) y no noticias
    if (!href.includes("/ver/")) return

    const relPath = href.replace(`${BASE}/`, "").replace(/^\.\//, "").replace(/^\//, "").trim()
    
    // Extraer animeSlug y epNum de la URL del episodio
    const lastPart = relPath.split("/").pop() ?? ""
    const parts = lastPart.split("-")
    const epNum = parts.pop() || "1"
    const animeId = parts.join("-") || lastPart.replace(/-\d+$/, "")

    const titleText = $(el).find(".i span").text().trim()

    let image = $(el).find("img").attr("data-src") || $(el).find("img").attr("src") || ""
    if (image.startsWith("./")) {
      image = BASE + image.substring(1)
    } else if (image.startsWith("/")) {
      image = BASE + image
    }

    results.push({
      id: animeId,
      episodeId: relPath,
      title: titleText,
      image,
      episodeNumber: epNum
    })
  })

  return results
}
