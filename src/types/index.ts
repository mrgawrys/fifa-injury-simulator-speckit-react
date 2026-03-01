// Core type definitions for the FIFA Injury Simulation app.
// Keep in sync with specs/001-injury-simulation/data-model.md.

export type Position = 'GK' | 'DEF' | 'MID' | 'FWD';

export type InjuryTier = 'minimal' | 'moderate' | 'severe';

export type AppView =
  | 'team-select'
  | 'session-select'
  | 'injury-board'
  | 'advance-date';

export interface Player {
  id: string;
  fifaId: string;
  name: string;
  fullName: string;
  age: number;
  position: Position;
  altPositions: Position[];
  teamId: string;
  teamName: string;
  league: string;
  nation: string;
  overallRating: number;
}

export interface InjuryProfile {
  playerId: string;
  observedInjuries: number;
  observedSeasons: number;
  meanDaysAbsent: number;
}

export const DEFAULT_INJURY_PROFILE: InjuryProfile = {
  playerId: '__default__',
  observedInjuries: 2.0,
  observedSeasons: 1.0,
  meanDaysAbsent: 18,
};

export interface InjuryEvent {
  id: string;
  playerId: string;
  playerName: string;
  startDate: string; // ISO 8601 YYYY-MM-DD
  returnDate: string; // ISO 8601 YYYY-MM-DD
  daysAbsent: number;
  injuryTier: InjuryTier;
}

export interface MatchDay {
  date: string; // ISO 8601
  opponent: string;
  injuryEvents: string[]; // InjuryEvent IDs
}

export interface GameSession {
  id: string;
  schemaVersion: number;
  teamId: string;
  teamName: string;
  createdAt: string;
  lastPlayedAt: string;
  currentDate: string; // ISO 8601 — "now" of the campaign
  matchHistory: MatchDay[];
  activeInjuries: InjuryEvent[];
  resolvedInjuries: InjuryEvent[];
}

export interface DayContext {
  isMatchDay: boolean;
}

export interface AppState {
  players: Player[];
  injuryProfiles: Map<string, InjuryProfile>;
  view: AppView;
  selectedTeamId: string | null;
  sessions: GameSession[];
  activeSessionId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setView: (view: AppView) => void;
  selectTeam: (teamId: string) => void;
  loadTeamData: (teamId: string) => Promise<void>;
  createSession: (teamId: string) => Promise<void>;
  loadSession: (sessionId: string) => Promise<void>;
  advanceToDate: (targetDate: string, opponent?: string) => Promise<void>;
  initializeApp: () => Promise<void>;
}
