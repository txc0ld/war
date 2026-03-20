import { Header } from '@/components/layout/Header';
import { Leaderboard } from '@/components/leaderboard/Leaderboard';
import { useSessionAddress } from '@/hooks/useSessionAddress';
import MapPage from './MapPage';

export default function LeaderboardPage(): React.ReactNode {
  const sessionAddress = useSessionAddress();

  if (!sessionAddress) {
    return <MapPage />;
  }

  return (
    <div className="leaderboard-page">
      <Header />
      <main className="leaderboard-page__content">
        <section className="leaderboard-page__masthead">
          <p className="panel-label">Combat Ladder</p>
          <h1 className="panel-title">LEADERBOARD</h1>
          <p className="panel-copy">
            Live standings across the demo bracket. Your active wallet row stays surfaced inside the table.
          </p>
        </section>
        <Leaderboard />
      </main>
    </div>
  );
}
