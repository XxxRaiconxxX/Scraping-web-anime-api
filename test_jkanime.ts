import axios from "axios";
import * as cheerio from "cheerio";

const BASE_URL = "https://jkanime.net";

async function testJk() {
  const detailUrl = `${BASE_URL}/boruto-naruto-next-generations/`;
  console.log("\n--- INFO:", detailUrl, "---");
  const { data: infoData } = await axios.get(detailUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const $ = cheerio.load(infoData);
  
  // Find anime_info
  const epScripts = $("script").toArray();
  for (const s of epScripts) {
    const html = $(s).html() || "";
    if (html.includes("var anime_info")) {
      const match = html.match(/var\s+anime_info\s*=\s*(\[.*?\]);/);
      if (match) {
        try {
          const episodes = JSON.parse(match[1]);
          console.log("Parsed episodes:", episodes.length);
          console.log(episodes[0]);
        } catch(e) {}
      }
    }
    // Also pagination logic: fetch from jkanime.net/{slug}/ajax/{page}/
    if (html.includes("function load_eps")) {
       console.log("Has paginated episodes logic!");
    }
  }

  // Usually JKAnime episodes are either all in anime_info or paginated via an endpoint.
  // We can look for `#episodes-list` elements.
  const epsList = $("#episodes-list a, .list-group-item a").toArray();
  console.log("Episodes in DOM:", epsList.length);
}

testJk().catch(console.error);
