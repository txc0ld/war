import { useS2Leaderboard } from '@/hooks/useS2Leaderboard';
import { useSessionAddress } from '@/hooks/useSessionAddress';
import { S2LeaderboardRow } from './S2LeaderboardRow';

export function S2Leaderboard(): React.ReactNode {
  const { entries, isLoading, error } = useS2Leaderboard(50, 0);
  const sessionAddress = useSessionAddress()?.toLowerCase();

  return (
    <section className="leaderboard" aria-label="Season 2 Leaderboard">
      <div className="leaderboard__intro">
        <p className="leaderboard__eyebrow">Deadshot Rankings</p>
        <p className="leaderboard__copy">Top operators ranked by score, headshots, and win streaks.</p>
      </div>
      <header className="leaderboard__header leaderboard__header--s2">
        <span>Rank</span>
        <span>Operator</span>
        <span>Score</span>
        <span>W/L</span>
        <span>HS%</span>
        <span>Streak</span>
      </header>

      {isLoading && <div className="leaderboard__empty">LOADING LEADERBOARD…</div>}
      {error && !isLoading && <div className="leaderboard__empty">{error}</div>}

      {!isLoading && !error && entries.length === 0 && (
        <div className="leaderboard__empty">No combat records yet.</div>
      )}

      {!isLoading &&
        !error &&
        entries.map((entry, index) => (
          <S2LeaderboardRow
            key={entry.address}
            entry={entry}
            isActive={entry.address.toLowerCase() === sessionAddress}
            index={index}
          />
        ))}
    </section>
  );
}
