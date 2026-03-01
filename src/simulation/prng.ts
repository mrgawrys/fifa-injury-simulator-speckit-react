/**
 * Deterministic PRNG for the injury simulation engine.
 * Uses Mulberry32 with an FNV-1a seed derived from (gameId, playerId, dayIndex).
 *
 * Same inputs ALWAYS produce the same float in [0, 1).
 */

/** FNV-1a 32-bit hash over an arbitrary string. */
function fnv1a32(str: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    // Multiply by 32-bit FNV prime (16777619) via bit tricks to stay in 32-bit
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0; // Ensure unsigned 32-bit
}

/** Mix three FNV-1a hashes together to produce a single 32-bit seed. */
function buildSeed(gameId: string, playerId: string, dayIndex: number): number {
  const h1 = fnv1a32(gameId);
  const h2 = fnv1a32(playerId);
  const h3 = fnv1a32(String(dayIndex));
  // XOR mix with avalanche multiplication
  return ((h1 ^ (h2 * 0x9e3779b9) ^ (h3 * 0x6c62272e)) >>> 0);
}

/** Single step of the Mulberry32 PRNG — returns a float in [0, 1). */
function mulberry32(seed: number): number {
  let s = (seed + 0x6d2b79f5) >>> 0;
  s = Math.imul(s ^ (s >>> 15), s | 1);
  s ^= s + Math.imul(s ^ (s >>> 7), s | 61);
  return ((s ^ (s >>> 14)) >>> 0) / 0x100000000;
}

/**
 * Returns a deterministic pseudo-random number in [0, 1) for the given
 * composite seed. Same (gameId, playerId, dayIndex) triple always returns
 * the same value.
 */
export function seededRandom(
  gameId: string,
  playerId: string,
  dayIndex: number,
): number {
  const seed = buildSeed(gameId, playerId, dayIndex);
  return mulberry32(seed);
}
