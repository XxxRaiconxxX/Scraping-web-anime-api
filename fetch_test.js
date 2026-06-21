const fs = require('fs');
const axios = require('axios');

(async () => {
  try {
    const { data: d1 } = await axios.get("https://animeav1.com/", { responseType: 'text', headers: { 'User-Agent': 'Mozilla/5.0' } });
    fs.writeFileSync("animeav1_utf8.html", d1, "utf8");
  } catch(e) { console.error("animeav1", e.message); }
  
  try {
    const { data: d2 } = await axios.get("https://jkanime.net/", { responseType: 'text', headers: { 'User-Agent': 'Mozilla/5.0' } });
    fs.writeFileSync("jkanime_utf8.html", d2, "utf8");
  } catch(e) { console.error("jkanime", e.message); }
})();
