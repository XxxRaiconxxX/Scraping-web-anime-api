import { jkanimeInfo } from './lib/scrapers/jkanime';

async function main() {
  const info = await jkanimeInfo('one-piece-3d2y-ace-no-shi-wo-koete-luffy-nakama-tono-chikai');
  console.log(JSON.stringify(info, null, 2));
}

main();
