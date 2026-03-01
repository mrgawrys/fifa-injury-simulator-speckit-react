import { addDays, differenceInDays, parseISO, formatISO } from 'date-fns';
import type {
  GameSession,
  Player,
  InjuryProfile,
  InjuryEvent,
  DayContext,
} from '@/types';
import { DEFAULT_INJURY_PROFILE } from '@/types';
import { seededRandom } from './prng';
import { computeDailyInjuryProbability, drawDaysAbsent, classifyTier } from './injuryModel';

function toISODate(date: Date): string {
  return formatISO(date, { representation: 'date' });
}

/**
 * Deterministically checks whether a player is injured on a given day.
 * Returns an InjuryEvent if injured, null otherwise.
 */
export function simulateDayForPlayer(
  gameId: string,
  player: Player,
  profile: InjuryProfile,
  dayIndex: number,
  currentDate: string,
  context: DayContext,
): InjuryEvent | null {
  const p = computeDailyInjuryProbability(player, profile, context);
  const roll = seededRandom(gameId, player.id, dayIndex);

  if (roll >= p) return null;

  // Two extra random draws for log-normal duration (Box-Muller needs two uniforms)
  const u1 = seededRandom(gameId, player.id, dayIndex * 1000 + 1);
  const u2 = seededRandom(gameId, player.id, dayIndex * 1000 + 2);
  const daysAbsent = drawDaysAbsent(u1, u2);

  const startDateObj = addDays(parseISO(currentDate), dayIndex);
  const returnDateObj = addDays(startDateObj, daysAbsent);

  return {
    id: crypto.randomUUID(),
    playerId: player.id,
    playerName: player.name,
    startDate: toISODate(startDateObj),
    returnDate: toISODate(returnDateObj),
    daysAbsent,
    injuryTier: classifyTier(daysAbsent),
  };
}

/**
 * Simulates all days from session.currentDate (exclusive) to targetDate (inclusive).
 * Returns all new InjuryEvents generated during the advance.
 * Already-injured players are skipped on days where their injury is still active.
 */
export function simulateAdvanceToDate(
  session: GameSession,
  players: Player[],
  profiles: Map<string, InjuryProfile>,
  targetDate: string,
): InjuryEvent[] {
  const startDate = parseISO(session.currentDate);
  const endDate = parseISO(targetDate);
  const totalDays = differenceInDays(endDate, startDate);

  if (totalDays <= 0) return [];

  const newEvents: InjuryEvent[] = [];

  // Track which players are currently injured and when they return
  const injuredUntil = new Map<string, string>();
  for (const injury of session.activeInjuries) {
    injuredUntil.set(injury.playerId, injury.returnDate);
  }

  const sessionStartDate = session.createdAt.slice(0, 10);
  const campaignDayBase = differenceInDays(startDate, parseISO(sessionStartDate));

  for (let d = 1; d <= totalDays; d++) {
    const dayIndex = campaignDayBase + d;
    const dayDate = toISODate(addDays(startDate, d));
    const context: DayContext = { isMatchDay: d === totalDays };

    for (const player of players) {
      // Skip already-injured players
      const returnDate = injuredUntil.get(player.id);
      if (returnDate !== undefined && returnDate >= dayDate) continue;

      const profile = profiles.get(player.id) ?? DEFAULT_INJURY_PROFILE;
      const event = simulateDayForPlayer(
        session.id,
        player,
        profile,
        dayIndex,
        session.currentDate,
        context,
      );

      if (event !== null) {
        newEvents.push(event);
        injuredUntil.set(player.id, event.returnDate);
      }
    }
  }

  return newEvents;
}
