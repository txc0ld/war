import type { CSSProperties } from 'react';
import type { LeaderboardEntry } from '@warpath/shared';

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  isActive: boolean;
  index: number;
}

function shortenAddress(value: string): string {
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

export function LeaderboardRow({
  entry,
  isActive,
  index,
}: LeaderboardRowProps): React.ReactNode {
  return (
    <div
      className={`leaderboard__row ${isActive ? 'leaderboard__row--active' : ''}`}
      style={{ '--row-index': index } as CSSProperties}
    >
      <span className="leaderboard__rank">#{entry.rank}</span>
      <span className="leaderboard__player">
        <span className="leaderboard__player-main">
          <span className="leaderboard__player-address">{shortenAddress(entry.address)}</span>
          {isActive ? <span className="leaderboard__badge">YOU</span> : null}
        </span>
        <span className="leaderboard__player-meta">
          <span>W/L {entry.wins}/{entry.losses}</span>
          <span>{entry.gunCount} guns</span>
        </span>
      </span>
      <span className="leaderboard__score">{entry.score}</span>
      <span className="leaderboard__combat">
        <span className="leaderboard__combat-record">
          {entry.wins}/{entry.losses}
        </span>
        <span className="leaderboard__combat-guns">{entry.gunCount} guns</span>
      </span>
    </div>
  );
}
