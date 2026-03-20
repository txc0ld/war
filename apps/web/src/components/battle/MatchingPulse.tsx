import { motion } from 'framer-motion';
import './battlePresentation.css';

interface MatchingPulseProps {
  onCancel?: () => void;
}

export function MatchingPulse({ onCancel }: MatchingPulseProps): React.ReactNode {
  return (
    <motion.div
      className="warpath-match-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="warpath-match-panel">
        <motion.h2
          className="warpath-match-title"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
        >
          MATCHING
        </motion.h2>
        <p className="warpath-match-subtitle">SCANNING OPEN SECTORS</p>
        {onCancel ? (
          <motion.button
            type="button"
            onClick={onCancel}
            className="warpath-match-cancel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
          >
            Cancel
          </motion.button>
        ) : null}
      </div>
    </motion.div>
  );
}
