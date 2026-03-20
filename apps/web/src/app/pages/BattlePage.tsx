import { Link, useParams } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { useSessionAddress } from '@/hooks/useSessionAddress';
import MapPage from './MapPage';

export default function BattlePage(): React.ReactNode {
  const sessionAddress = useSessionAddress();
  const { id } = useParams<{ id: string }>();

  if (!sessionAddress) {
    return <MapPage />;
  }

  return (
    <div className="leaderboard-page">
      <Header />
      <main className="leaderboard-page__content">
        <section className="warpath-panel warpath-panel--tight">
          <p className="panel-label">Battle Feed</p>
          <h2 className="panel-title">BATTLE UNAVAILABLE</h2>
          <p className="panel-copy">
            Spectator playback for battle {id ?? 'UNKNOWN'} is not active in this build.
          </p>
          <Link to="/" className="warpath-button warpath-button--outline">
            Return to Map
          </Link>
        </section>
      </main>
    </div>
  );
}
