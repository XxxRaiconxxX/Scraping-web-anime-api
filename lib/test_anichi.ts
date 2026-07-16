import assert from "node:assert/strict"
import { anichiInfo, anichiSearch, anichiServers } from "./scrapers/anichi"

async function selfCheck() {
  const results = await anichiSearch("Solo Leveling")
  assert.ok(results.length > 0, "AniChi search returned no results")

  const series = results.find((result) => result.title === "Solo Leveling") || results[0]
  const detail = await anichiInfo(series.id)
  assert.equal(detail.id, series.id)
  assert.ok(detail.title.length > 0, "AniChi detail has no title")
  assert.ok(detail.episodes.length > 0, "AniChi detail has no episodes")

  const servers = await anichiServers(detail.episodes[0].id)
  assert.ok(servers.length > 0, "AniChi episode has no servers")
  servers.forEach((server) => assert.match(server.link, /^https?:\/\//))

  const movie = await anichiInfo("black-butler-book-of-the-atlantic-piygp")
  assert.equal(movie.title, "Black Butler: Book of the Atlantic")
  assert.equal(movie.episodes.length, 1, "AniChi movie was not normalized as one episode")
  assert.equal(movie.episodes[0].number, "1")
  assert.notEqual(movie.description, "Sin sinopsis disponible.")

  console.log(
    `AniChi provider: OK (${results.length} results, ${detail.episodes.length} series episodes, ${movie.episodes.length} movie episode, ${servers.length} servers)`
  )
}

selfCheck().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
