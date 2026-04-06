import { useState } from 'react';
import { getActiveSeason } from '@warpath/shared';
import type { ActiveSeason } from '@warpath/shared';
import { Header } from '@/components/layout/Header';
import { Leaderboard } from '@/components/leaderboard/Leaderboard';
import { S2Leaderboard } from '@/components/leaderboard/S2Leaderboard';
import { SeasonTabs } from '@/components/leaderboard/SeasonTabs';
import { SeasonTimer } from '@/components/leaderboard/SeasonTimer';
import { useSessionAddress } from '@/hooks/useSessionAddress';
import MapPage from './MapPage';

export default function LeaderboardPage(): React.ReactNode {
  const sessionAddress = useSessionAddress();
  const [viewSeason, setViewSeason] = useState<ActiveSeason>(
    () => getActiveSeason(Date.now())
  );

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
            Live standings across the active bracket. Your connected wallet row stays surfaced inside the table.
          </p>
          <SeasonTimer />
        </section>
        <SeasonTabs activeSeason={viewSeason} onSelect={setViewSeason} />
        {viewSeason === 2 ? <S2Leaderboard /> : <Leaderboard />}
      </main>
    </div>
  );
}
