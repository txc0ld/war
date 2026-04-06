import { motion } from 'framer-motion';
import { S2_SCORING } from '@warpath/shared';
import { useStore } from '@/store';

export function S2ResultOverlay(): React.ReactNode {
  const s2Result = useStore((s) => s.s2Result);
  const setS2Phase = useStore((s) => s.setS2Phase);
  const openArmory = useStore((s) => s.openArmory);
  const resetS2 = useStore((s) => s.resetS2);

  if (s2Result === null) return null;

  const { winner, finalScore, playerIndex } = s2Result;
  const isWinner = winner === playerIndex;
  const otherIndex: 0 | 1 = playerIndex === 0 ? 1 : 0;
  const playerScore = finalScore[playerIndex];
  const opponentScore = finalScore[otherIndex];
  const pointsEarned = isWinner ? S2_SCORING.MATCH_WIN_BONUS : 0;

  function handleQueueAgain(): void {
    setS2Phase('idle');
    openArmory();
  }

  function handleBackToArmory(): void {
    resetS2();
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.90)',
      }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          padding: '2.5rem',
          maxWidth: '28rem',
          width: '100%',
        }}
      >
        {/* Title */}
        <h1
          style={{
            fontFamily: 'monospace',
            fontSize: 'clamp(2.5rem, 8vw, 4.5rem)',
            letterSpacing: '0.2em',
            margin: 0,
            lineHeight: 1,
            color: isWinner ? 'var(--accent)' : '#f87171',
            textTransform: 'uppercase',
          }}
        >
          {isWinner ? 'VICTOR' : 'DEFEATED'}
        </h1>

        {/* Score */}
        <p
          style={{
            fontFamily: 'monospace',
            fontSize: '1.5rem',
            color: 'var(--text-muted)',
            margin: '1.25rem 0 0',
            letterSpacing: '0.1em',
          }}
        >
          {playerScore} &mdash; {opponentScore}
        </p>

        {/* Points earned */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          style={{
            fontFamily: 'monospace',
            fontSize: '1.125rem',
            marginTop: '0.75rem',
            color: pointsEarned > 0 ? 'var(--accent)' : 'var(--text-ghost)',
            letterSpacing: '0.05em',
          }}
        >
          {pointsEarned > 0 ? `+${pointsEarned} pts` : '+0 pts'}
        </motion.p>

        {/* Buttons */}
        <div
          style={{
            marginTop: '3rem',
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <button
            type="button"
            onClick={handleQueueAgain}
            style={{
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              padding: '0.625rem 1.25rem',
              background: 'transparent',
              border: '1px solid var(--accent)',
              color: 'var(--accent)',
              cursor: 'pointer',
              borderRadius: '0.25rem',
              transition: 'background 160ms',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                'rgba(0, 189, 254, 0.10)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            }}
          >
            Queue Again
          </button>

          <button
            type="button"
            onClick={handleBackToArmory}
            style={{
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              padding: '0.625rem 1.25rem',
              background: 'transparent',
              border: '1px solid transparent',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              borderRadius: '0.25rem',
              transition: 'color 160ms',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
            }}
          >
            Back to Armory
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
