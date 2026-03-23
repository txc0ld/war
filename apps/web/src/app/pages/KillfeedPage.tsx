import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/Header';
import { getKillfeed } from '@/lib/api';

function formatIdentity(
  address: string,
  displayName: string | null,
  ensName: string | null,
  isVisible: boolean
): string {
  if (isVisible && (displayName?.trim() || ensName?.trim())) {
    return displayName?.trim() || ensName?.trim() || `${address.slice(0, 6)}…${address.slice(-4)}`;
  }

  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function formatResolvedAt(value: string): string {
  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function KillfeedPage(): React.ReactNode {
  const killfeedQuery = useQuery({
    queryKey: ['killfeed', 40],
    queryFn: () => getKillfeed(40),
    refetchInterval: 10_000,
  });

  const entries =
    killfeedQuery.data?.entries.filter(
      (entry) =>
        entry.winnerProfile.showBattleResults &&
        entry.loserProfile.showBattleResults
    ) ?? [];

  return (
    <div className="social-page">
      <Header />
      <main className="social-page__content">
        <section className="social-page__masthead">
          <p className="panel-label">Global Combat Feed</p>
          <h1 className="panel-title">KILLFEED</h1>
          <p className="panel-copy">
            Real battle outcomes from matched wallets only. Latest resolved fights surface here in real time.
          </p>
        </section>

        <section className="social-panel social-panel--feed" aria-label="Global killfeed">
          <div className="social-panel__header">
            <div>
              <p className="social-panel__eyebrow">Live Resolutions</p>
              <p className="social-panel__copy">
                Winner, defeated operator, gun pairings, and replay access.
              </p>
            </div>
            <span className="social-panel__meta">{entries.length} battles</span>
          </div>

          {killfeedQuery.isLoading ? (
            <div className="social-panel__empty">LOADING KILLFEED…</div>
          ) : null}
          {killfeedQuery.error ? (
            <div className="social-panel__empty">
              {killfeedQuery.error instanceof Error
                ? killfeedQuery.error.message
                : 'Failed to load killfeed'}
            </div>
          ) : null}
          {!killfeedQuery.isLoading && !killfeedQuery.error && entries.length === 0 ? (
            <div className="social-panel__empty">No public battle results yet.</div>
          ) : null}

          <div className="killfeed-list">
            {entries.map((entry) => (
              <article key={entry.battleId} className="killfeed-row">
                <div className="killfeed-row__guns">
                  <img
                    src={entry.winnerImageUrl}
                    alt={entry.winnerGunName}
                    className="killfeed-row__image"
                  />
                  <span className="killfeed-row__outcome">defeated</span>
                  <img
                    src={entry.loserImageUrl}
                    alt={entry.loserGunName}
                    className="killfeed-row__image"
                  />
                </div>
                <div className="killfeed-row__body">
                  <p className="killfeed-row__headline">
                    <span className="killfeed-row__winner">
                      {formatIdentity(
                        entry.winnerAddress,
                        entry.winnerProfile.displayName,
                        entry.winnerProfile.ensName,
                        entry.winnerProfile.showBattleResults
                      )}
                    </span>
                    <span className="killfeed-row__verb">won with</span>
                    <span>{entry.winnerGunName}</span>
                  </p>
                  <p className="killfeed-row__meta">
                    Took down{' '}
                    {formatIdentity(
                      entry.loserAddress,
                      entry.loserProfile.displayName,
                      entry.loserProfile.ensName,
                      entry.loserProfile.showBattleResults
                    )}{' '}
                    using {entry.loserGunName} · {formatResolvedAt(entry.resolvedAt)}
                  </p>
                </div>
                <Link className="warpath-button warpath-button--ghost" to={`/battle/${entry.battleId}`}>
                  Replay
                </Link>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
