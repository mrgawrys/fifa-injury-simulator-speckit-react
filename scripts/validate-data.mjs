/**
 * validate-data.mjs
 *
 * Validates public/data/players.json and public/data/injury-profiles.json
 * against the schemas defined in contracts/static-assets.md.
 *
 * Usage: node scripts/validate-data.mjs
 * Exits with code 1 if any violations are found.
 */
import { readFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PLAYERS_PATH = path.join(__dirname, '../public/data/players.json')
const PROFILES_PATH = path.join(__dirname, '../public/data/injury-profiles.json')

const VALID_POSITIONS = new Set(['GK', 'DEF', 'MID', 'FWD'])

async function main() {
  let errors = 0

  const players = JSON.parse(await readFile(PLAYERS_PATH, 'utf8'))
  const profiles = JSON.parse(await readFile(PROFILES_PATH, 'utf8'))
  const playerIds = new Set(players.map(p => p.id))

  console.log(`Validating ${players.length} players...`)
  for (const p of players) {
    if (!p.id || p.id.trim() === '') { console.error(`  ✗ Player missing id: ${p.name}`); errors++ }
    if (!VALID_POSITIONS.has(p.position)) { console.error(`  ✗ Invalid position '${p.position}' for ${p.name}`); errors++ }
    if (typeof p.age !== 'number' || p.age < 15 || p.age > 45) { console.error(`  ✗ Invalid age ${p.age} for ${p.name}`); errors++ }
    if (typeof p.overallRating !== 'number' || p.overallRating < 40 || p.overallRating > 99) {
      console.error(`  ✗ Invalid rating ${p.overallRating} for ${p.name}`); errors++
    }
    if (!p.teamId || !p.teamName) { console.error(`  ✗ Missing teamId/teamName for ${p.name}`); errors++ }
  }

  console.log(`Validating ${profiles.length} injury profiles...`)
  for (const p of profiles) {
    if (!playerIds.has(p.playerId)) { console.error(`  ✗ Profile playerId '${p.playerId}' not found in players.json`); errors++ }
    if (typeof p.observedSeasons !== 'number' || p.observedSeasons < 0.5) {
      console.error(`  ✗ observedSeasons < 0.5 for playerId ${p.playerId}`); errors++
    }
    if (typeof p.meanDaysAbsent !== 'number' || p.meanDaysAbsent < 1) {
      console.error(`  ✗ meanDaysAbsent < 1 for playerId ${p.playerId}`); errors++
    }
  }

  const teams = new Set(players.map(p => p.teamId))
  const matchPct = players.length > 0 ? ((profiles.length / players.length) * 100).toFixed(1) : '0.0'

  console.log(`\nSummary:`)
  console.log(`  players: ${players.length}`)
  console.log(`  teams: ${teams.size}`)
  console.log(`  profiles: ${profiles.length}/${players.length} matched (${matchPct}%)`)

  if (errors > 0) {
    console.error(`\n✗ ${errors} validation error(s) found`)
    process.exit(1)
  } else {
    console.log(`\n✓ All validations passed`)
  }
}

main().catch(err => { console.error(err); process.exit(1) })
