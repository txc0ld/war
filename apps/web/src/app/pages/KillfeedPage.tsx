import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getActiveSeason } from '@warpath/shared';
import type { S2KillfeedEntry } from '@warpath/shared';
import { Header } from '@/components/layout/Header';
import { getKillfeed } from '@/lib/api';
import { s2GetKillfeed } from '@/lib/s2Api';

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

function formatS2Identity(
  address: string,
  displayName: string | null,
  ensName: string | null,
): string {
  return displayName?.trim() || ensName?.trim() || `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function S2KillfeedRow({ entry }: { entry: S2KillfeedEntry }): React.ReactNode {
  const winnerName = formatS2Identity(
    entry.winnerAddress,
    entry.winnerProfile.displayName,
    entry.winnerProfile.ensName,
  );
  const loserName = formatS2Identity(
    entry.loserAddress,
    entry.loserProfile.displayName,
    entry.loserProfile.ensName,
  );

  return (
    <article className="killfeed-row">
      <div className="killfeed-row__guns">
        <img
          src={entry.winnerImageUrl}
          alt={entry.winnerSniperName}
          className="killfeed-row__image"
        />
        <span className="killfeed-row__outcome">sniped</span>
        <img
          src={entry.loserImageUrl}
          alt={entry.loserSniperName}
          className="killfeed-row__image"
        />
      </div>
      <div className="killfeed-row__body">
        <p className="killfeed-row__headline">
          <span className="killfeed-row__winner">{winnerName}</span>
          <span className="killfeed-row__verb">eliminated</span>
          <span>{loserName}</span>
          {entry.headshot ? (
            <span className="killfeed-row__headshot">(headshot)</span>
          ) : null}
        </p>
        <p className="killfeed-row__meta">
          {entry.winnerSniperName} vs {entry.loserSniperName} · {formatResolvedAt(entry.resolvedAt)}
        </p>
      </div>
    </article>
  );
}

function S2KillfeedSection(): React.ReactNode {
  const s2Query = useQuery({
    queryKey: ['s2-killfeed', 25],
    queryFn: () => s2GetKillfeed(25),
    refetchInterval: 10_000,
  });

  const s2Entries = s2Query.data?.entries ?? [];

  return (
    <section className="social-panel social-panel--feed" aria-label="Season 2 killfeed">
      <div className="social-panel__header">
        <div>
          <p className="social-panel__eyebrow">Deadshot — Season 2</p>
          <p className="social-panel__copy">
            Live sniper eliminations from active Deadshot matches.
          </p>
        </div>
        <span className="social-panel__meta">{s2Entries.length} kills</span>
      </div>

      {s2Query.isLoading ? (
        <div className="social-panel__empty">LOADING KILLFEED…</div>
      ) : null}
      {s2Query.error ? (
        <div className="social-panel__empty">
          {s2Query.error instanceof Error
            ? s2Query.error.message
            : 'Failed to load S2 killfeed'}
        </div>
      ) : null}
      {!s2Query.isLoading && !s2Query.error && s2Entries.length === 0 ? (
        <div className="social-panel__empty">No Deadshot kills yet.</div>
      ) : null}

      <div className="killfeed-list">
        {s2Entries.map((entry) => (
          <S2KillfeedRow key={entry.battleId} entry={entry} />
        ))}
      </div>
    </section>
  );
}

function S1KillfeedSection(): React.ReactNode {
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
    <section className="social-panel social-panel--feed" aria-label="Global killfeed">
      <div className="social-panel__header">
        <div>
          <p className="social-panel__eyebrow">War Room — Season 1</p>
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
  );
}

export default function KillfeedPage(): React.ReactNode {
  const activeSeason = getActiveSeason(Date.now());

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

        {activeSeason === 2 ? <S2KillfeedSection /> : null}
        <S1KillfeedSection />
      </main>
    </div>
  );
}
