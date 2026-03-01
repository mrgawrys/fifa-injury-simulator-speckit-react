import type { Player, InjuryProfile, InjuryTier, DayContext } from '@/types';
import {
  POSITION_MULT,
  ageMult,
  bayesianSeasonRate,
  contextualLambda,
} from './riskFactors';

const SEASON_DAYS = 280;

/**
 * Returns the probability (0–1) that a player sustains an injury on a specific
 * day, given their profile and the day's context.
 */
export function computeDailyInjuryProbability(
  player: Player,
  profile: InjuryProfile,
  context: DayContext,
): number {
  const seasonRate = bayesianSeasonRate(profile);
  const lambda =
    (seasonRate / SEASON_DAYS) *
    contextualLambda(context.isMatchDay) *
    POSITION_MULT[player.position] *
    ageMult(player.age);

  return 1 - Math.exp(-lambda);
}

/**
 * Draws a random injury duration (days) from a log-normal distribution.
 * μ_ln = 2.565 (median ≈ 13 days), σ_ln = 0.74. Source: PMC7146935.
 *
 * @param u1  First uniform random in (0, 1)
 * @param u2  Second uniform random in (0, 1) — for Box-Muller
 */
export function drawDaysAbsent(u1: number, u2: number): number {
  const MU_LN = 2.565;
  const SIGMA_LN = 0.74;
  // Box-Muller transform: z ~ N(0,1)
  const z = Math.sqrt(-2 * Math.log(Math.max(u1, 1e-10))) * Math.cos(2 * Math.PI * u2);
  const days = Math.round(Math.exp(MU_LN + SIGMA_LN * z));
  return Math.max(1, days); // At least 1 day
}

/** Classify the injury duration into a severity tier per UEFA breakdown. */
export function classifyTier(daysAbsent: number): InjuryTier {
  if (daysAbsent <= 7) return 'minimal';
  if (daysAbsent <= 28) return 'moderate';
  return 'severe';
}
