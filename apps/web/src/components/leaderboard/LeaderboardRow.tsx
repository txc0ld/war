import type { LeaderboardEntry } from '@warpath/shared';

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  isActive: boolean;
}

function shortenAddress(value: string): string {
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

export function LeaderboardRow({
  entry,
  isActive,
}: LeaderboardRowProps): React.ReactNode {
  return (
    <div className={`leaderboard__row ${isActive ? 'leaderboard__row--active' : ''}`}>
      <span className="leaderboard__rank">#{entry.rank}</span>
      <span className="leaderboard__player">{shortenAddress(entry.address)}</span>
      <span>{entry.score}</span>
      <span>
        {entry.wins}/{entry.losses}
      </span>
      <span>{entry.gunCount}</span>
    </div>
  );
}
