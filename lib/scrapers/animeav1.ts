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

const BASE_URL = "https://animeav1.com";

export async function animeav1Search(query: string): Promise<SearchResult[]> {
  try {
    const { data } = await axios.get(`${BASE_URL}/catalogo?search=${encodeURIComponent(query)}`, AXIOS_CONFIG);
    const $ = cheerio.load(data);
    const results: SearchResult[] = [];

    $("article").each((i, el) => {
      const title = $(el).find("h3").text().trim();
      const href = $(el).find("a").attr("href") || "";
      const img = $(el).find("img").attr("src") || "";
      
      const id = href.split("/media/")[1];
      if (title && id) {
        results.push({
          id,
          title,
          image: img.startsWith("http") ? img : (img ? `${BASE_URL}${img}` : ""),
          url: `${BASE_URL}${href}`
        });
      }
    });

    return results;
  } catch (error) {
    console.error("animeav1Search error:", error);
    return [];
  }
}

export async function animeav1Info(id: string): Promise<AnimeInfo | null> {
  try {
    const { data } = await axios.get(`${BASE_URL}/media/${id}`, AXIOS_CONFIG);
    const $ = cheerio.load(data);

    const title = $("h1").text().trim();
    if (!title) return null;

    const description = $(".entry p").first().text().trim();
    const image = $("figure img").first().attr("src") || "";
    
    // Parse the sveltekit payload for episode data if possible
    let episodes: any[] = [];
    const html = $.html();
    const svelteMatch = html.match(/\[\{.*\}\]/);
    if (svelteMatch) {
      try {
        const payload = JSON.parse(svelteMatch[0]);
        // Extract episodes logic from payload
        const findEpisodes = (obj: any) => {
          if (Array.isArray(obj)) {
            for (const item of obj) {
              if (item && item.id && item.number !== undefined) {
                // If it looks like an episode object: {id:2623, number:1}
                episodes.push({
                   id: `${id}/${item.number}`,
                   number: item.number,
                   title: `Episodio ${item.number}`
                });
              } else {
                findEpisodes(item);
              }
            }
          } else if (typeof obj === "object" && obj !== null) {
            for (const k in obj) {
              findEpisodes(obj[k]);
            }
          }
        };
        findEpisodes(payload);
        
        // Remove duplicates and sort
        const uniqueEps = new Map();
        episodes.forEach(ep => {
          if (!uniqueEps.has(ep.number)) {
             uniqueEps.set(ep.number, ep);
          }
        });
        episodes = Array.from(uniqueEps.values()).sort((a, b) => a.number - b.number);
      } catch (e) {
        console.error("Error parsing animeav1 Svelte data", e);
      }
    }
    
    // Fallback parsing HTML for episodes
    if (episodes.length === 0) {
       $("a[href^='/media/" + id + "/']").each((i, el) => {
          const href = $(el).attr("href") || "";
          const parts = href.split("/");
          const epNum = parts[parts.length - 1];
          if (epNum && !isNaN(Number(epNum))) {
            episodes.push({
              id: `${id}/${epNum}`,
              number: Number(epNum),
              title: `Episodio ${epNum}`
            });
          }
       });
       // Deduplicate
       const uniqueEps = new Map();
       episodes.forEach(ep => uniqueEps.set(ep.number, ep));
       episodes = Array.from(uniqueEps.values()).sort((a, b) => a.number - b.number);
    }

    return {
      id,
      title,
      description,
      image: image.startsWith("http") ? image : (image ? `${BASE_URL}${image}` : ""),
      episodes: episodes.map(e => ({
        id: e.id,
        number: e.number,
        title: e.title
      }))
    };
  } catch (error) {
    console.error("animeav1Info error:", error);
    return null;
  }
}

export async function animeav1Servers(id: string): Promise<EpisodeServer[]> {
  try {
    // animeav1 formats episode urls as /media/{id}/{epNum}
    const { data } = await axios.get(`${BASE_URL}/media/${id}`, AXIOS_CONFIG);
    const html = data;
    const servers: EpisodeServer[] = [];

    const svelteMatch = html.match(/\[\{.*\}\]/);
    if (svelteMatch) {
      const matchEmbeds = Array.from(svelteMatch[0].matchAll(/\{"server":"([^"]+)","url":"([^"]+)"\}/g) || []);
      // Some servers are unquoted in the JSON string representation
      const unquotedEmbeds = Array.from(svelteMatch[0].matchAll(/\{server:"([^"]+)",url:"([^"]+)"\}/g) || []);
      
      const allEmbeds = [...matchEmbeds, ...unquotedEmbeds];
      
      const seenUrls = new Set();
      allEmbeds.forEach((match: any) => {
        const name = match[1];
        const url = match[2];
        if (!seenUrls.has(url)) {
           seenUrls.add(url);
           servers.push({
             name: `AnimeAV1 - ${name}`,
             url
           });
        }
      });
    }

    return servers;
  } catch (error) {
    console.error("animeav1Servers error:", error);
    return [];
  }
}
