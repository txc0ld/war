import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Battle } from '@warpath/shared';
import { Header } from '@/components/layout/Header';
import { BattleEngine } from '@/components/battle/BattleEngine';
import { getBattle } from '@/lib/api';
import { useSessionAddress } from '@/hooks/useSessionAddress';
import MapPage from './MapPage';

type ReplayState = 'idle' | 'playing' | 'complete';

export default function BattlePage(): React.ReactNode {
  const sessionAddress = useSessionAddress();
  const { id } = useParams<{ id: string }>();
  const [battle, setBattle] = useState<Battle | null>(null);
  const [winner, setWinner] = useState<'left' | 'right' | null>(null);
  const [replayState, setReplayState] = useState<ReplayState>('idle');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replayKey, setReplayKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadBattle(): Promise<void> {
      if (!id) {
        setBattle(null);
        setError('Battle ID missing');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      setWinner(null);
      setReplayState('idle');

      try {
        const nextBattle = await getBattle(id);

        if (cancelled) {
          return;
        }

        setBattle(nextBattle);
        setReplayState('playing');
      } catch (loadError) {
        if (cancelled) {
          return;
        }

        setBattle(null);
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Failed to load battle replay'
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadBattle();

    return () => {
      cancelled = true;
    };
  }, [id, replayKey]);

  const playerSide = useMemo<'left' | 'right'>(() => {
    if (!battle || !sessionAddress) {
      return 'left';
    }

    const normalizedAddress = sessionAddress.toLowerCase();
    if (battle.right.address.toLowerCase() === normalizedAddress) {
      return 'right';
    }

    return 'left';
  }, [battle, sessionAddress]);

  const handleReplayComplete = useCallback((nextWinner: 'left' | 'right') => {
    setWinner(nextWinner);
    setReplayState('complete');
  }, []);

  const handleReplayAgain = useCallback(() => {
    setWinner(null);
    setReplayState('playing');
    setReplayKey((current) => current + 1);
  }, []);

  if (!sessionAddress) {
    return <MapPage />;
  }

  return (
    <div className="leaderboard-page">
      <Header />
      <main className="leaderboard-page__content">
        {isLoading ? (
          <section className="warpath-panel warpath-panel--tight">
            <p className="panel-label">Battle Feed</p>
            <h1 className="panel-title">LOADING REPLAY</h1>
            <p className="panel-copy">
              Hydrating recorded battle data for {id ?? 'UNKNOWN'}.
            </p>
          </section>
        ) : null}

        {!isLoading && error ? (
          <section className="warpath-panel warpath-panel--tight">
            <p className="panel-label">Battle Feed</p>
            <h1 className="panel-title">REPLAY UNAVAILABLE</h1>
            <p className="panel-copy">{error}</p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="warpath-button"
                onClick={handleReplayAgain}
              >
                Retry
              </button>
              <Link to="/" className="warpath-button warpath-button--outline">
                Return to Map
              </Link>
            </div>
          </section>
        ) : null}

        {!isLoading && !error && battle ? (
          <>
            {battle.status === 'resolved' && replayState === 'playing' ? (
              <BattleEngine
                key={`${battle.id}-${replayKey}`}
                battle={battle}
                playerSide={playerSide}
                onComplete={handleReplayComplete}
              />
            ) : null}

            {battle.status === 'resolved' && replayState === 'complete' && winner ? (
              <section className="warpath-panel warpath-panel--tight">
                <p className="panel-label">Battle Feed</p>
                <h1 className="panel-title">
                  {winner === playerSide ? 'REPLAY COMPLETE: VICTORY' : 'REPLAY COMPLETE: DEFEAT'}
                </h1>
                <p className="panel-copy">
                  Battle {battle.id} resolved with the {winner.toUpperCase()} fighter winning the exchange.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="warpath-button"
                    onClick={handleReplayAgain}
                  >
                    Replay Again
                  </button>
                  <Link to="/" className="warpath-button warpath-button--outline">
                    Return to Map
                  </Link>
                </div>
              </section>
            ) : null}

            {battle.status !== 'resolved' ? (
              <section className="warpath-panel warpath-panel--tight">
                <p className="panel-label">Battle Feed</p>
                <h1 className="panel-title">
                  {battle.status === 'failed' ? 'RESOLUTION FAILED' : 'REPLAY PENDING'}
                </h1>
                <p className="panel-copy">
                  {battle.status === 'failed'
                    ? battle.resolutionError
                    : `Battle inputs are committed and waiting for drand round ${battle.targetRound ?? 'UNKNOWN'}${
                        battle.estimatedResolveTime
                          ? ` at ${new Date(battle.estimatedResolveTime).toLocaleString()}`
                          : ''
                      }.`}
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="warpath-button"
                    onClick={handleReplayAgain}
                  >
                    Refresh Battle
                  </button>
                  <Link to="/" className="warpath-button warpath-button--outline">
                    Return to Map
                  </Link>
                </div>
              </section>
            ) : null}
          </>
        ) : null}
      </main>
    </div>
  );
}
