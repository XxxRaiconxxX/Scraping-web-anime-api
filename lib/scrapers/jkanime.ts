import axios from "axios";
import * as cheerio from "cheerio";
import { AXIOS_CONFIG } from "../utils";

export interface SearchResult {
  id: string;
  title: string;
  image: string;
  url: string;
}

export interface AnimeInfo {
  id: string;
  title: string;
  description: string;
  image: string;
  episodes: {
    id: string;
    number: number;
    title: string;
  }[];
}

export interface EpisodeServer {
  name: string;
  url: string;
}

const BASE_URL = "https://jkanime.net";

export async function jkanimeSearch(query: string): Promise<SearchResult[]> {
  try {
    const { data } = await axios.get(`${BASE_URL}/buscar/${encodeURIComponent(query)}/`, AXIOS_CONFIG);
    const $ = cheerio.load(data);
    const results: SearchResult[] = [];

    $(".anime__item").each((i, el) => {
      const title = $(el).find("h5").text().trim();
      const href = $(el).find("a").attr("href") || "";
      const img = $(el).find(".anime__item__pic").attr("data-setbg") || "";
      
      const idMatch = href.match(/jkanime\.net\/([^\/]+)\//);
      if (title && idMatch && idMatch[1]) {
        results.push({
          id: idMatch[1],
          title,
          image: img,
          url: href
        });
      }
    });

    return results;
  } catch (error) {
    console.error("jkanimeSearch error:", error);
    return [];
  }
}

export async function jkanimeInfo(id: string): Promise<AnimeInfo | null> {
  try {
    const { data } = await axios.get(`${BASE_URL}/${id}/`, AXIOS_CONFIG);
    const $ = cheerio.load(data);

    const title = $(".anime__details__title h3").text().trim() || $(".anime_info h3").text().trim() || $("h1").text().trim();
    if (!title) return null;

    const description = $(".anime__details__text p").first().text().trim() || $(".anime_info .scroll").text().trim() || $(".sinopsis").text().trim();
    const image = $(".anime__details__pic").attr("data-setbg") || $(".anime_pic img").attr("src") || $("img").first().attr("src") || "";
    
    // In jkanime, episodes pagination is requested via ajax
    // But we can extract the last episode number if present
    const episodes: any[] = [];
    
    // Check if there is an anime_info array in script (for newer jkanime pages)
    const scripts = $("script").toArray();
    let foundEps = false;
    for (const s of scripts) {
       const html = $(s).html() || "";
       const match = html.match(/var\s+anime_info\s*=\s*(\[.*?\]);/);
       if (match) {
         try {
           const eps = JSON.parse(match[1]);
           for (const ep of eps) {
              episodes.push({
                id: `${id}/${ep.number}`,
                number: parseInt(ep.number, 10),
                title: `Episodio ${ep.number}`
              });
           }
           foundEps = true;
         } catch(e) {}
       }
    }

    if (!foundEps) {
      // Find the latest episode number from the link list (e.g. pagination or "1 - 10")
      let maxEp = 1;
      $("#pagination a").each((i, el) => {
         const text = $(el).text().trim();
         const match = text.match(/-\s*(\d+)/);
         if (match && parseInt(match[1]) > maxEp) {
           maxEp = parseInt(match[1]);
         }
      });
      // Fallback
      if (maxEp === 1) maxEp = 20; // arbitrary fallback for testing

      for (let i = 1; i <= maxEp; i++) {
        episodes.push({
          id: `${id}/${i}`,
          number: i,
          title: `Episodio ${i}`
        });
      }
    }

    return {
      id,
      title,
      description,
      image,
      episodes: episodes.sort((a, b) => a.number - b.number)
    };
  } catch (error) {
    console.error("jkanimeInfo error:", error);
    return null;
  }
}

export async function jkanimeServers(id: string): Promise<EpisodeServer[]> {
  try {
    // id could be e.g. "boruto-naruto-next-generations/1"
    // Just in case it's missing trailing slash:
    const url = id.endsWith("/") ? `${BASE_URL}/${id}` : `${BASE_URL}/${id}/`;
    const { data } = await axios.get(url, AXIOS_CONFIG);
    const $ = cheerio.load(data);
    const servers: EpisodeServer[] = [];

    const scripts = $("script").toArray();
    let videoArray: string[] = [];
    
    for (const s of scripts) {
      const html = $(s).html() || "";
      if (html.includes("var video = [];")) {
        // extract video[0] = '...'; video[1] = '...';
        const matches = html.matchAll(/video\[(\d+)\]\s*=\s*'([^']+)'/g);
        for (const m of matches) {
          const index = parseInt(m[1], 10);
          videoArray[index] = m[2];
        }
      }
    }

    $(".bg-servers a").each((i, el) => {
       const serverId = $(el).attr("data-id");
       const serverName = $(el).text().trim();
       if (serverId && videoArray[parseInt(serverId, 10)]) {
          const iframeHtml = videoArray[parseInt(serverId, 10)];
          const srcMatch = iframeHtml.match(/src="([^"]+)"/);
          if (srcMatch) {
             let url = srcMatch[1];
             if (url.startsWith("/")) {
                url = `${BASE_URL}${url}`;
             }
             servers.push({
                name: `JKAnime - ${serverName}`,
                url
             });
          }
       }
    });

    return servers;
  } catch (error) {
    console.error("jkanimeServers error:", error);
    return [];
  }
}
