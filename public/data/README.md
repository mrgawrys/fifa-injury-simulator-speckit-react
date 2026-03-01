# Data Assets

## players.json

- Source: EA SPORTS FC 25 DATABASE (Kaggle, nyagami)
- URL: https://www.kaggle.com/datasets/nyagami/ea-sports-fc-25-database-ratings-and-stats
- Snapshot date: TODO (placeholder data — run scripts/convert-players.mjs with real CSV)
- Coverage: Premier League placeholder (5 Liverpool FC players)
- Conversion: scripts/convert-players.mjs

## injury-profiles.json

- Source: Injuries from Transfermarkt.com (Figshare, Vermaut 2024)
- URL: https://figshare.com/articles/dataset/Injuries_from_Transfermarkt_com/25648788/2
- Snapshot date: TODO (placeholder data — run scripts/build-injury-profiles.mjs with real CSVs)
- Player ID mapping: dcaribou/transfermarkt-datasets (SHA: TODO)
- Build: scripts/build-injury-profiles.mjs
- Matched: 5/5 players (placeholder — 100%)

## Regenerating with real data

See `specs/001-injury-simulation/quickstart.md` for the full data preparation workflow.
