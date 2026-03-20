import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useSessionAddress } from '@/hooks/useSessionAddress';
import { LeaderboardRow } from './LeaderboardRow';

export function Leaderboard(): React.ReactNode {
  const { entries, isLoading, error } = useLeaderboard();
  const sessionAddress = useSessionAddress()?.toLowerCase();

  return (
    <section className="leaderboard" aria-label="Leaderboard">
      <header className="leaderboard__header">
        <span>Rank</span>
        <span>Player</span>
        <span>Score</span>
        <span>W/L</span>
        <span>Guns</span>
      </header>

      {isLoading && <div className="leaderboard__empty">LOADING LEADERBOARD…</div>}
      {error && !isLoading && <div className="leaderboard__empty">{error}</div>}

      {!isLoading && !error && entries.length === 0 && (
        <div className="leaderboard__empty">No combat records yet.</div>
      )}

      {!isLoading &&
        !error &&
        entries.map((entry) => (
          <LeaderboardRow
            key={entry.address}
            entry={entry}
            isActive={entry.address.toLowerCase() === sessionAddress}
          />
        ))}
    </section>
  );
}
