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
        <Leaderboard />
      </main>
    </div>
  );
}
