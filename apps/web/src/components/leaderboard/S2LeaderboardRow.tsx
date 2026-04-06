import type { CSSProperties } from 'react';
import type { S2LeaderboardEntry } from '@warpath/shared';

interface S2LeaderboardRowProps {
  entry: S2LeaderboardEntry;
  isActive: boolean;
  index: number;
}

function shortenAddress(value: string): string {
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

function formatIdentity(
  address: string,
  displayName: string | null,
  ensName: string | null,
): string {
  return displayName?.trim() || ensName?.trim() || shortenAddress(address);
}

function formatHeadshotPct(value: number): string {
  return `${Math.round(value)}%`;
}

export function S2LeaderboardRow({
  entry,
  isActive,
  index,
}: S2LeaderboardRowProps): React.ReactNode {
  return (
    <div
      className={`leaderboard__row ${isActive ? 'leaderboard__row--active' : ''}`}
      style={{ '--row-index': index } as CSSProperties}
    >
      <span className="leaderboard__rank">#{entry.rank}</span>
      <span className="leaderboard__player">
        <span className="leaderboard__player-main">
          <span className="leaderboard__player-address">
            {formatIdentity(entry.address, entry.displayName, entry.ensName)}
          </span>
          {isActive ? <span className="leaderboard__badge">YOU</span> : null}
        </span>
        <span className="leaderboard__player-meta">
          <span>W/L {entry.wins}/{entry.losses}</span>
          <span>{entry.sniperCount} snipers</span>
        </span>
      </span>
      <span className="leaderboard__score">{entry.score}</span>
      <span className="leaderboard__kd">
        {entry.wins}/{entry.losses}
      </span>
      <span className="leaderboard__combat">
        {formatHeadshotPct(entry.headshotPct)}
      </span>
      <span className="leaderboard__streak">
        {entry.winStreak > 0 ? `+${entry.winStreak}` : entry.winStreak}
      </span>
    </div>
  );
}
