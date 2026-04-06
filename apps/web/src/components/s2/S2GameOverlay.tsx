import { useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { getActiveSeason } from '@warpath/shared';
import { useStore } from '@/store';
import { useS2Matchmaking } from '@/hooks/useS2Matchmaking';
import { ArmorySelector } from '@/components/s2/ArmorySelector';
import { S2MatchingPulse } from '@/components/s2/S2MatchingPulse';
import { DeadshotCanvas } from '@/components/s2/DeadshotCanvas';
import { S2ResultOverlay } from '@/components/s2/S2ResultOverlay';

export function S2GameOverlay(): React.ReactNode {
  if (getActiveSeason(Date.now()) !== 2) {
    return null;
  }

  return <S2GameOverlayInner />;
}

function S2GameOverlayInner(): React.ReactNode {
  const s2Phase = useStore((s) => s.s2Phase);
  const s2SelectedSniper = useStore((s) => s.s2SelectedSniper);
  const openArmory = useStore((s) => s.openArmory);

  const { startMatchmaking, cancelMatchmaking, error, statusDetail, canCancel } =
    useS2Matchmaking();

  const handleEnterDuel = useCallback(async (): Promise<void> => {
    await startMatchmaking();
  }, [startMatchmaking]);

  const handleSelectSniper = useCallback((): void => {
    openArmory();
  }, [openArmory]);

  return (
    <>
      {/* ArmorySelector manages its own visibility via showArmory — always rendered */}
      <ArmorySelector />

      {/* Idle HUD — anchored to bottom of screen */}
      {s2Phase === 'idle' ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 30,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingBottom: '6rem',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.75rem',
              pointerEvents: 'auto',
            }}
          >
            {s2SelectedSniper !== null ? (
              <>
                {/* Selected sniper info */}
                <p
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '0.6875rem',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    margin: 0,
                  }}
                >
                  {s2SelectedSniper.name}
                </p>

                {/* Enter Duel button */}
                <button
                  type="button"
                  onClick={handleEnterDuel}
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '0.8125rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.18em',
                    color: 'var(--accent)',
                    background: 'transparent',
                    border: '1px solid var(--accent)',
                    borderRadius: '0.25rem',
                    padding: '0.625rem 1.75rem',
                    cursor: 'pointer',
                    transition: 'background 160ms, box-shadow 160ms',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      'rgba(0, 189, 254, 0.10)';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow =
                      '0 0 12px rgba(0, 189, 254, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                  }}
                >
                  Enter Duel
                </button>
              </>
            ) : (
              /* Select Sniper button */
              <button
                type="button"
                onClick={handleSelectSniper}
                style={{
                  fontFamily: 'monospace',
                  fontSize: '0.8125rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.18em',
                  color: 'var(--text-muted)',
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: '0.25rem',
                  padding: '0.625rem 1.75rem',
                  cursor: 'pointer',
                  transition: 'color 160ms, border-color 160ms',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--accent)';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
                }}
              >
                Select Sniper
              </button>
            )}

            {/* Error */}
            {error !== null ? (
              <p
                style={{
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  color: '#f87171',
                  textAlign: 'center',
                  maxWidth: '24rem',
                  margin: 0,
                  letterSpacing: '0.04em',
                }}
              >
                {error}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Phase overlays — animated */}
      <AnimatePresence mode="wait">
        {s2Phase === 'matching' ? (
          <S2MatchingPulse
            key="s2-matching"
            subtitle={statusDetail}
            onCancel={canCancel ? cancelMatchmaking : undefined}
          />
        ) : null}

        {s2Phase === 'countdown' || s2Phase === 'playing' ? (
          <DeadshotCanvas key="s2-canvas" />
        ) : null}

        {s2Phase === 'result' ? (
          <S2ResultOverlay key="s2-result" />
        ) : null}
      </AnimatePresence>
    </>
  );
}
