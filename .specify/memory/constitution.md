<!--
SYNC IMPACT REPORT
==================
Version: (unversioned template) → 1.0.0
Bump Type: MINOR — initial ratification; all placeholders replaced with project-specific content.

Modified Principles:
  (none — initial fill; no prior principles existed)

Added:
  - Project identity: FIFA Injury Tracker
  - Principle I:  Frontend-Only, No Backend
  - Principle II: Real Data Foundation
  - Principle III: Simulation Integrity
  - Principle IV: Game State Persistence
  - Principle V:  Simplicity & Progressive Disclosure
  - Section: Technology Stack
  - Section: Data Sourcing & Constraints

Removed:
  (none)

Templates:
  ✅ .specify/memory/constitution.md — updated (this file)
  ⚠  .specify/templates/plan-template.md — Constitution Check section is generic; no structural update required at this time
  ⚠  .specify/templates/spec-template.md — no structural changes required at this time
  ⚠  .specify/templates/tasks-template.md — no structural changes required at this time
  ℹ  .specify/templates/commands/ — no command files present in repository

Deferred TODOs:
  (none — ratification date set to today 2026-02-28 as initial commit date)
-->

# FIFA Injury Tracker Constitution

## Core Principles

### I. Frontend-Only, No Backend

This is a React single-page application. There MUST be no server-side component,
no API server to deploy, and no backend dependencies. All data is fetched
client-side from public/external sources. All state is persisted locally in the
browser (localStorage or IndexedDB). This constraint keeps the project deployable
as a static site and eliminates operational overhead entirely.

### II. Real Data Foundation

Injury simulation MUST be grounded in real-world data. Player rosters are sourced
from FIFA game data. Historical injury records (frequency and duration) are sourced
from public football data providers (e.g., Transfermarkt). Invented or hardcoded
injury rates are NOT permitted; every parameter in the simulation model MUST be
traceable to a real-world source. Data sourcing feasibility research MUST be
completed and documented before any simulation code is written.

### III. Simulation Integrity

The injury probability model MUST be statistically sound, deterministic for the
same inputs, and transparent to the user:

- Randomness MUST use a seeded PRNG so identical inputs always produce the same
  simulation outcome.
- Simulation outputs MUST be explainable: the UI MUST surface the contributing
  factors for an injury event (e.g., injury susceptibility rating × days elapsed).
- The model MUST encode both injury frequency (how often a player gets injured)
  and injury severity (how many days the player is unavailable).
- All model parameters MUST be documented alongside their data sources in the
  project research artifacts.

### IV. Game State Persistence

The full session state (selected team, current match date, active injury events,
match history) MUST be persisted client-side across browser sessions:

- State MUST survive a page refresh.
- State schema MUST be versioned; schema migrations MUST be handled gracefully —
  silently wiping data on schema change is NOT acceptable.
- Users MUST be able to resume a session from the last saved game date.
- Supporting multiple saved sessions (e.g., different teams) SHOULD be implemented
  unless explicitly deprioritised.

### V. Simplicity & Progressive Disclosure

The primary view MUST answer exactly one question: "Who is currently injured and
when do they return?" All complexity is added only when required:

- Every new feature MUST be justifiable against the core user need.
- The app MUST be functional without any initial configuration by the user.
- YAGNI applies: no speculative features, no admin panels, no export pipelines
  unless explicitly requested.
- Data fetching failures MUST degrade gracefully; a cached or bundled fallback
  MUST be available so the app remains usable when external sources are
  unreachable.

## Technology Stack

- **Framework**: React with TypeScript. Strong typing is non-negotiable.
- **State Management**: React context + useReducer as the default. Zustand is
  permitted if state complexity warrants it. Redux is NOT permitted unless
  explicitly justified against simpler alternatives.
- **Persistence**: localStorage for lightweight key/value data; IndexedDB (via
  the `idb` library) for structured game state exceeding ~5 MB.
- **Data Fetching**: Native `fetch` or TanStack Query for client-side requests.
  No GraphQL layer unless a data source requires it.
- **Styling**: Tailwind CSS or CSS Modules. A large component library MAY be
  added if explicitly chosen; it MUST NOT be added by default.
- **Build Tool**: Vite. Create React App is NOT permitted.
- **Testing**: Vitest + React Testing Library. Tests are optional per feature
  unless explicitly requested in the feature specification.
- **External Data Sources**: FIFA player data availability and Transfermarkt
  access strategy MUST be resolved during the research phase of the first
  feature before any simulation implementation begins.

## Data Sourcing & Constraints

- All external data requests MUST originate from the browser and target
  CORS-compliant endpoints or CORS-permissive proxies. Server-side scraping is
  out of scope.
- Player and injury data MAY be cached locally (IndexedDB) to reduce repeat
  network requests and enable offline use after first load.
- Data that cannot be fetched live due to CORS or access restrictions MUST be
  bundled as static JSON assets. The original source URL and snapshot date MUST
  be documented in the asset file or adjacent README comment.
- No personally identifiable information is collected or transmitted. The app
  is read-only simulation with local-only state.

## Governance

This constitution supersedes all other development practices. Any feature or
architectural decision that conflicts with these principles requires an explicit
amendment to this file before work proceeds.

**Amendment procedure**:
1. Identify the principle(s) affected and document the reason for the change.
2. Update this file with the revised principle and increment the version per
   the versioning policy below.
3. Update the Sync Impact Report comment at the top of this file.
4. Review all open specs and plans for compliance with the amended principle.

**Versioning policy**:
- MAJOR: A principle is removed or redefined in a backward-incompatible way.
- MINOR: A new principle or section is added, or guidance is materially expanded.
- PATCH: Clarifications, rewording, or non-semantic refinements.

**Compliance**: All feature specs and implementation plans MUST include a
Constitution Check section verifying adherence to all five principles before
implementation work begins.

**Version**: 1.0.0 | **Ratified**: 2026-02-28 | **Last Amended**: 2026-02-28
