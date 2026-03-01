/**
 * convert-players.mjs
 *
 * Converts the FC 25 Kaggle CSV into public/data/players.json
 * filtered to Premier League players.
 *
 * Usage: node scripts/convert-players.mjs
 * Prerequisite: scripts/data-sources/fc25-players.csv (see quickstart.md)
 */
import { createReadStream } from 'fs'
import { writeFile, mkdir } from 'fs/promises'
import { parse } from 'csv-parse'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const INPUT = path.join(__dirname, 'data-sources/fc25-players.csv')
const OUTPUT = path.join(__dirname, '../public/data/players.json')

const POSITION_MAP = {
  GK: 'GK',
  CB: 'DEF', LB: 'DEF', RB: 'DEF', LWB: 'DEF', RWB: 'DEF',
  CDM: 'MID', CM: 'MID', CAM: 'MID', LM: 'MID', RM: 'MID',
  LW: 'FWD', RW: 'FWD', CF: 'FWD', ST: 'FWD',
}

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function mapPosition(raw) {
  const pos = raw?.trim() ?? 'MID'
  return POSITION_MAP[pos] ?? 'MID'
}

async function main() {
  const players = []
  const parser = createReadStream(INPUT).pipe(parse({ columns: true, skip_empty_lines: true }))

  for await (const row of parser) {
    const league = row['League'] ?? row['league'] ?? ''
    if (league !== 'Premier League') continue

    const rawPos = row['Position'] ?? row['Best Position'] ?? 'MID'
    const rawAlt = (row['Alternative Positions'] ?? '').split(',').map(p => p.trim()).filter(Boolean)

    const position = mapPosition(rawPos)
    const altPositions = [...new Set(rawAlt.map(mapPosition).filter(p => p !== position))]

    const teamName = row['Team'] ?? row['Club'] ?? 'Unknown'
    const name = row['Short Name'] ?? row['Name'] ?? row['Full Name'] ?? 'Unknown'
    const fullName = row['Full Name'] ?? row['Name'] ?? name

    players.push({
      id: slugify(`${name}-${teamName}`),
      fifaId: row['ID'] ?? slugify(name),
      name,
      fullName,
      age: parseInt(row['Age'] ?? '25', 10),
      position,
      altPositions,
      teamId: slugify(teamName),
      teamName,
      league: 'Premier League',
      nation: row['Nationality'] ?? row['Nation'] ?? 'Unknown',
      overallRating: parseInt(row['Overall'] ?? row['Rank'] ?? '70', 10),
    })
  }

  await mkdir(path.dirname(OUTPUT), { recursive: true })
  await writeFile(OUTPUT, JSON.stringify(players, null, 2))
  console.log(`✓ Wrote ${players.length} Premier League players to ${OUTPUT}`)
}

main().catch(err => { console.error(err); process.exit(1) })
