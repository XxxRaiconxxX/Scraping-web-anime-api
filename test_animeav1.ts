import axios from "axios";
import * as cheerio from "cheerio";

const BASE_URL = "https://animeav1.com";

async function testAv1() {
  const epUrl = `${BASE_URL}/media/naruto/1`;
  const { data: epData } = await axios.get(epUrl);
  const $ = cheerio.load(epData);
  
  const scripts = $("script").toArray();
  for (const s of scripts) {
    const html = $(s).html() || "";
    if (html.includes("iframe") || html.includes("video") || html.includes("file") || html.includes("source")) {
      const match = html.match(/"iframe","(.*?)","data"/);
      if (match) {
        console.log("Iframe embedded:", match[1]);
      }
      
      // Let's just dump the svelte array
      const svelteMatch = html.match(/\[\{.*\}\]/);
      if (svelteMatch) {
         try {
             const data = JSON.parse(svelteMatch[0]);
             // Find URLs
             const findUrls = (obj: any) => {
                 if (typeof obj === "string" && obj.startsWith("http")) console.log("URL:", obj);
                 else if (typeof obj === "object" && obj !== null) {
                     for (let k in obj) findUrls(obj[k]);
                 }
             };
             findUrls(data);
         } catch(e) {}
      }
    }
  }
}

testAv1().catch(console.error);
