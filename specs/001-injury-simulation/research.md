# Research: FIFA Injury Simulation

**Phase**: 0 | **Date**: 2026-02-28 | **Plan**: `specs/001-injury-simulation/plan.md`

---

## Decision 1: FIFA Player Data Source

### Decision
Use **static JSON derived from the Kaggle FC 25 dataset** (nyagami, 2025).
Bundle a filtered and converted copy in `public/data/players.json`.

### Rationale
No live CORS-accessible REST API for FC player rosters is reliable for production:
- **FutDB / FutDatabase / FutAPI**: Require API key in headers → CORS preflight → blocked
  by browser unless server explicitly allows it (none confirm this publicly).
- **api.msmc.cc**: No auth needed, but server is unstable (522 timeouts observed in
  early 2026). Unacceptable for a production feature.
- **EA official API**: Deprecated for FC24+; EA has confirmed no public API.
- **SoFIFA**: HTML site only; no JSON API; CORS-blocked from browser.

Static dataset approach:
- Zero CORS issues (served from `public/`, same-origin).
- Zero auth or rate limits at runtime.
- Fully offline-capable after first load (Principle V fallback requirement).
- One-time download; converts to ~5 MB JSON (trimable to <100 KB if fields filtered).

### Data Fields Available
`Name`, `Age`, `Position`, `Alternative Positions`, `Team`, `League`, `Nation`,
`Rank` (overall rating), `Pace`, `Shooting`, `Passing`, `Dribbling`, `Defending`,
`Physical`, `Height`, `Weight`, and 30+ attribute scores.

### Data Source
- **Primary**: [EA SPORTS FC 25 DATABASE, RATINGS AND STATS — Kaggle (nyagami)](
  https://www.kaggle.com/datasets/nyagami/ea-sports-fc-25-database-ratings-and-stats)
  CC-licensed, sourced from ea.com/games/ea-sports-fc/ratings, ~3.4 MB compressed.
- **Fallback for deeper attributes**: [FC 24 Complete Player Dataset (stefanoleone992)](
  https://www.kaggle.com/datasets/stefanoleone992/ea-sports-fc-24-complete-player-dataset)
  covers FIFA 15–FC24, 109 fields.

### Alternatives Considered
- Live FutDB API: rejected due to unconfirmed CORS support and premium paywall for
  full attributes.
- api.msmc.cc: rejected due to server instability.
- CORS proxy (corsproxy.io): rejected for production; adds third-party dependency,
  exposes API keys, no SLA, violates Principle I spirit (relies on external relay).

### Preparation Step (ONE-TIME, before development)
1. Download `EA_SPORTS_FC_25_DATABASE.csv` from Kaggle (free account required).
2. Run the conversion script (`scripts/convert-players.mjs`) to produce
   `public/data/players.json` (filtered: only Premier League, fields: name, age,
   position, team, overall, nation).
3. Commit `public/data/players.json` to the repository.
4. Document source URL and download date in `public/data/README.md`.

---

## Decision 2: Injury History Data Source

### Decision
Use **static CSV/JSON from the Figshare "Injuries from Transfermarkt.com" dataset**
(Vermaut, 2024), pre-processed into `public/data/injury-profiles.json`.

### Rationale
No live CORS-accessible API provides per-player **career** injury history:
- **felipeall/transfermarkt-api**: Has a `/players/{id}/injuries` endpoint, but
  CORS is not enabled (no `CORSMiddleware` in source). Self-hosting requires a backend,
  violating Principle I.
- **API-Football**: injuries endpoint is fixture-scoped (pre-match availability),
  not career history. Cannot parameterize a simulation model from it.
- **football-data.org**: CORS-friendly but contains no injury data at all.
- **Sportmonks / Opta / Wyscout**: Commercial, backend-only.

Static dataset approach mirrors the FIFA player data decision: download once,
pre-process, bundle, fetch at runtime.

### Data Fields Available
`player_id` (Transfermarkt ID), `player_name`, `season`, `injury` (type),
`from` (YYYY-MM-DD), `until` (YYYY-MM-DD), `Days` (duration int), `games_missed`.

### Data Source
- **Primary**: [Injuries from Transfermarkt.com — Figshare (Vermaut, April 2024)](
  https://figshare.com/articles/dataset/Injuries_from_Transfermarkt_com/25648788/2)
  107,000+ injuries, 18,500+ players. License: verify on page (typically CC-BY).
- **Alternative**: [salimt/football-datasets — GitHub raw CSV](
  https://github.com/salimt/football-datasets), `player_injury_histories.csv`,
  143K records, CC0, fetchable directly via `raw.githubusercontent.com` (CORS-accessible).

### Player Name → Transfermarkt ID Mapping
Cross-referencing FC 25 player names with Transfermarkt IDs is required. Use:
- [dcaribou/transfermarkt-datasets](https://github.com/dcaribou/transfermarkt-datasets)
  which includes a `players.csv` with `player_id`, `name`, `current_club`, `market_value`.
- Fuzzy name match between FC 25 `Name` and Transfermarkt `player_name` during the
  one-time pre-processing step. Unmatched players fall back to league average rates.

### Preparation Step (ONE-TIME, before development)
1. Download the Figshare CSV (107K injuries) or use the GitHub raw URL directly.
2. Run `scripts/build-injury-profiles.mjs`:
   - Load Transfermarkt player name→ID mapping (dcaribou dataset).
   - For each player in the FC 25 dataset: fuzzy-match name → get Transfermarkt ID.
   - Aggregate injury records: count per-season injuries, compute mean duration.
   - Produce `public/data/injury-profiles.json`: one entry per player with
     `observedInjuries`, `observedSeasons`, `meanDaysAbsent`.
3. Commit `public/data/injury-profiles.json` and document source/date.

---

## Decision 3: Injury Simulation Model

### Decision
Use a **Poisson daily check with Bayesian per-player rate** and **log-normal
injury duration** sampling via a seeded Mulberry32 PRNG.

### Rationale
Academically grounded in the UEFA Elite Club Injury Study (largest longitudinal
football injury dataset, 20+ years). The Bayesian shrinkage approach directly
addresses the problem of sparse per-player history by combining personal data with
the well-established league prior.

### Model Parameters (all traceable to sources)

| Parameter | Value | Source |
|-----------|-------|--------|
| League base rate | 2.0 injuries/player/season | UEFA Elite Club Study |
| Season simulation days | 280 | 38 matchdays + ~120 training days + rest |
| Match-day lambda | `36 × 1.5 / 1000 = 0.054` | UEFA match incidence |
| Training-day lambda | `3.7 × 2 / 1000 = 0.0074` | UEFA training incidence |
| Duration μ_ln | 2.565 (median ≈ 13 days) | UEFA 16-yr follow-up (PMC7146935) |
| Duration σ_ln | 0.74 | Derived from UEFA median/mean |
| Severity tiers | 40% minimal (1–7d), 44% moderate (8–28d), 16% severe (29–90d) | UEFA severity breakdown |
| Position mult (GK=1.0) | DEF=1.9, MID=1.8, FWD=1.8 | PMC5013706 |
| Age mult (≤21=1.0) | 1.1 @ 22–24, 1.2 @ 25–27, 1.44 @ 28–30, 1.6 @ 31–33, 1.8 @ 34+ | Prospective PL cohort |
| Bayesian prior weight | 3.0 virtual seasons | Standard empirical Bayes |
| PRNG algorithm | Mulberry32 | Fast, no dependencies, pure TS |
| Seed construction | FNV-mix(gameId, playerId, dayIndex) | Deterministic per event |

### Model Formula

```
posterior_season_rate = (3.0 × 2.0 + observedInjuries) / (3.0 + observedSeasons)

daily_lambda = (posterior_season_rate / 280) × contextFactor(isMatchDay)
             × positionMult(position) × ageMult(age)

P(injury on day d) = 1 - exp(-daily_lambda)

roll: seeded_rng(gameId, playerId, dayIndex) < P → injury occurs
duration: drawn from log-normal(μ_ln=2.565, σ_ln=0.74) via Box-Muller
```

For players with no Transfermarkt match (no historical data), use league defaults:
`observedInjuries = 2.0`, `observedSeasons = 1` (conservative average).

### Alternatives Considered
- Hardcoded susceptibility scores (1–5 scale, Excel approach): rejected — violates
  Principle II (not traceable to real-world source).
- Machine learning model (regression on FIFA attributes): rejected — YAGNI; over-
  engineered for available data and use case (Principle V).
- Simple Weibull recurrence model: considered but more complex than needed; Bayesian
  Poisson is simpler and better documented in the football injury literature.

---

## Decision 4: Persistence Strategy

### Decision
Use **Zustand** for in-memory state (game store) + **`idb`** (IndexedDB wrapper) for
durable cross-session persistence. State schema is versioned (integer version field).

### Rationale
- Zustand: lighter than Redux, no boilerplate, supports middleware (e.g., devtools).
  localStorage has a 5 MB cap; a campaign with 25 players × 100 match days × full
  injury event history can approach that limit.
- IndexedDB: no practical size limit for this use case; `idb` provides a typed,
  Promise-based API over the low-level IndexedDB interface.
- Schema versioning: required by Principle IV; an `onupgradeneeded` handler in the
  `idb` open call handles migrations between schema versions.

### Alternatives Considered
- localStorage only: rejected due to 5 MB limit and poor support for structured queries.
- Redux + redux-persist: rejected as over-engineered for a single-user frontend app.
- Jotai / Recoil: no clear advantage over Zustand for this use case.

---

## Decision 5: Project Stack (Final)

| Concern | Decision |
|---------|----------|
| Framework | React 18 + TypeScript 5 |
| Build | Vite 5 |
| State | Zustand 4 |
| Persistence | IndexedDB via `idb` 8 |
| Data fetching | Native `fetch` (no TanStack Query — too much overhead for static files) |
| CSV parsing | `papaparse` (browser-native CSV parser, no Node deps) |
| Styling | Tailwind CSS 3 |
| Testing | Vitest + React Testing Library (optional) |
| Date arithmetic | `date-fns` (tree-shakeable, no large runtime) |

---

## Sources

- [UEFA Elite Club Injury Study — PMC9929604](https://pmc.ncbi.nlm.nih.gov/articles/PMC9929604/)
- [Time before return to play: UEFA 16-yr follow-up — PMC7146935](https://pmc.ncbi.nlm.nih.gov/articles/PMC7146935/)
- [Position injury risk: PMC5013706](https://pmc.ncbi.nlm.nih.gov/articles/PMC5013706/)
- [Previous injury as risk factor: PMC2564391](https://pmc.ncbi.nlm.nih.gov/articles/PMC2564391/)
- [Bayesian injury rate estimation, 2025](https://injepijournal.biomedcentral.com/articles/10.1186/s40621-025-00583-z)
- [Figshare — Injuries from Transfermarkt.com](https://figshare.com/articles/dataset/Injuries_from_Transfermarkt_com/25648788/2)
- [Kaggle — FC 25 DATABASE, RATINGS AND STATS](https://www.kaggle.com/datasets/nyagami/ea-sports-fc-25-database-ratings-and-stats)
- [dcaribou/transfermarkt-datasets](https://github.com/dcaribou/transfermarkt-datasets)
- [salimt/football-datasets](https://github.com/salimt/football-datasets)
