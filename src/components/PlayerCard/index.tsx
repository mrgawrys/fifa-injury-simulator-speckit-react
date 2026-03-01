import type { Player, InjuryEvent } from '@/types';
import { differenceInCalendarDays, parseISO } from 'date-fns';

interface PlayerCardProps {
  player: Player;
  injury?: InjuryEvent;
  currentDate: string;
  explanation?: string;
}

const TIER_COLORS: Record<string, string> = {
  minimal: 'bg-yellow-600 text-yellow-100',
  moderate: 'bg-orange-600 text-orange-100',
  severe: 'bg-red-700 text-red-100',
};

export default function PlayerCard({
  player,
  injury,
  currentDate,
  explanation,
}: PlayerCardProps) {
  const daysLeft = injury !== undefined
    ? differenceInCalendarDays(parseISO(injury.returnDate), parseISO(currentDate))
    : 0;

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-800 border border-gray-700">
      {/* Position badge */}
      <span className="text-xs font-bold text-gray-400 w-8 shrink-0 pt-0.5">
        {player.position}
      </span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white truncate">{player.name}</span>
          <span className="text-gray-500 text-xs">{player.overallRating}</span>
        </div>

        {injury !== undefined ? (
          <div className="mt-1">
            <span
              className={`inline-block text-xs font-semibold px-2 py-0.5 rounded ${TIER_COLORS[injury.injuryTier] ?? 'bg-gray-600'}`}
            >
              {injury.injuryTier.charAt(0).toUpperCase() + injury.injuryTier.slice(1)}
            </span>
            <p className="text-sm text-gray-300 mt-1">
              Out until {injury.returnDate}
              {daysLeft > 0 && (
                <span className="text-gray-500 ml-1">({daysLeft}d)</span>
              )}
            </p>
            {explanation !== undefined && explanation !== '' && (
              <p className="text-xs text-gray-500 mt-0.5">{explanation}</p>
            )}
          </div>
        ) : (
          <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded bg-green-700 text-green-100 mt-1">
            Available
          </span>
        )}
      </div>
    </div>
  );
}
