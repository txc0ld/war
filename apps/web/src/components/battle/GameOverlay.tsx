import { useCallback, lazy, Suspense, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useStore } from '@/store';
import { useMatchmaking } from '@/hooks/useMatchmaking';
import { useSessionAddress } from '@/hooks/useSessionAddress';
import { GUNS_BY_ID } from '@/data/guns';
import { getCountryByCode } from '@/data/countries';
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
  const selectedCountryData = useMemo(() => getCountryByCode(selectedCountry), [selectedCountry]);
  const countryName = useMemo(
    () => selectedCountryData?.name ?? selectedCountry,
    [selectedCountry, selectedCountryData]
  );
  const playerSide = useMemo(() => {
    const normalizedAddress = sessionAddress?.toLowerCase();

    if (normalizedAddress && currentBattle) {
      if (normalizedAddress === currentBattle.left.address.toLowerCase()) {
        return 'left';
      }

      if (normalizedAddress === currentBattle.right.address.toLowerCase()) {
        return 'right';
      }
    }

    return selectedCountryData?.side ?? 'left';
  }, [currentBattle, selectedCountryData?.side, sessionAddress]);

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
      setPhase(winner === playerSide ? 'result_win' : 'result_loss');
    },
    [playerSide, setPhase]
  );

  return (
    <>
      <div className="warpath-map-surface-overlay">
        {selectedCountry || error ? (
          <div className="warpath-battle-hud">
            {selectedCountry ? (
              <div className="warpath-status-card">
                <div className="warpath-status-card__rule" />
                <p className="warpath-status-card__eyebrow">Deploy Zone</p>
                <p className="warpath-status-card__country">{countryName}</p>
                <p className="warpath-status-card__label">
                  {selectedCountryData?.side === 'right' ? 'Right Sector' : 'Left Sector'}
                </p>
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
        ) : null}

        {!selectedCountry && phase === 'idle' ? (
          <div className="warpath-idle-prompt">
            <div className="warpath-map-brief">
              <p className="warpath-map-brief__eyebrow">Global Deployment Grid</p>
              <p className="warpath-map-brief__title">Choose a country, open the armory, and enter the bracket.</p>
            </div>
            <div className="warpath-idle-prompt__pill">
              <p className="warpath-idle-prompt__copy">Select a country to deploy</p>
            </div>
          </div>
        ) : null}
      </div>

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
                playerSide === 'left'
                  ? selectedGun?.name ??
                    GUNS_BY_ID.get(currentBattle.left.tokenId)?.name ??
                    `Gun #${currentBattle.left.tokenId}`
                  : GUNS_BY_ID.get(currentBattle.left.tokenId)?.name ??
                    `Gun #${currentBattle.left.tokenId}`,
              tokenId: currentBattle.left.tokenId,
              stats: currentBattle.left.stats,
              side: 'left',
              label: playerSide === 'left' ? 'You' : 'Opponent',
            }}
            right={{
              imageUrl: currentBattle.right.imageUrl,
              name:
                playerSide === 'right'
                  ? selectedGun?.name ??
                    GUNS_BY_ID.get(currentBattle.right.tokenId)?.name ??
                    `Gun #${currentBattle.right.tokenId}`
                  : GUNS_BY_ID.get(currentBattle.right.tokenId)?.name ??
                    `Gun #${currentBattle.right.tokenId}`,
              tokenId: currentBattle.right.tokenId,
              stats: currentBattle.right.stats,
              side: 'right',
              label: playerSide === 'right' ? 'You' : 'Opponent',
            }}
            onComplete={() => setPhase('fighting')}
          />
        ) : null}

        {phase === 'fighting' && currentBattle ? (
          <BattleEngine
            key="battle"
            battle={currentBattle}
            playerSide={playerSide}
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
