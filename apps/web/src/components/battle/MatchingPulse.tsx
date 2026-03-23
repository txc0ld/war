import type { CSSProperties } from 'react';
import { motion } from 'framer-motion';
import './battlePresentation.css';

interface MatchingPulseProps {
  onCancel?: () => void;
  subtitle?: string;
}

export function MatchingPulse({
  onCancel,
  subtitle = 'Scanning open sectors for an opposing bracket.',
}: MatchingPulseProps): React.ReactNode {
  const letters = 'MATCHING'.split('');

  return (
    <motion.div
      className="warpath-match-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        className="warpath-match-panel"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="warpath-match-loader" aria-hidden="true" />
        <p className="warpath-match-kicker">Sector handshake</p>
        <motion.h2
          className="warpath-match-title"
          aria-label="MATCHING"
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0, y: 10 },
            show: {
              opacity: 1,
              y: 0,
              transition: {
                staggerChildren: 0.05,
                delayChildren: 0.06,
              },
            },
          }}
        >
          {letters.map((letter, index) => (
            <motion.span
              key={`${letter}-${index}`}
              className="warpath-match-title__letter"
              style={{ '--delay': `${index * 60}ms` } as CSSProperties}
              variants={{
                hidden: { opacity: 0, y: 8, scale: 0.98 },
                show: {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
                },
              }}
            >
              {letter}
            </motion.span>
          ))}
        </motion.h2>
        <div className="warpath-match-footer">
          <p className="warpath-match-subtitle">{subtitle}</p>
          {onCancel ? (
            <motion.button
              type="button"
              onClick={onCancel}
              className="warpath-match-cancel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
            >
              Cancel search
            </motion.button>
          ) : null}
        </div>
      </motion.div>
    </motion.div>
  );
}
