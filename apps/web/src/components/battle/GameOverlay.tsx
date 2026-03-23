import { useCallback, useEffect, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useStore } from '@/store';
import { useMatchmaking } from '@/hooks/useMatchmaking';
import { useSessionAddress } from '@/hooks/useSessionAddress';
import { getCountryByCode } from '@/data/countries';
import { playBattleCue, prepareBattleAudio, unlockBattleAudio } from '@/lib/battleAudio';
import { MatchingPulse } from './MatchingPulse';
import { VSReveal } from './VSReveal';
import { BattleEngine } from './BattleEngine';
import { VictorOverlay } from './VictorOverlay';
import { DeathOverlay } from './DeathOverlay';
import './battlePresentation.css';

export function GameOverlay(): React.ReactNode {
  const sessionAddress = useSessionAddress();
  const {
    phase,
    currentBattle,
    selectedCountry,
    selectedGun,
    clearCountry,
    clearGun,
    openGunSelector,
    reset,
    setPhase,
    guns,
  } = useStore();
  const {
    startMatchmaking,
    cancelMatchmaking,
    error,
    statusDetail,
    canCancel,
  } = useMatchmaking();
  const selectedCountryData = useMemo(() => getCountryByCode(selectedCountry), [selectedCountry]);
  const countryName = useMemo(
    () => selectedCountryData?.name ?? selectedCountry,
    [selectedCountry, selectedCountryData]
  );
  const resolvedBattle = currentBattle?.status === 'resolved' ? currentBattle : null;
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
  const playerGunName = useMemo(() => {
    if (!currentBattle) {
      return selectedGun?.name ?? 'Unknown';
    }

    return playerSide === 'left'
      ? currentBattle.left.name
      : currentBattle.right.name;
  }, [currentBattle, playerSide, selectedGun?.name]);

  useEffect(() => {
    prepareBattleAudio();
  }, []);

  const handleFight = useCallback(async () => {
    unlockBattleAudio();
    playBattleCue('enterBattle');

    await startMatchmaking();
  }, [startMatchmaking]);

  const handleResultDismiss = useCallback(() => {
    reset();
    clearCountry();
    clearGun();
  }, [clearCountry, clearGun, reset]);

  const handleFightAgain = useCallback(() => {
    reset();
    clearGun();

    if (selectedCountry) {
      openGunSelector();
      return;
    }

    clearCountry();
  }, [clearCountry, clearGun, openGunSelector, reset, selectedCountry]);

  const handleBattleComplete = useCallback(
    (winner: 'left' | 'right') => {
      setPhase(winner === playerSide ? 'result_win' : 'result_loss');
    },
    [playerSide, setPhase]
  );

  return (
    <>
      {phase === 'idle' ? (
        <div className="warpath-map-surface-overlay">
          {selectedCountry || error ? (
            <div className="warpath-battle-hud">
              {selectedCountry ? (
                <div className="warpath-status-card">
                  <div className="warpath-status-card__rule" />
                  <p className="warpath-status-card__eyebrow">Deploy Zone</p>
                  <p className="warpath-status-card__country">{countryName}</p>
                  <p
                    className={`warpath-status-card__sector warpath-status-card__sector--${
                      selectedCountryData?.side === 'right' ? 'right' : 'left'
                    }`}
                  >
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

              {selectedCountry && selectedGun ? (
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

          {!selectedCountry ? (
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
      ) : null}

      <AnimatePresence mode="wait">
        {phase === 'matching' ? (
          <MatchingPulse
            key="matching"
            subtitle={statusDetail}
            onCancel={canCancel ? cancelMatchmaking : undefined}
          />
        ) : null}

        {phase === 'vs_reveal' && currentBattle ? (
          <VSReveal
            key="vs"
            left={{
              imageUrl: currentBattle.left.imageUrl,
              name:
                playerSide === 'left'
                  ? currentBattle.left.name ??
                    `Gun #${currentBattle.left.tokenId}`
                  : currentBattle.left.name ??
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
                  ? currentBattle.right.name ??
                    `Gun #${currentBattle.right.tokenId}`
                  : currentBattle.right.name ??
                    `Gun #${currentBattle.right.tokenId}`,
              tokenId: currentBattle.right.tokenId,
              stats: currentBattle.right.stats,
              side: 'right',
              label: playerSide === 'right' ? 'You' : 'Opponent',
            }}
            onComplete={() => setPhase('fighting')}
          />
        ) : null}

        {phase === 'fighting' && resolvedBattle ? (
          <BattleEngine
            key="battle"
            battle={resolvedBattle}
            playerSide={playerSide}
            onComplete={handleBattleComplete}
          />
        ) : null}

        {phase === 'result_win' ? (
          <VictorOverlay
            key="victor"
            gunName={playerGunName}
            score={100}
            onDismiss={handleResultDismiss}
            onFightAgain={handleFightAgain}
          />
        ) : null}

        {phase === 'result_loss' ? (
          <DeathOverlay
            key="death"
            gunName={playerGunName}
            score={-100}
            onDismiss={handleResultDismiss}
            onFightAgain={handleFightAgain}
          />
        ) : null}
      </AnimatePresence>
    </>
  );
}
