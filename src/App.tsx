import { useEffect } from 'react';
import { useStore } from '@/store/gameStore';
import TeamSelector from '@/components/TeamSelector';
import SessionManager from '@/components/SessionManager';
import InjuryBoard from '@/components/InjuryBoard';
import MatchDateEntry from '@/components/MatchDateEntry';

export default function App() {
  const view = useStore(s => s.view);
  const initializeApp = useStore(s => s.initializeApp);
  const error = useStore(s => s.error);

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  if (error !== null && error.toLowerCase().includes('storage unavailable')) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <p className="text-yellow-400">⚠ Storage unavailable — session will not be saved</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {view === 'team-select' && <TeamSelector />}
      {view === 'session-select' && <SessionManager />}
      {view === 'injury-board' && <InjuryBoard />}
      {view === 'advance-date' && <MatchDateEntry />}
    </div>
  );
}
