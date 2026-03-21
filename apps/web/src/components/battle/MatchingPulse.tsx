import type { CSSProperties } from 'react';
import { motion } from 'framer-motion';
import './battlePresentation.css';

interface MatchingPulseProps {
  onCancel?: () => void;
}

export function MatchingPulse({ onCancel }: MatchingPulseProps): React.ReactNode {
  const letters = 'MATCHING'.split('');

  return (
    <motion.div
      className="warpath-match-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="warpath-match-panel">
        <div className="warpath-match-loader" aria-hidden="true" />
        <p className="warpath-match-kicker">Sector handshake</p>
        <motion.h2 className="warpath-match-title" aria-label="MATCHING">
          {letters.map((letter, index) => (
            <span
              key={`${letter}-${index}`}
              className="warpath-match-title__letter"
              style={{ '--delay': `${index * 60}ms` } as CSSProperties}
            >
              {letter}
            </span>
          ))}
        </motion.h2>
        <div className="warpath-match-footer">
          <p className="warpath-match-subtitle">Scanning open sectors for an opposing bracket.</p>
          {onCancel ? (
            <motion.button
              type="button"
              onClick={onCancel}
              className="warpath-match-cancel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
            >
              Cancel search
            </motion.button>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}
