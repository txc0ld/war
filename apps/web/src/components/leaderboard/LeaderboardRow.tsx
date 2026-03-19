import type { LeaderboardEntry } from '@warpath/shared';
import { cn } from '@/lib/cn';

export interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
}

function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function getRankColor(rank: number): string | undefined {
  if (rank === 1) return 'text-accent-gold';
  if (rank === 2) return 'text-text-secondary';
  if (rank === 3) return 'text-accent-cyan';
  return undefined;
}

function formatWinLoss(wins: number, losses: number): string {
  return `${wins}/${losses}`;
}

export function LeaderboardRow({ entry, isCurrentUser }: LeaderboardRowProps) {
  const rankColor = getRankColor(entry.rank);

  return (
    <div
      className={cn(
        'grid grid-cols-4 items-center gap-4 px-4 py-2 font-mono tabular-nums',
        'border-b border-bg-border/40 transition-colors',
        'hover:bg-white/[0.03]',
        isCurrentUser && [
          'border border-accent-cyan/60',
          'shadow-[0_0_12px_rgba(0,255,255,0.15)]',
          'bg-accent-cyan/[0.05]',
        ],
      )}
    >
      <span
        className={cn(
          'text-sm font-bold',
          rankColor ?? 'text-text-muted',
        )}
      >
        #{entry.rank}
      </span>

      <span
        className={cn(
          'text-sm tracking-wide',
          isCurrentUser ? 'text-accent-cyan' : 'text-text-primary',
        )}
        title={entry.address}
      >
        {truncateAddress(entry.address)}
      </span>

      <span className="text-sm font-semibold text-text-primary text-right">
        {entry.score.toLocaleString()}
      </span>

      <span className="text-sm text-text-muted text-right">
        {formatWinLoss(entry.wins, entry.losses)}
      </span>
    </div>
  );
}
