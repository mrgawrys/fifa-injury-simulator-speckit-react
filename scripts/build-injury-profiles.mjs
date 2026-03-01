/**
 * build-injury-profiles.mjs
 *
 * Cross-references FC 25 player names with Transfermarkt injury data
 * to produce public/data/injury-profiles.json.
 *
 * Usage: node scripts/build-injury-profiles.mjs
 * Prerequisites:
 *   scripts/data-sources/tm-injuries.csv  (Figshare dataset)
 *   scripts/data-sources/tm-players.csv   (dcaribou/transfermarkt-datasets)
 *   public/data/players.json              (must run convert-players.mjs first)
 */
import { createReadStream } from 'fs'
import { writeFile, readFile } from 'fs/promises'
import { parse } from 'csv-parse'
import Fuse from 'fuse.js'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TM_INJURIES = path.join(__dirname, 'data-sources/tm-injuries.csv')
const TM_PLAYERS = path.join(__dirname, 'data-sources/tm-players.csv')
const FC25_PLAYERS = path.join(__dirname, '../public/data/players.json')
const OUTPUT = path.join(__dirname, '../public/data/injury-profiles.json')

async function parseCsv(filePath) {
  const rows = []
  const parser = createReadStream(filePath).pipe(parse({ columns: true, skip_empty_lines: true }))
  for await (const row of parser) rows.push(row)
  return rows
}

async function main() {
  console.log('Loading FC25 players...')
  const fc25Players = JSON.parse(await readFile(FC25_PLAYERS, 'utf8'))

  console.log('Loading Transfermarkt player index...')
  const tmPlayers = await parseCsv(TM_PLAYERS)

  console.log('Loading Transfermarkt injury history...')
  const tmInjuries = await parseCsv(TM_INJURIES)

  // Build Fuse.js index for fuzzy player name matching
  const fuse = new Fuse(tmPlayers, {
    keys: ['name', 'full_name', 'player_name'],
    threshold: 0.3,
    includeScore: true,
  })

  // Aggregate injury durations by Transfermarkt player_id
  const injuryDaysByTmId = new Map()
  for (const row of tmInjuries) {
    const tmId = String(row['player_id'] ?? row['playerId'] ?? '')
    if (!tmId) continue
    const days = parseInt(row['Days'] ?? row['days_missed'] ?? '0', 10)
    if (days > 0) {
      if (!injuryDaysByTmId.has(tmId)) injuryDaysByTmId.set(tmId, [])
      injuryDaysByTmId.get(tmId).push(days)
    }
  }

  let matched = 0
  const profiles = []

  for (const player of fc25Players) {
    const results = fuse.search(player.fullName, { limit: 1 })
    if (results.length === 0) continue
    const best = results[0]
    if ((best.score ?? 1) > 0.3) continue

    const tmPlayer = best.item
    const tmId = String(tmPlayer['player_id'] ?? tmPlayer['id'] ?? '')
    const injuries = injuryDaysByTmId.get(tmId) ?? []

    // Require at least 1 injury record
    if (injuries.length === 0) continue

    const meanDaysAbsent = injuries.reduce((a, b) => a + b, 0) / injuries.length
    // Estimate seasons: use injury count ÷ league average rate (2.0/season) with floor of 0.5
    const observedSeasons = Math.max(0.5, Math.round((injuries.length / 2.0) * 2) / 2)

    profiles.push({
      playerId: player.id,
      observedInjuries: injuries.length,
      observedSeasons,
      meanDaysAbsent: Math.round(meanDaysAbsent * 10) / 10,
    })

    matched++
  }

  await writeFile(OUTPUT, JSON.stringify(profiles, null, 2))
  console.log(`✓ Wrote ${profiles.length} profiles (${matched}/${fc25Players.length} matched) to ${OUTPUT}`)
}

main().catch(err => { console.error(err); process.exit(1) })
