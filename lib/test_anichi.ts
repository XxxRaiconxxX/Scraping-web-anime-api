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

  console.log(
    `AniChi provider: OK (${results.length} results, ${detail.episodes.length} episodes, ${servers.length} servers)`
  )
}

selfCheck().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
