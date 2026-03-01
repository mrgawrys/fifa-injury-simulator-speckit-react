import { openDB, type IDBPDatabase } from 'idb';
import type { GameSession, Player, InjuryProfile } from '@/types';

const DB_NAME = 'fifa-injury-tracker';
const DB_VERSION = 1;

interface FifaInjuryDB {
  sessions: {
    key: string;
    value: GameSession;
    indexes: { teamId: string; lastPlayedAt: string };
  };
  playerCache: {
    key: string; // teamId
    value: { teamId: string; players: Player[] };
  };
  profileCache: {
    key: string; // teamId
    value: { teamId: string; profiles: InjuryProfile[] };
  };
}

let dbPromise: Promise<IDBPDatabase<FifaInjuryDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<FifaInjuryDB>> {
  if (!dbPromise) {
    dbPromise = openDB<FifaInjuryDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const sessionsStore = db.createObjectStore('sessions', {
            keyPath: 'id',
          });
          sessionsStore.createIndex('teamId', 'teamId');
          sessionsStore.createIndex('lastPlayedAt', 'lastPlayedAt');

          db.createObjectStore('playerCache', { keyPath: 'teamId' });
          db.createObjectStore('profileCache', { keyPath: 'teamId' });
        }
      },
    });
  }
  return dbPromise;
}

export async function getAllSessions(): Promise<GameSession[]> {
  const db = await getDB();
  return db.getAll('sessions');
}

export async function saveSession(session: GameSession): Promise<void> {
  const db = await getDB();
  await db.put('sessions', session);
}
