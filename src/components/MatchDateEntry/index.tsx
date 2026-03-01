import { useState } from 'react';
import { addDays, parseISO, formatISO } from 'date-fns';
import { useStore } from '@/store/gameStore';

function tomorrow(fromDate: string): string {
  return formatISO(addDays(parseISO(fromDate), 1), { representation: 'date' });
}

export default function MatchDateEntry() {
  const sessions = useStore(s => s.sessions);
  const activeSessionId = useStore(s => s.activeSessionId);
  const advanceToDate = useStore(s => s.advanceToDate);
  const setView = useStore(s => s.setView);
  const isLoading = useStore(s => s.isLoading);

  const session = sessions.find(s => s.id === activeSessionId);
  const minDate = session !== undefined ? tomorrow(session.currentDate) : '';

  const [targetDate, setTargetDate] = useState(minDate);
  const [opponent, setOpponent] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  function validate(): boolean {
    if (session === undefined) return false;
    if (targetDate <= session.currentDate) {
      setValidationError('Date must be after the current campaign date.');
      return false;
    }
    setValidationError(null);
    return true;
  }

  async function handleSimulate() {
    if (!validate()) return;
    await advanceToDate(targetDate, opponent);
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <button
        onClick={() => setView('injury-board')}
        className="text-gray-400 hover:text-white text-sm mb-6"
      >
        ← Back to Injury Board
      </button>

      <h1 className="text-2xl font-bold text-white mb-1">Advance to Match</h1>
      {session !== undefined && (
        <p className="text-gray-400 mb-6 text-sm">
          Current date: {session.currentDate}
        </p>
      )}

      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Match date
          </label>
          <input
            type="date"
            value={targetDate}
            min={minDate}
            onChange={e => setTargetDate(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-600 text-white focus:outline-none focus:border-blue-500"
          />
          {validationError !== null && (
            <p className="text-red-400 text-sm mt-1">{validationError}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Opponent (optional)
          </label>
          <input
            type="text"
            value={opponent}
            onChange={e => setOpponent(e.target.value)}
            placeholder="e.g. Manchester City"
            className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <button
          onClick={() => void handleSimulate()}
          disabled={isLoading || targetDate === ''}
          className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-400 text-white font-semibold text-lg transition-colors"
        >
          {isLoading ? 'Simulating injuries…' : 'Simulate →'}
        </button>
      </div>
    </div>
  );
}
