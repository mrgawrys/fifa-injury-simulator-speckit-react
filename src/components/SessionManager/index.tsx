import { useStore } from '@/store/gameStore';

export default function SessionManager() {
  const sessions = useStore(s => s.sessions);
  const selectedTeamId = useStore(s => s.selectedTeamId);
  const createSession = useStore(s => s.createSession);
  const loadSession = useStore(s => s.loadSession);
  const setView = useStore(s => s.setView);

  const teamSessions = sessions
    .filter(s => s.teamId === selectedTeamId)
    .sort((a, b) => b.lastPlayedAt.localeCompare(a.lastPlayedAt));

  const teamName = teamSessions[0]?.teamName ?? selectedTeamId ?? 'Unknown Team';

  async function handleNew() {
    if (selectedTeamId !== null) {
      await createSession(selectedTeamId);
      setView('injury-board');
    }
  }

  async function handleResume(sessionId: string) {
    await loadSession(sessionId);
    setView('injury-board');
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <button
        onClick={() => setView('team-select')}
        className="text-gray-400 hover:text-white text-sm mb-4"
      >
        ← Back
      </button>

      <h1 className="text-2xl font-bold text-white mb-1">{teamName}</h1>
      <p className="text-gray-400 mb-6">Manage your campaigns</p>

      {/* Start fresh */}
      <div className="mb-6">
        <button
          onClick={() => void handleNew()}
          className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-lg transition-colors"
        >
          + New Campaign
        </button>
      </div>

      {/* Existing sessions */}
      {teamSessions.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Continue
          </h2>
          <ul className="flex flex-col gap-2">
            {teamSessions.map(session => (
              <li key={session.id}>
                <button
                  onClick={() => void handleResume(session.id)}
                  className="w-full text-left px-4 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
                >
                  <div className="text-white font-medium">{session.currentDate}</div>
                  <div className="text-gray-400 text-sm">
                    {session.matchHistory.length} matches played ·{' '}
                    {session.activeInjuries.length} active injuries
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
