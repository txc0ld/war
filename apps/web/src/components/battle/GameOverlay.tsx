import { useCallback, lazy, Suspense } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useStore } from '@/store';
import { useMatchmaking } from '@/hooks/useMatchmaking';
import { useSessionAddress } from '@/hooks/useSessionAddress';
import { GUNS_BY_ID } from '@/data/guns';
import { MatchingPulse } from './MatchingPulse';
import { VSReveal } from './VSReveal';
import { BattleEngine } from './BattleEngine';
import './battlePresentation.css';

const LazyVictorOverlay = lazy(() =>
  import('./VictorOverlay').then((module) => ({ default: module.VictorOverlay }))
);
const LazyDeathOverlay = lazy(() =>
  import('./DeathOverlay').then((module) => ({ default: module.DeathOverlay }))
);

export function GameOverlay(): React.ReactNode {
  const sessionAddress = useSessionAddress();
  const {
    phase,
    currentBattle,
    selectedCountry,
    selectedGun,
    clearCountry,
    clearGun,
    reset,
    setPhase,
  } = useStore();
  const { startMatchmaking, cancelMatchmaking, error } = useMatchmaking();

  const handleFight = useCallback(async () => {
    await startMatchmaking();
  }, [startMatchmaking]);

  const handleResultDismiss = useCallback(() => {
    reset();
    clearCountry();
    clearGun();
  }, [clearCountry, clearGun, reset]);

  const handleBattleComplete = useCallback(
    (winner: 'left' | 'right') => {
      const normalizedAddress = sessionAddress?.toLowerCase();
      const playerSide =
        normalizedAddress === currentBattle?.left.address.toLowerCase()
          ? 'left'
          : normalizedAddress === currentBattle?.right.address.toLowerCase()
            ? 'right'
            : 'left';

      setPhase(winner === playerSide ? 'result_win' : 'result_loss');
    },
    [currentBattle?.left.address, currentBattle?.right.address, sessionAddress, setPhase]
  );

  return (
    <>
      <div className="warpath-battle-hud">
        {selectedCountry ? (
          <div className="warpath-status-card">
            <div className="warpath-status-card__rule" />
            <p className="warpath-status-card__eyebrow">Deploy Zone</p>
            <p className="warpath-status-card__country">{selectedCountry}</p>
            {selectedGun ? (
              <div className="warpath-status-card__split">
                <p className="warpath-status-card__label">Weapon</p>
                <p className="warpath-status-card__gun">{selectedGun.name}</p>
                <div className="warpath-status-card__stats">
                  <div className="warpath-status-stat">
                    <span className="warpath-status-stat__label">DMG</span>
                    <span className="warpath-status-stat__value warpath-status-stat__value--damage">
                      {selectedGun.stats.damage}
                    </span>
                  </div>
                  <div className="warpath-status-stat">
                    <span className="warpath-status-stat__label">DDG</span>
                    <span className="warpath-status-stat__value warpath-status-stat__value--dodge">
                      {selectedGun.stats.dodge}
                    </span>
                  </div>
                  <div className="warpath-status-stat">
                    <span className="warpath-status-stat__label">SPD</span>
                    <span className="warpath-status-stat__value warpath-status-stat__value--speed">
                      {selectedGun.stats.speed}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {selectedCountry && selectedGun && phase === 'idle' ? (
          <button type="button" className="warpath-action" onClick={handleFight}>
            Enter Battle
          </button>
        ) : null}

        {error ? (
          <div className="warpath-error-card">
            <p>{error}</p>
          </div>
        ) : null}
      </div>

      {!selectedCountry && phase === 'idle' ? (
        <div className="warpath-idle-prompt">
          <div className="warpath-idle-prompt__pill">
            <p className="warpath-idle-prompt__copy">Select a country to deploy</p>
          </div>
        </div>
      ) : null}

      <AnimatePresence mode="wait">
        {phase === 'matching' ? (
          <MatchingPulse key="matching" onCancel={cancelMatchmaking} />
        ) : null}

        {phase === 'vs_reveal' && currentBattle ? (
          <VSReveal
            key="vs"
            left={{
              imageUrl: currentBattle.left.imageUrl,
              name:
                selectedGun?.name ??
                GUNS_BY_ID.get(currentBattle.left.tokenId)?.name ??
                `Gun #${currentBattle.left.tokenId}`,
              tokenId: currentBattle.left.tokenId,
              stats: currentBattle.left.stats,
            }}
            right={{
              imageUrl: currentBattle.right.imageUrl,
              name:
                GUNS_BY_ID.get(currentBattle.right.tokenId)?.name ??
                `Gun #${currentBattle.right.tokenId}`,
              tokenId: currentBattle.right.tokenId,
              stats: currentBattle.right.stats,
            }}
            onComplete={() => setPhase('fighting')}
          />
        ) : null}

        {phase === 'fighting' && currentBattle ? (
          <BattleEngine
            key="battle"
            battle={currentBattle}
            onComplete={handleBattleComplete}
          />
        ) : null}

        {phase === 'result_win' ? (
          <Suspense key="victor" fallback={null}>
            <LazyVictorOverlay
              gunName={selectedGun?.name ?? 'Unknown'}
              score={100}
              onDismiss={handleResultDismiss}
            />
          </Suspense>
        ) : null}

        {phase === 'result_loss' ? (
          <Suspense key="death" fallback={null}>
            <LazyDeathOverlay
              gunName={selectedGun?.name ?? 'Unknown'}
              score={-100}
              onDismiss={handleResultDismiss}
            />
          </Suspense>
        ) : null}
      </AnimatePresence>
    </>
  );
}
