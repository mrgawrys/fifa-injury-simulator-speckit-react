# Contract: Simulation Engine

**Type**: Internal TypeScript module
**Location**: `src/simulation/`
**Consumers**: Zustand store actions, React components (read-only access via store)

The simulation engine is pure TypeScript with no React or DOM dependencies.
It is independently testable.

---

## Public API

### `computeDailyInjuryProbability`

```typescript
/**
 * Returns the probability (0–1) that a given player sustains an injury
 * on a specific day, given their injury profile and the day's context.
 *
 * All multipliers are applied on top of the Bayesian posterior season rate.
 */
function computeDailyInjuryProbability(
  player: Player,
  profile: InjuryProfile,
  context: DayContext,
): number;

interface DayContext {
  isMatchDay: boolean;
}
```

### `simulateDayForPlayer`

```typescript
/**
 * Deterministically checks whether a player is injured on a given day.
 *
 * Returns an InjuryEvent if the player is injured, null otherwise.
 * Result is fully determined by (gameId, playerId, dayIndex); calling
 * this twice with the same arguments always returns the same result.
 *
 * @param dayIndex  Integer: number of days since the campaign start date.
 *                  Used as part of the PRNG seed. Must be >= 0.
 */
function simulateDayForPlayer(
  gameId: string,
  player: Player,
  profile: InjuryProfile,
  dayIndex: number,
  currentDate: string, // ISO 8601, used to compute startDate and returnDate
  context: DayContext,
): InjuryEvent | null;
```

### `simulateAdvanceToDate`

```typescript
/**
 * Simulates all days from the session's currentDate (exclusive) to
 * targetDate (inclusive), returning all new injury events that occurred.
 *
 * Players already injured at the start of the simulation (i.e., those
 * with an active InjuryEvent whose returnDate >= currentDate) are SKIPPED
 * for injury checks on days where they are already injured.
 *
 * @param session         Current game session (read-only)
 * @param players         Team roster
 * @param profiles        Injury profiles map (playerId → InjuryProfile)
 * @param targetDate      ISO 8601 target date (must be > session.currentDate)
 * @returns               Array of new InjuryEvents generated during the advance
 */
function simulateAdvanceToDate(
  session: GameSession,
  players: Player[],
  profiles: Map<string, InjuryProfile>,
  targetDate: string,
): InjuryEvent[];
```

---

## PRNG Contract

```typescript
/**
 * Returns a deterministic pseudo-random number in [0, 1) for a given
 * composite seed. Uses Mulberry32 algorithm.
 *
 * The same (gameId, playerId, dayIndex) triple ALWAYS returns the same value.
 * This is the only source of randomness in the simulation engine.
 */
function seededRandom(gameId: string, playerId: string, dayIndex: number): number;
```

**PRNG algorithm**: Mulberry32
**Seed construction**: FNV-1a hash over `gameId + playerId + dayIndex`

---

## Invariants

- `simulateDayForPlayer` MUST be a pure function (no side effects, no I/O).
- `seededRandom` MUST be deterministic: same inputs → same output always.
- A player already marked as injured (active `InjuryEvent`) MUST NOT receive
  a new injury until their `returnDate` has passed.
- `InjuryEvent.daysAbsent` MUST be >= 1.
- `InjuryEvent.returnDate` MUST equal `startDate + daysAbsent` days.
- All dates in/out of the simulation engine are ISO 8601 strings (YYYY-MM-DD).
  The engine does NOT operate on `Date` objects to avoid timezone issues.
