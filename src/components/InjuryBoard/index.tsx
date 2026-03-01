import { useStore } from '@/store/gameStore';
import PlayerCard from '@/components/PlayerCard';
import { explainInjuryFactors } from '@/simulation/riskFactors';
import { DEFAULT_INJURY_PROFILE } from '@/types';

export default function InjuryBoard() {
  const sessions = useStore(s => s.sessions);
  const activeSessionId = useStore(s => s.activeSessionId);
  const players = useStore(s => s.players);
  const injuryProfiles = useStore(s => s.injuryProfiles);
  const setView = useStore(s => s.setView);
  const isLoading = useStore(s => s.isLoading);

  const session = sessions.find(s => s.id === activeSessionId);

  if (session === undefined) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 text-gray-400">
        No active session. <button className="text-blue-400 underline" onClick={() => setView('team-select')}>Start a new campaign</button>
      </div>
    );
  }

  const activeInjuries = session.activeInjuries.filter(
    e => e.returnDate >= session.currentDate,
  );
  const injuredIds = new Set(activeInjuries.map(e => e.playerId));
  const availablePlayers = players.filter(p => !injuredIds.has(p.id));

  // Day difference from session start to current date for display
  const campaignDay =
    session.matchHistory.length > 0
      ? session.matchHistory.length
      : 0;

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-white">{session.teamName}</h1>
          <p className="text-gray-400 text-sm">
            Match {campaignDay} · {session.currentDate}
          </p>
        </div>
        <button
          onClick={() => setView('team-select')}
          className="text-gray-500 hover:text-white text-sm"
        >
          ← Teams
        </button>
      </div>

      {/* Advance button */}
      <button
        onClick={() => setView('advance-date')}
        disabled={isLoading}
        className="w-full py-3 mb-6 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-400 text-white font-semibold transition-colors"
      >
        {isLoading ? 'Simulating…' : 'Advance to Next Match →'}
      </button>

      {/* Injured section */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">
          Currently Injured ({activeInjuries.length})
        </h2>
        {activeInjuries.length === 0 ? (
          <div className="text-center py-6 text-gray-500 rounded-lg bg-gray-800 border border-gray-700">
            <p className="text-2xl mb-1">✓</p>
            <p>All players available</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {activeInjuries.map(injury => {
              const player = players.find(p => p.id === injury.playerId);
              if (player === undefined) return null;
              const profile = injuryProfiles.get(player.id) ?? DEFAULT_INJURY_PROFILE;
              const explanation = explainInjuryFactors(
                player.age,
                player.position,
                profile,
                false,
              );
              return (
                <li key={injury.id}>
                  <PlayerCard
                    player={player}
                    injury={injury}
                    currentDate={session.currentDate}
                    explanation={explanation}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Available section */}
      <section>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">
          Available ({availablePlayers.length})
        </h2>
        <ul className="flex flex-col gap-2">
          {availablePlayers.map(player => (
            <li key={player.id}>
              <PlayerCard
                player={player}
                currentDate={session.currentDate}
              />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
