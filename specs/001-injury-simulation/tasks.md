---
description: "Task list for FIFA Injury Simulation"
---

# Tasks: FIFA Injury Simulation

**Input**: Design documents from `specs/001-injury-simulation/`
**Prerequisites**: plan.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅
**Note**: No spec.md — user stories derived from plan.md summary + user description.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1–US4 user story label (see Phase 3+ below)
- Paths assume repo root as working directory

---

## Derived User Stories (from plan.md + user description)

| Story | Priority | Goal | Independent Test |
|-------|----------|------|-----------------|
| US1 | P1 | Team Selection — user picks a Premier League team and sees its roster | Open app → team list shown → search "Liverpool" → select → 25 players listed |
| US2 | P2 | Injury Board (Initial State) — start or resume a session, see all players healthy | After team select → start session → injury board shows all players as "Available" |
| US3 | P3 | Advance to Match Date — enter date, simulation runs, injured players appear | Injury board → advance 30 days → some players show "Injured" with return dates + explanations |
| US4 | P4 | Session Persistence — state survives refresh; multiple sessions supported | Advance to match → refresh page → same injuries/date still shown |

---

## Phase 1: Setup & Data Preparation

**Purpose**: Project scaffolding + one-time data pipeline. No blocking order within [P] tasks.

- [X] T001 Initialize Vite React TypeScript project at repo root: `pnpm create vite . --template react-ts` then verify `pnpm dev` starts
- [X] T002 Install all production dependencies: `pnpm add zustand idb papaparse date-fns tailwindcss @tailwindcss/vite`; install dev deps: `pnpm add -D vitest @testing-library/react @types/papaparse`
- [X] T003 [P] Configure TypeScript strict mode in tsconfig.json: enable `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, set `paths` alias `@/*` → `src/*`
- [X] T004 [P] Configure Tailwind CSS: add `@tailwindcss/vite` plugin to vite.config.ts, add `@import "tailwindcss"` to src/index.css
- [X] T005 [P] Create all source directories: `src/components/TeamSelector/`, `src/components/MatchDateEntry/`, `src/components/InjuryBoard/`, `src/components/PlayerCard/`, `src/components/SessionManager/`, `src/simulation/`, `src/data/`, `src/store/`, `src/types/`, `public/data/`, `scripts/data-sources/`
- [X] T006 [P] Create placeholder `public/data/players.json` with 5 Liverpool FC players conforming exactly to the `Player` schema in `data-model.md` (use real names: Alisson, Van Dijk, Salah, Szoboszlai, Diaz; set `teamId: "liverpool-fc"`)
- [X] T007 [P] Create placeholder `public/data/injury-profiles.json` with 5 entries matching the placeholder players from T006, using realistic values (`observedInjuries`, `observedSeasons`, `meanDaysAbsent`)
- [X] T008 [P] Create `public/data/README.md` with data provenance template from `contracts/static-assets.md` (leave snapshot dates as `TODO`)
- [X] T009 [P] Add `.gitignore` entries: `scripts/data-sources/`, `node_modules/`, `dist/`
- [X] T010 Write `scripts/convert-players.mjs`: reads `scripts/data-sources/fc25-players.csv`, filters to Premier League, maps columns to `Player` schema (name, fullName, age, position, altPositions, teamId, teamName, league, nation, overallRating), writes `public/data/players.json`; requires `scripts/package.json` with `csv-parse` and `fuse.js` deps
- [X] T011 Write `scripts/build-injury-profiles.mjs`: reads `scripts/data-sources/tm-injuries.csv` and `scripts/data-sources/tm-players.csv`, fuzzy-matches player names (Fuse.js, threshold 0.3), aggregates per-player `observedInjuries`/`observedSeasons`/`meanDaysAbsent`, writes `public/data/injury-profiles.json`; unmatched players are omitted (app uses default profile)
- [X] T012 [P] Write `scripts/validate-data.mjs`: loads both JSON files, checks all `Player` constraints and `InjuryProfile` constraints from `contracts/static-assets.md`, prints match rate summary; exits with code 1 if violations found

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core TypeScript infrastructure that ALL user stories depend on.

**⚠️ CRITICAL**: No user story work begins until this phase is complete.

- [X] T013 Define all TypeScript interfaces and type aliases in `src/types/index.ts`: `Player`, `InjuryProfile`, `InjuryEvent`, `InjuryTier`, `MatchDay`, `GameSession`, `AppState`, `AppView`, `DayContext`, `Position` — copy exactly from `data-model.md`; add `DEFAULT_INJURY_PROFILE` constant
- [X] T014 [P] Implement Mulberry32 PRNG + FNV-1a seed construction in `src/simulation/prng.ts`: export `seededRandom(gameId: string, playerId: string, dayIndex: number): number` — same inputs must always return the same float in `[0, 1)` per `contracts/simulation-engine.md`
- [X] T015 [P] Implement risk factor multipliers + Bayesian posterior in `src/simulation/riskFactors.ts`: export `POSITION_MULT`, `ageMult(age)`, `bayesianSeasonRate(profile)`, `contextualLambda(isMatchDay)` — use exact values from `research.md` model parameters table
- [X] T016 Implement `computeDailyInjuryProbability` in `src/simulation/injuryModel.ts` (depends T013–T015): combine Bayesian posterior × position mult × age mult × contextual lambda → return `1 - Math.exp(-lambda)`; also export `drawDaysAbsent(rng)` using log-normal Box-Muller (μ_ln=2.565, σ_ln=0.74) with InjuryTier assignment
- [X] T017 Implement `simulateDayForPlayer` and `simulateAdvanceToDate` in `src/simulation/simulator.ts` (depends T013–T016): implement per the exact API contract in `contracts/simulation-engine.md`; skip already-injured players; generate UUIDs with `crypto.randomUUID()`; compute `returnDate` using `date-fns addDays`
- [X] T018 [P] Implement `fetch` wrappers in `src/data/loaders.ts` (depends T013): `loadPlayers(): Promise<Player[]>` fetches `/data/players.json`; `loadInjuryProfiles(): Promise<InjuryProfile[]>` fetches `/data/injury-profiles.json`; both throw typed errors on non-200 responses
- [X] T019 [P] Implement IndexedDB open + schema v1 + migration handler in `src/store/persistence.ts` (depends T013): use `idb` `openDB('fifa-injury-tracker', 1, { upgrade })` to create object stores `sessions` (keyPath: `id`, indexes: `teamId`, `lastPlayedAt`), `playerCache` (keyPath: `teamId`), `profileCache` (keyPath: `teamId`); export typed `getDB()` function
- [X] T020 Implement IndexedDB cache read/write in `src/data/cache.ts` (depends T018–T019): `getCachedPlayers(teamId)`, `setCachedPlayers(teamId, players)`, `getCachedProfiles(teamId)`, `setCachedProfiles(teamId, profiles)` — use IndexedDB `playerCache` + `profileCache` stores
- [X] T021 Implement Zustand game store in `src/store/gameStore.ts` (depends T013, T017, T019–T020): define full `AppState`; export `useStore`; implement actions: `selectTeam(teamId)`, `loadTeamData(teamId)` (fetch → cache), `createSession(teamId)`, `loadSession(sessionId)`, `advanceToDate(targetDate)` (calls `simulateAdvanceToDate`, updates session, persists to IDB), `setView(view)`
- [X] T022 Scaffold `src/App.tsx` view router (depends T021): renders `<TeamSelector />` when `view === 'team-select'`, `<SessionManager />` when `view === 'session-select'`, `<InjuryBoard />` when `view === 'injury-board'`, `<MatchDateEntry />` when `view === 'advance-date'`; on mount calls `getDB()` then loads all sessions from IDB

**Checkpoint**: Foundation complete — all user story work can begin.

---

## Phase 3: User Story 1 — Team Selection (Priority: P1) 🎯 MVP

**Goal**: User opens app, sees a list of Premier League teams, selects one, and proceeds.

**Independent Test**: Open http://localhost:5173 → team list shows with search → type "Liverpool" → Liverpool FC appears → click it → app navigates to session screen showing "Liverpool FC" in the heading.

### Implementation for User Story 1

- [X] [US1] Implement `src/components/TeamSelector/index.tsx`: renders a search input + scrollable list of unique `teamName` values derived from `store.players` (all teams from players.json); on mount dispatches `loadTeamData` for the index (load just the team list without filtering); clicking a team dispatches `selectTeam(teamId)` then `setView('session-select')`
- [X] [P] [US1] Implement `src/components/TeamSelector/TeamSearchInput.tsx`: controlled text input with `onChange` handler that filters the team list in the parent; `placeholder="Search teams..."`, autofocused on mount
- [X] [P] [US1] Implement `src/components/TeamSelector/TeamListItem.tsx`: renders a single team row with team name; accepts `onClick` prop; applies visual active/hover styles via Tailwind

**Checkpoint**: US1 complete — team selector works independently. Can open app, search, and select a team.

---

## Phase 4: User Story 2 — Injury Board Initial State (Priority: P2)

**Goal**: After selecting a team, user starts a session and sees all players as "Available".

**Independent Test**: Select Liverpool FC → Session screen shows → click "New Session" → Injury Board loads → "Currently Injured: 0" → all 25 players listed under "Available" with name, position, rating.

### Implementation for User Story 2

- [X] [US2] Implement `src/components/SessionManager/index.tsx`: queries store for existing sessions filtered by `teamId`; renders two sections — "Continue" (list of existing sessions with `lastPlayedAt` and current date) and "Start Fresh" (single "New Session" button); "New Session" dispatches `createSession(teamId)` then `setView('injury-board')`; resuming dispatches `loadSession(sessionId)` then `setView('injury-board')`
- [X] [US2] Implement `src/components/InjuryBoard/index.tsx`: reads `activeSession` and `players` from store; renders "Currently Injured" section (filtered `activeInjuries` where `returnDate >= currentDate`) and "Available" section (remaining players); shows current campaign date in header; renders "Advance to Next Match" button that dispatches `setView('advance-date')`
- [X] [P] [US2] Implement `src/components/PlayerCard/index.tsx`: accepts `player: Player` and `injury?: InjuryEvent`; when injured: shows red badge with `injuryTier`, "Out until: {returnDate}", days remaining, and `explainInjuryFactors` text; when healthy: shows green "Available" badge; always shows name, position abbreviation, overall rating

**Checkpoint**: US2 complete — full initial injury board works independently.

---

## Phase 5: User Story 3 — Advance to Match Date (Priority: P3)

**Goal**: User enters the next match date; the simulation runs and injuries appear with explanations.

**Independent Test**: On Injury Board → click "Advance to Next Match" → enter a date 45 days ahead → click "Simulate" → loading indicator → Injury Board updates → 2–5 players shown in "Currently Injured" with return dates and explanation text (e.g., "Moderate injury · Age risk · Match day").

### Implementation for User Story 3

- [X] [US3] Implement `src/components/MatchDateEntry/index.tsx`: date `<input type="date">` pre-filled with `currentDate + 1 day`; validates that input > `session.currentDate` (show inline error otherwise); optional opponent name text input; "Simulate" button dispatches `advanceToDate(targetDate)` via store — which runs simulation and navigates back to `injury-board`; show a brief loading state during simulation (disable button, show spinner)
- [X] [US3] Add `explainInjuryFactors(player: Player, profile: InjuryProfile, isMatchDay: boolean): string` to `src/simulation/riskFactors.ts`: returns a comma-joined human-readable string of the top contributing risk factors (e.g., `"Age 34 (×1.8)"`, `"Match day (×7x)"`, `"High injury history (×2.5)"`); used by `PlayerCard` to meet Principle III explainability requirement

**Checkpoint**: US3 complete — full simulation loop works. Select team → start session → advance dates → see injuries with explanations.

---

## Phase 6: User Story 4 — Session Persistence (Priority: P4)

**Goal**: Game state survives a browser refresh. Multiple sessions for different teams can coexist.

**Independent Test**: Advance to a date with injuries → hard-refresh browser (Ctrl+R) → injury board shows same injuries and same current date → start a new session for a different team → both sessions listed in SessionManager.

### Implementation for User Story 4

- [X] [US4] Harden app bootstrap in `src/App.tsx` (and `src/store/gameStore.ts` `initializeApp` action): on mount — open IDB → load all stored sessions → if `activeSessionId` was stored in `localStorage` restore it; if schema version mismatch detected on any loaded session: run migration (for v1→v2: define when needed; for v1: just mark as current); if IDB unavailable: show toast "Storage unavailable — session will not be saved"
- [X] [P] [US4] Harden data loading with fallback in `src/data/loaders.ts`: if `fetch('/data/players.json')` fails AND `getCachedPlayers(teamId)` returns data → use cache silently; if both fail → throw `DataUnavailableError` (custom error class); show "Data unavailable" error state in `TeamSelector` on `DataUnavailableError`

**Checkpoint**: US4 complete — full persistence loop verified. All 4 user stories independently functional.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and production readiness.

- [X] T033 [P] Configure `vite.config.ts` for static site deployment: set `base: './'` for relative asset paths; enable `build.rollupOptions` to split vendor chunk; verify `pnpm build && pnpm preview` serves the app correctly
- [X] T034 [P] Add `scripts/package.json` with `"type": "module"` and deps `csv-parse`, `fuse.js`; add `npm install` step to `quickstart.md` data prep section
- [X] T035 Run full `quickstart.md` validation checklist: start from zero (no IDB data), perform all 9 validation steps listed under "Validate the App Works"; fix any failures found
- [X] T036 [P] Polish `InjuryBoard` layout: add empty state illustration/message when `activeInjuries.length === 0` ("All players available"); add campaign date display formatted as "Season Day N (YYYY-MM-DD)"

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately; all [P] tasks run in parallel
- **Phase 2 (Foundational)**: Requires T001–T002 complete; T013 blocks T016–T017, T021; T014–T015 run in parallel; T019 runs in parallel with T014–T015; T020 depends on T018–T019; T021 depends on T013, T017, T020; T022 depends on T021
- **Phase 3 (US1)**: Requires Phase 2 complete; T023–T025 can run in parallel after T022
- **Phase 4 (US2)**: Requires Phase 2 + US1 complete; T026–T028 run in parallel
- **Phase 5 (US3)**: Requires Phase 2 + US1 + US2 complete; T029 depends on T021; T030 runs in parallel with T029
- **Phase 6 (US4)**: Requires Phase 2 + US1–US3 complete
- **Phase 7 (Polish)**: Requires all desired user stories complete

### Within-Story Dependencies

```
Phase 2:
  T013 → T016 → T017 → simulateAdvanceToDate
  T014 [P] ──┘
  T015 [P] ──┘
  T018 [P] → T020 → T021 → T022
  T019 [P] ──┘

Phase 3 (US1):
  T022 → T023, T024 [P], T025 [P]

Phase 4 (US2):
  T022 → T026, T027, T028 [P]

Phase 5 (US3):
  T021 → T029; T030 [P] (extends T015)
```

### Parallel Opportunities

```bash
# Phase 1 — all [P] tasks together:
T003, T004, T005, T006, T007, T008, T009, T010 (setup only)

# Phase 2 — after T013 is done:
T014, T015, T018, T019  ← all [P], start together after T013

# Phase 3 — after T022:
T023, T024, T025  ← all [P] for US1

# Phase 4 — after US1:
T026, T027, T028  ← [P] for US2
```

---

## Implementation Strategy

### MVP First (US1 + US2 only)

1. Complete Phase 1: Setup (T001–T012)
2. Complete Phase 2: Foundational (T013–T022)
3. Complete Phase 3: US1 — Team Selection (T023–T025)
4. Complete Phase 4: US2 — Injury Board initial state (T026–T028)
5. **STOP and VALIDATE**: Open app → select Liverpool FC → start session → injury board shows all 25 players healthy
6. Demo: core UI shell is working end-to-end

### Incremental Delivery

1. Setup + Foundational → all infrastructure ready
2. + US1 → team selection works → demo-able
3. + US2 → injury board (no simulation yet) → demo-able as static view
4. + US3 → simulation runs → **fully functional core product**
5. + US4 → persistence → production-ready
6. + Polish → shippable

---

## Notes

- `[P]` = different files, no incomplete task dependencies — safe to run in parallel
- `[USN]` label maps each task to its user story for independent traceability
- No test tasks generated (not requested in plan.md)
- Data prep scripts (T010–T012) can be skipped if real data is already available in `public/data/`; placeholder data (T006–T007) is sufficient for development through US3
- Commit after each Phase checkpoint to keep rollback points clean
