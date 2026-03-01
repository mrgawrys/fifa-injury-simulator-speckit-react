import type { Player, InjuryProfile } from '@/types';

export class DataUnavailableError extends Error {
  readonly originalCause?: unknown;
  constructor(resource: string, cause?: unknown) {
    super(`Data unavailable: ${resource}`);
    this.name = 'DataUnavailableError';
    this.originalCause = cause;
  }
}

async function fetchJson<T>(url: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch (err) {
    throw new DataUnavailableError(url, err);
  }
  if (!response.ok) {
    throw new DataUnavailableError(
      `${url} (HTTP ${response.status})`,
    );
  }
  return response.json() as Promise<T>;
}

export async function loadPlayers(): Promise<Player[]> {
  return fetchJson<Player[]>('./data/players.json');
}

export async function loadInjuryProfiles(): Promise<InjuryProfile[]> {
  return fetchJson<InjuryProfile[]>('./data/injury-profiles.json');
}
