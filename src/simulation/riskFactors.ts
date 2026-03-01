/**
 * Risk factor multipliers and Bayesian posterior rate computation.
 * All values are sourced from research.md (UEFA Elite Club Study parameters).
 */
import type { InjuryProfile, Position } from '@/types';

/** Position injury risk multipliers (GK baseline = 1.0). Source: PMC5013706 */
export const POSITION_MULT: Record<Position, number> = {
  GK: 1.0,
  DEF: 1.9,
  MID: 1.8,
  FWD: 1.8,
};

/** Age-based injury risk multiplier. Source: Prospective PL cohort study. */
export function ageMult(age: number): number {
  if (age <= 21) return 1.0;
  if (age <= 24) return 1.1;
  if (age <= 27) return 1.2;
  if (age <= 30) return 1.44;
  if (age <= 33) return 1.6;
  return 1.8; // age 34+
}

/**
 * Bayesian posterior injury rate (injuries per season) for a player.
 * Shrinks toward the league prior (2.0/season) with weight 3.0 virtual seasons.
 * Formula: (3.0 × 2.0 + observedInjuries) / (3.0 + observedSeasons)
 */
export function bayesianSeasonRate(profile: InjuryProfile): number {
  const priorWeight = 3.0;
  const priorRate = 2.0;
  return (priorWeight * priorRate + profile.observedInjuries) /
    (priorWeight + profile.observedSeasons);
}

/**
 * Context factor scaling the daily lambda.
 * Match days use UEFA match-day incidence (0.054).
 * Training days use UEFA training-day incidence (0.0074).
 * These are scaled relative to each other so the position/age mults apply cleanly.
 */
export function contextualLambda(isMatchDay: boolean): number {
  // Match-day: 36 per 1000 player-hours × 1.5h ≈ 0.054
  // Training: 3.7 per 1000 player-hours × 2h ≈ 0.0074
  return isMatchDay ? 0.054 : 0.0074;
}

/**
 * Returns a human-readable explanation of the top injury risk factors
 * for display in PlayerCard. Meets Principle III (explainability).
 */
export function explainInjuryFactors(
  age: number,
  position: Position,
  profile: InjuryProfile,
  isMatchDay: boolean,
): string {
  const factors: string[] = [];

  if (isMatchDay) {
    factors.push('Match day (×7)');
  }

  const pm = POSITION_MULT[position];
  if (pm > 1.0) {
    factors.push(`${position} position (×${pm.toFixed(1)})`);
  }

  const am = ageMult(age);
  if (am > 1.0) {
    factors.push(`Age ${age} (×${am.toFixed(2)})`);
  }

  const rate = bayesianSeasonRate(profile);
  if (rate > 3.0) {
    factors.push(`High injury history (×${(rate / 2.0).toFixed(1)})`);
  }

  return factors.length > 0 ? factors.join(' · ') : 'Baseline risk';
}
