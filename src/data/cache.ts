import { getDB } from '@/store/persistence';
import type { Player, InjuryProfile } from '@/types';

export async function getCachedPlayers(teamId: string): Promise<Player[] | null> {
  const db = await getDB();
  const record = await db.get('playerCache', teamId);
  return record?.players ?? null;
}

export async function setCachedPlayers(teamId: string, players: Player[]): Promise<void> {
  const db = await getDB();
  await db.put('playerCache', { teamId, players });
}

export async function getCachedProfiles(teamId: string): Promise<InjuryProfile[] | null> {
  const db = await getDB();
  const record = await db.get('profileCache', teamId);
  return record?.profiles ?? null;
}

export async function setCachedProfiles(teamId: string, profiles: InjuryProfile[]): Promise<void> {
  const db = await getDB();
  await db.put('profileCache', { teamId, profiles });
}
