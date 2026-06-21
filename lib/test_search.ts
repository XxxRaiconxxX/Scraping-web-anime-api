import * as fs from 'fs';
import * as cheerio from 'cheerio';

const html = fs.readFileSync('../jkanime_search.html', 'utf8');
const $ = cheerio.load(html);

console.log('anime__item', $('.anime__item').length);
console.log('custom_item2', $('.custom_item2').length);

console.log('HTML start:');
console.log(html.substring(0, 1000));
console.log('HTML end:');
console.log(html.substring(Math.max(0, html.length - 1000)));
