import { create } from 'zustand';
import { formatISO } from 'date-fns';
import type { AppState, AppView, GameSession, InjuryEvent } from '@/types';
import { loadPlayers, loadInjuryProfiles, DataUnavailableError } from '@/data/loaders';
import {
  getCachedPlayers,
  setCachedPlayers,
  getCachedProfiles,
  setCachedProfiles,
} from '@/data/cache';
import { getAllSessions, saveSession } from '@/store/persistence';
import { simulateAdvanceToDate } from '@/simulation/simulator';

function today(): string {
  return formatISO(new Date(), { representation: 'date' });
}

export const useStore = create<AppState>((set, get) => ({
  players: [],
  injuryProfiles: new Map(),
  view: 'team-select',
  selectedTeamId: null,
  sessions: [],
  activeSessionId: null,
  isLoading: false,
  error: null,

  setView: (view: AppView) => set({ view }),

  selectTeam: (teamId: string) => {
    set({ selectedTeamId: teamId });
  },

  loadTeamData: async (teamId: string) => {
    set({ isLoading: true, error: null });
    try {
      // Try cache first
      let players = await getCachedPlayers(teamId);
      let profiles = await getCachedProfiles(teamId);

      if (players === null) {
        try {
          const allPlayers = await loadPlayers();
          players = allPlayers.filter(p => p.teamId === teamId);
          await setCachedPlayers(teamId, players);
        } catch (err) {
          if (err instanceof DataUnavailableError) {
            set({ isLoading: false, error: err.message });
            return;
          }
          throw err;
        }
      }

      if (profiles === null) {
        try {
          const allProfiles = await loadInjuryProfiles();
          profiles = allProfiles;
          await setCachedProfiles(teamId, profiles);
        } catch (_err) {
          // Non-fatal: app works with default profiles
          profiles = [];
        }
      }

      const profileMap = new Map(profiles.map(p => [p.playerId, p]));
      set({ players, injuryProfiles: profileMap, isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Unknown error loading team data',
      });
    }
  },

  createSession: async (teamId: string) => {
    const { players } = get();
    const teamName = players[0]?.teamName ?? teamId;
    const now = new Date().toISOString();

    const session: GameSession = {
      id: crypto.randomUUID(),
      schemaVersion: 1,
      teamId,
      teamName,
      createdAt: now,
      lastPlayedAt: now,
      currentDate: today(),
      matchHistory: [],
      activeInjuries: [],
      resolvedInjuries: [],
    };

    await saveSession(session);
    set(state => ({
      sessions: [...state.sessions, session],
      activeSessionId: session.id,
    }));
    localStorage.setItem('activeSessionId', session.id);
  },

  loadSession: async (sessionId: string) => {
    const session = get().sessions.find(s => s.id === sessionId);
    if (!session) return;

    set({ activeSessionId: sessionId });
    localStorage.setItem('activeSessionId', sessionId);

    // Ensure team data is loaded for this session
    if (get().selectedTeamId !== session.teamId) {
      set({ selectedTeamId: session.teamId });
      await get().loadTeamData(session.teamId);
    }
  },

  advanceToDate: async (targetDate: string, opponent = '') => {
    const { sessions, activeSessionId, players, injuryProfiles } = get();
    const session = sessions.find(s => s.id === activeSessionId);
    if (!session) return;
    if (targetDate <= session.currentDate) return;

    set({ isLoading: true, error: null });

    const newEvents: InjuryEvent[] = simulateAdvanceToDate(
      session,
      players,
      injuryProfiles,
      targetDate,
    );

    const updatedSession: GameSession = {
      ...session,
      currentDate: targetDate,
      lastPlayedAt: new Date().toISOString(),
      matchHistory: [
        ...session.matchHistory,
        {
          date: targetDate,
          opponent,
          injuryEvents: newEvents.map(e => e.id),
        },
      ],
      activeInjuries: [
        // Keep existing active injuries not yet resolved
        ...session.activeInjuries.filter(e => e.returnDate >= targetDate),
        // Add newly injured players
        ...newEvents,
      ],
      resolvedInjuries: [
        ...session.resolvedInjuries,
        // Move expired active injuries to resolved
        ...session.activeInjuries.filter(e => e.returnDate < targetDate),
      ],
    };

    await saveSession(updatedSession);
    set(state => ({
      sessions: state.sessions.map(s =>
        s.id === activeSessionId ? updatedSession : s,
      ),
      isLoading: false,
      view: 'injury-board',
    }));
  },

  initializeApp: async () => {
    set({ isLoading: true, error: null });
    try {
      const sessions = await getAllSessions();
      const storedId = localStorage.getItem('activeSessionId');
      const activeSession = sessions.find(s => s.id === storedId) ?? null;

      set({ sessions, isLoading: false });

      if (activeSession !== null) {
        set({
          activeSessionId: activeSession.id,
          selectedTeamId: activeSession.teamId,
        });
        await get().loadTeamData(activeSession.teamId);
        set({ view: 'injury-board' });
      }
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to initialize app',
      });
    }
  },
}));
