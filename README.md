# FIFA Injury Tracker

> **Research project** — built to evaluate the [speckit](https://github.com/speckit) AI-assisted specification workflow. The app itself is functional, but the primary goal was to test how well speckit handles planning, contracting, and task generation for a non-trivial frontend project.

A frontend-only React app that simulates FIFA player injuries using real injury history data from Transfermarkt. Select a Premier League team, start a campaign, advance match by match, and track who gets injured and when they return.

## Features

- **Team selection** — pick any Premier League team from the FC 25 dataset
- **Injury simulation** — Bayesian Poisson model with per-player injury history, position/age risk multipliers, and deterministic seeded PRNG (same inputs always produce the same result)
- **Explainable output** — each injury shows contributing risk factors (e.g. "Age 34 (×1.8) · Match day (×7)")
- **Session persistence** — campaigns survive browser refresh via IndexedDB; multiple campaigns per team supported
- **Offline capable** — all data is static JSON served alongside the app

## Stack

| Concern | Choice |
|---|---|
| Framework | React 18 + TypeScript 5 + Vite 5 |
| State | Zustand 4 |
| Persistence | IndexedDB via `idb` 8 |
| Styling | Tailwind CSS v4 |
| Date arithmetic | `date-fns` 3 |

## Getting started

```bash
pnpm install
pnpm dev          # http://localhost:5173
```

The app ships with placeholder data (5 Liverpool FC players). To use real data see [Data preparation](#data-preparation) below.

## Data preparation

Real data requires two one-time downloads and two conversion scripts.

### 1. Player data

Download the FC 25 Kaggle dataset:
<https://www.kaggle.com/datasets/nyagami/ea-sports-fc-25-database-ratings-and-stats>

Place the CSV at `scripts/data-sources/fc25-players.csv`, then run:

```bash
cd scripts && npm install
node convert-players.mjs   # → public/data/players.json (Premier League only)
```

### 2. Injury profile data

Download the Figshare Transfermarkt injuries dataset:
<https://figshare.com/articles/dataset/Injuries_from_Transfermarkt_com/25648788/2>

Also download the player ID mapping from dcaribou/transfermarkt-datasets (`players.csv`).

Place both CSVs in `scripts/data-sources/`, then run:

```bash
node build-injury-profiles.mjs   # → public/data/injury-profiles.json
node validate-data.mjs           # must exit 0 before committing
```

## Simulation model

The injury probability for each player on each day is:

```
posteriorRate = (3.0 × 2.0 + observedInjuries) / (3.0 + observedSeasons)
dailyLambda  = (posteriorRate / 280) × contextFactor × positionMult × ageMult
P(injury)    = 1 − exp(−dailyLambda)
```

Parameters are sourced from the UEFA Elite Club Injury Study. Duration is sampled from a log-normal distribution (μ_ln = 2.565, σ_ln = 0.74). Full parameter table in `specs/001-injury-simulation/research.md`.

## Project structure

```
src/
  simulation/     # Pure TS engine — PRNG, risk factors, injury model, simulator
  store/          # Zustand store + IndexedDB persistence
  data/           # Fetch wrappers + IndexedDB cache
  types/          # Shared TypeScript interfaces
  components/     # React UI
specs/
  001-injury-simulation/   # speckit design artifacts (plan, tasks, contracts, etc.)
scripts/                   # One-time data pipeline (Node only, not bundled)
public/data/               # Static JSON served at runtime
```

## speckit notes

This project was planned end-to-end using speckit: constitution → plan → research → data model → contracts → tasks → implement. The design artifacts live in `specs/001-injury-simulation/` and are worth reading if you want to understand how the implementation decisions were made.
