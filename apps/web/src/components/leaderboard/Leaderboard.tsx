import { cn } from '@/lib/cn';
import { Spinner } from '@/components/ui/Spinner';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { LeaderboardRow } from './LeaderboardRow';

export interface LeaderboardProps {
  currentUserAddress?: string;
  limit?: number;
  offset?: number;
  className?: string;
}

const HEADER_LABELS = ['RANK', 'PLAYER', 'SCORE', 'W/L'] as const;

export function Leaderboard({
  currentUserAddress,
  limit,
  offset,
  className,
}: LeaderboardProps) {
  const { entries, isLoading, error } = useLeaderboard(limit, offset);

  return (
    <div
      className={cn(
        'rounded-lg border border-bg-border bg-bg-card/90 backdrop-blur',
        'overflow-hidden shadow-lg',
        className,
      )}
    >
      {/* Title */}
      <div className="px-4 py-3 border-b border-bg-border">
        <h2 className="font-mono text-sm font-bold uppercase tracking-widest text-text-primary">
          Leaderboard
        </h2>
      </div>

      {/* Header row */}
      <div className="grid grid-cols-4 gap-4 px-4 py-2 border-b border-bg-border font-mono">
        {HEADER_LABELS.map((label, i) => (
          <span
            key={label}
            className={cn(
              'text-xs font-semibold uppercase tracking-wider text-text-muted',
              i >= 2 && 'text-right',
            )}
          >
            {label}
          </span>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-[200px]">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Spinner size="md" className="text-accent-cyan" />
          </div>
        )}

        {!isLoading && error !== null && (
          <div className="flex items-center justify-center py-12 px-4">
            <p className="font-mono text-sm text-red-400">{error}</p>
          </div>
        )}

        {!isLoading && error === null && entries.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <p className="font-mono text-sm text-text-muted">No warriors yet</p>
          </div>
        )}

        {!isLoading && error === null && entries.length > 0 && (
          <div>
            {entries.map((entry) => (
              <LeaderboardRow
                key={entry.address}
                entry={entry}
                isCurrentUser={
                  currentUserAddress !== undefined &&
                  entry.address.toLowerCase() ===
                    currentUserAddress.toLowerCase()
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
