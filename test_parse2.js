const fs = require('fs');
const cheerio = require('cheerio');
const html = fs.readFileSync('../test_op.html', 'utf8');
const $ = cheerio.load(html);

console.log('Title: ', $(".anime__details__title h3").text().trim() || $("h1").text().trim() || $("h3").first().text().trim());
console.log('Episodes script matches:');
const scripts = $("script").toArray();
let foundEps = false;
for (const s of scripts) {
   const html = $(s).html() || "";
   const match = html.match(/var\s+anime_info\s*=\s*(\[.*?\]);/);
   if (match) {
     console.log('Found anime_info!', match[1]);
     foundEps = true;
   }
}
if (!foundEps) {
  let maxEp = 1;
  $("#pagination a").each((i, el) => {
    const text = $(el).text().trim();
    const match = text.match(/-\s*(\d+)/);
    if (match && parseInt(match[1]) > maxEp) {
      maxEp = parseInt(match[1]);
    }
  });
  console.log('MaxEp fallback:', maxEp);
}
