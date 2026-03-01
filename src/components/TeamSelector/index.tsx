import { useState, useEffect, useMemo } from 'react';
import { useStore } from '@/store/gameStore';
import TeamSearchInput from './TeamSearchInput';
import TeamListItem from './TeamListItem';
import { loadPlayers, DataUnavailableError } from '@/data/loaders';
import type { Player } from '@/types';

export default function TeamSelector() {
  const [query, setQuery] = useState('');
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const selectTeam = useStore(s => s.selectTeam);
  const loadTeamData = useStore(s => s.loadTeamData);
  const setView = useStore(s => s.setView);

  // Load full player list to extract all unique teams
  useEffect(() => {
    loadPlayers()
      .then(players => setAllPlayers(players))
      .catch(err => {
        if (err instanceof DataUnavailableError) {
          setLoadError(err.message);
        }
      });
  }, []);

  const teams = useMemo(() => {
    const teamMap = new Map<string, string>();
    for (const p of allPlayers) {
      teamMap.set(p.teamId, p.teamName);
    }
    return Array.from(teamMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allPlayers]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return teams;
    return teams.filter(t => t.name.toLowerCase().includes(q));
  }, [teams, query]);

  async function handleSelect(teamId: string) {
    selectTeam(teamId);
    await loadTeamData(teamId);
    setView('session-select');
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-2">FIFA Injury Tracker</h1>
      <p className="text-gray-400 mb-6">Select your Premier League team</p>

      <TeamSearchInput value={query} onChange={setQuery} />

      {loadError !== null && (
        <p className="mt-4 text-red-400 text-sm">{loadError}</p>
      )}

      <ul className="mt-4 flex flex-col gap-2">
        {filtered.map(team => (
          <li key={team.id}>
            <TeamListItem
              teamName={team.name}
              onClick={() => void handleSelect(team.id)}
            />
          </li>
        ))}
        {filtered.length === 0 && allPlayers.length > 0 && (
          <li className="text-gray-500 px-4 py-3">No teams match "{query}"</li>
        )}
        {allPlayers.length === 0 && loadError === null && (
          <li className="text-gray-500 px-4 py-3">Loading teams…</li>
        )}
      </ul>
    </div>
  );
}
