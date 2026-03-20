import { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './battlePresentation.css';

interface VictorOverlayProps {
  gunName: string;
  score: number;
  onDismiss: () => void;
}

export function VictorOverlay({
  gunName,
  score,
  onDismiss,
}: VictorOverlayProps): React.ReactNode {
  const dismiss = useCallback(() => {
    onDismiss();
  }, [onDismiss]);

  return (
    <AnimatePresence>
      <motion.div
        className="warpath-result-overlay warpath-result-overlay--victory"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={dismiss}
      >
        <div
          className="warpath-result-panel warpath-result-panel--victory"
          onClick={(event) => event.stopPropagation()}
        >
          <p className="warpath-result-kicker">Battle resolved</p>
          <div className="warpath-result-stack warpath-result-stack--victory">
            <motion.h1
              className="warpath-result-title warpath-result-title--victory"
              initial={{ scale: 3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 12, stiffness: 150 }}
            >
              VICTOR
            </motion.h1>
            <div className="warpath-result-art">
              <motion.img
                src="/assets/victor.gif"
                alt=""
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.2, delay: 0.3 }}
              />
            </div>
            <motion.p
              className="warpath-result-gun"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              {gunName}
            </motion.p>
            <motion.div
              className="warpath-result-score warpath-result-score--victory"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.4, 1], opacity: [0, 1, 1] }}
              transition={{ delay: 0.6, duration: 0.6, ease: 'easeOut' }}
            >
              +{score}
            </motion.div>
          </div>
          <div className="warpath-result-actions">
            <button type="button" className="warpath-button" onClick={dismiss}>
              FIGHT AGAIN
            </button>
          </div>
          <p className="warpath-result-hint">Click or tap anywhere to continue</p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
