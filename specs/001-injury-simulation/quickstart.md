# Quickstart: FIFA Injury Simulation

**Date**: 2026-02-28

This guide covers: (1) one-time data preparation, (2) dev setup, (3) running the app.

---

## Prerequisites

- Node.js 20+ (LTS)
- pnpm 9+ (`npm install -g pnpm`)
- A free [Kaggle account](https://kaggle.com) (for the one-time data download)
- Git

---

## 1. One-Time Data Preparation

These steps are done once and the outputs are committed to the repository.
**Skip this section if `public/data/players.json` and `public/data/injury-profiles.json`
already exist in the repo.**

### 1a. Download the FC 25 player dataset

1. Log in to Kaggle.
2. Download the CSV from:
   https://www.kaggle.com/datasets/nyagami/ea-sports-fc-25-database-ratings-and-stats
3. Save as `scripts/data-sources/fc25-players.csv` (create the directory).

### 1b. Download the Transfermarkt injury dataset

**Option A (recommended):** Figshare dataset (107K injuries)
1. Download CSV from:
   https://figshare.com/articles/dataset/Injuries_from_Transfermarkt_com/25648788/2
2. Save as `scripts/data-sources/tm-injuries.csv`

**Option B:** GitHub raw CSV (CORS-accessible, fetchable directly)
```bash
curl -L "https://raw.githubusercontent.com/salimt/football-datasets/main/datalake/transfermarkt/raw/player_injury_histories/player_injury_histories.csv" \
  -o scripts/data-sources/tm-injuries.csv
```

### 1c. Download the Transfermarkt player ID mapping

```bash
curl -L "https://raw.githubusercontent.com/dcaribou/transfermarkt-datasets/master/data/players_clean.csv" \
  -o scripts/data-sources/tm-players.csv
```

### 1d. Run the conversion scripts

```bash
# Install script dependencies (separate from the app)
cd scripts && npm install && cd ..

# 1. Convert FC25 CSV → players.json (filtered to Premier League)
node scripts/convert-players.mjs

# 2. Build injury profiles (cross-reference FC25 names with Transfermarkt IDs)
node scripts/build-injury-profiles.mjs
```

Outputs written to:
- `public/data/players.json`
- `public/data/injury-profiles.json`
- `public/data/README.md` (with snapshot dates auto-filled)

### 1e. Verify outputs

```bash
# Should print: "players: 500, teams: 20, profiles: 420/500 matched"
node scripts/validate-data.mjs
```

Commit the generated files:
```bash
git add public/data/
git commit -m "data: add FC25 player roster and TM injury profiles snapshot"
```

---

## 2. Project Setup

```bash
# Clone (if not already)
git clone <repo-url>
cd fifa-injuries-speckit-react

# Install app dependencies
pnpm install
```

---

## 3. Development

```bash
# Start dev server (http://localhost:5173)
pnpm dev

# Type check
pnpm tsc --noEmit

# Run tests (if written)
pnpm test
```

---

## 4. Validate the App Works

After `pnpm dev`:

1. Open http://localhost:5173
2. The team selector screen should load.
3. Select "Liverpool FC" (or any Premier League team).
4. A new session is created automatically.
5. The injury board shows current date and "No injuries" (clean state).
6. Click "Advance to match" → enter a date 30 days ahead → confirm.
7. The simulation runs; some players appear in the "Currently injured" list.
8. Refresh the page — the session and injury state must still be there
   (Principle IV: persistence survives refresh).
9. Check that each injured player shows an explanation line
   (e.g., "High age risk × match day") — Principle III: explainability.

---

## 5. Production Build

```bash
pnpm build        # outputs to dist/
pnpm preview      # serve dist/ locally for final check
```

The `dist/` directory is a fully self-contained static site.
Deploy to any static host: Netlify, Vercel, Cloudflare Pages, GitHub Pages.

No server configuration required.

---

## Troubleshooting

| Problem | Likely cause | Fix |
|---|---|---|
| Team selector shows no teams | `public/data/players.json` missing | Run data prep step 1d |
| Injury board always shows 0 injuries | Profile file missing or all players using default | Run step 1d, check step 1e match rate |
| Session lost after refresh | IndexedDB blocked by browser extension | Try incognito mode |
| Simulation gives different results than expected | PRNG seed mismatch | Check that `gameId` is stable across sessions (not regenerated) |
