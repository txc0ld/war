import { useCallback, useState, lazy, Suspense } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import { useStore } from '@/store';
import { useMatchmaking } from '@/hooks/useMatchmaking';
import { MatchingPulse } from './MatchingPulse';
import { VSReveal } from './VSReveal';
import { BattleEngine } from './BattleEngine';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { DEMO_MODE, DEMO_PLAYER_ADDRESS } from '@/lib/demo';

const LazyVictorOverlay = lazy(() =>
  import('./VictorOverlay').then((m) => ({ default: m.VictorOverlay }))
);
const LazyDeathOverlay = lazy(() =>
  import('./DeathOverlay').then((m) => ({ default: m.DeathOverlay }))
);

function ResultFallback({ type, onDismiss }: { type: 'win' | 'loss'; onDismiss: () => void }): React.ReactNode {
  const isWin = type === 'win';
  return (
    <div
      className="pointer-events-auto fixed inset-0 z-40 flex cursor-pointer items-center justify-center bg-black/80"
      onClick={onDismiss}
    >
      <div className="text-center">
        <h1
          className={cn(
            'font-mono text-5xl font-bold uppercase tracking-widest md:text-7xl',
            isWin ? 'text-accent-neon' : 'text-accent-red'
          )}
        >
          {isWin ? 'VICTOR' : 'ELIMINATED'}
        </h1>
        <p
          className={cn(
            'mt-4 font-mono text-3xl font-bold',
            isWin ? 'text-accent-neon' : 'text-accent-red'
          )}
        >
          {isWin ? '+100' : '-100'}
        </p>
        <p className="mt-6 font-mono text-xs uppercase tracking-wider text-text-dim">
          Click anywhere to continue
        </p>
      </div>
    </div>
  );
}

export function GameOverlay(): React.ReactNode {
  const { address } = useAccount();
  const {
    phase,
    setPhase,
    currentBattle,
    selectedCountry,
    selectedGun,
    reset: resetBattle,
    clearCountry,
    clearGun,
  } = useStore();

  const { startMatchmaking, cancelMatchmaking, error: matchError } =
    useMatchmaking();

  const [battleWinner, setBattleWinner] = useState<'left' | 'right' | null>(
    null
  );

  const handleFight = useCallback(async () => {
    await startMatchmaking();
  }, [startMatchmaking]);

  const handleBattleComplete = useCallback(
    (winner: 'left' | 'right') => {
      setBattleWinner(winner);

      const normalizedAddress = (DEMO_MODE ? DEMO_PLAYER_ADDRESS : address)?.toLowerCase();
      const playerSide =
        normalizedAddress === currentBattle?.left.address.toLowerCase()
          ? 'left'
          : normalizedAddress === currentBattle?.right.address.toLowerCase()
            ? 'right'
            : 'left';

      setPhase(winner === playerSide ? 'result_win' : 'result_loss');
    },
    [address, currentBattle, setPhase]
  );

  const handleVSComplete = useCallback(() => {
    setPhase('fighting');
  }, [setPhase]);

  const handleResultDismiss = useCallback(() => {
    setBattleWinner(null);
    resetBattle();
    clearCountry();
    clearGun();
  }, [resetBattle, clearCountry, clearGun]);

  return (
    <>
      {/* Bottom HUD */}
      <div className="pointer-events-auto fixed bottom-4 left-4 z-30 flex max-w-[320px] flex-col gap-3">
        {selectedCountry && (
          <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(7,19,27,0.92)_0%,rgba(4,10,16,0.78)_100%)] px-4 py-3 shadow-[0_18px_60px_rgba(0,0,0,0.34)] backdrop-blur-xl">
            <div className="mb-3 h-px w-16 bg-gradient-to-r from-accent-neon/60 to-transparent" />
            <p className="font-mono text-xs uppercase tracking-wider text-text-muted">
              Deploy Zone
            </p>
            <p className="font-mono text-sm font-semibold uppercase tracking-wider text-accent-neon">
              {selectedCountry}
            </p>
            {selectedGun && (
              <div className="mt-2 border-t border-white/10 pt-2">
                <p className="font-mono text-xs uppercase tracking-wider text-text-muted">
                  Weapon
                </p>
                <p className="font-mono text-sm font-semibold uppercase tracking-wider text-accent-cyan">
                  {selectedGun.name}
                </p>
                <div className="mt-1 flex gap-4 font-mono text-[10px] tabular-nums">
                  <span className="text-accent-red">
                    DMG {selectedGun.stats.damage}
                  </span>
                  <span className="text-accent-gold">
                    DDG {selectedGun.stats.dodge}
                  </span>
                  <span className="text-accent-magenta">
                    SPD {selectedGun.stats.speed}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {selectedCountry && selectedGun && phase === 'idle' && (
          <Button variant="secondary" size="md" onClick={handleFight}>
            Enter Battle
          </Button>
        )}

        {matchError && (
          <div className="rounded-[20px] border border-accent-red/30 bg-[linear-gradient(180deg,rgba(28,7,7,0.92)_0%,rgba(18,6,6,0.78)_100%)] px-3 py-2 shadow-[0_14px_40px_rgba(0,0,0,0.26)] backdrop-blur-xl">
            <p className="font-mono text-xs text-accent-red">{matchError}</p>
          </div>
        )}

      </div>

      {!selectedCountry && phase === 'idle' && (
        <div className="pointer-events-none fixed bottom-5 left-1/2 z-30 -translate-x-1/2 px-4">
          <div
            className={cn(
              'rounded-full border border-white/10 bg-[linear-gradient(180deg,rgba(7,19,27,0.9)_0%,rgba(4,10,16,0.72)_100%)] px-5 py-3 shadow-[0_14px_40px_rgba(0,0,0,0.24)] backdrop-blur-xl',
              'animate-pulse-slow'
            )}
          >
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-text-dim">
              Select a country to deploy
            </p>
          </div>
        </div>
      )}

      {/* Phase overlays */}
      <AnimatePresence mode="wait">
        {phase === 'matching' && (
          <MatchingPulse key="matching" onCancel={cancelMatchmaking} />
        )}

        {phase === 'vs_reveal' && currentBattle && (
          <VSReveal
            key="vs"
            left={{
              imageUrl: currentBattle.left.imageUrl,
              name: `Gun #${currentBattle.left.tokenId}`,
              tokenId: currentBattle.left.tokenId,
              stats: currentBattle.left.stats,
            }}
            right={{
              imageUrl: currentBattle.right.imageUrl,
              name: `Gun #${currentBattle.right.tokenId}`,
              tokenId: currentBattle.right.tokenId,
              stats: currentBattle.right.stats,
            }}
            onComplete={handleVSComplete}
          />
        )}

        {phase === 'fighting' && currentBattle && (
          <BattleEngine
            key="battle"
            battle={currentBattle}
            onComplete={handleBattleComplete}
          />
        )}

        {phase === 'result_win' && (
          <Suspense
            key="victor"
            fallback={
              <ResultFallback type="win" onDismiss={handleResultDismiss} />
            }
          >
            <LazyVictorOverlay
              gunName={selectedGun?.name ?? 'Unknown'}
              score={100}
              onDismiss={handleResultDismiss}
            />
          </Suspense>
        )}

        {phase === 'result_loss' && (
          <Suspense
            key="death"
            fallback={
              <ResultFallback type="loss" onDismiss={handleResultDismiss} />
            }
          >
            <LazyDeathOverlay
              gunName={selectedGun?.name ?? 'Unknown'}
              score={-100}
              onDismiss={handleResultDismiss}
            />
          </Suspense>
        )}
      </AnimatePresence>
    </>
  );
}
