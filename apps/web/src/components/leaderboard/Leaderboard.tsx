import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useSessionAddress } from '@/hooks/useSessionAddress';
import { LeaderboardRow } from './LeaderboardRow';

export function Leaderboard(): React.ReactNode {
  const { entries, isLoading, error } = useLeaderboard();
  const sessionAddress = useSessionAddress()?.toLowerCase();

  return (
    <section className="leaderboard" aria-label="Leaderboard">
      <div className="leaderboard__intro">
        <p className="leaderboard__eyebrow">Season Standings</p>
        <p className="leaderboard__copy">Win the bracket, climb the ladder, hold the line.</p>
      </div>
      <header className="leaderboard__header">
        <span>Rank</span>
        <span>Operator</span>
        <span>Score</span>
        <span>K/D</span>
        <span>Combat</span>
      </header>

      {isLoading && <div className="leaderboard__empty">LOADING LEADERBOARD…</div>}
      {error && !isLoading && <div className="leaderboard__empty">{error}</div>}

      {!isLoading && !error && entries.length === 0 && (
        <div className="leaderboard__empty">No combat records yet.</div>
      )}

      {!isLoading &&
        !error &&
        entries.map((entry, index) => (
          <LeaderboardRow
            key={entry.address}
            entry={entry}
            isActive={entry.address.toLowerCase() === sessionAddress}
            index={index}
          />
        ))}
    </section>
  );
}
