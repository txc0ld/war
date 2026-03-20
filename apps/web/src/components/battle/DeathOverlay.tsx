import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './battlePresentation.css';

interface DeathOverlayProps {
  gunName: string;
  score: number;
  onDismiss: () => void;
}

export function DeathOverlay({
  gunName,
  score,
  onDismiss,
}: DeathOverlayProps): React.ReactNode {
  const dismiss = useCallback(() => {
    onDismiss();
  }, [onDismiss]);

  useEffect(() => {
    const timer = setTimeout(dismiss, 4000);
    return () => clearTimeout(timer);
  }, [dismiss]);

  return (
    <AnimatePresence>
      <motion.div
        className="warpath-result-overlay warpath-result-overlay--defeat"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={dismiss}
      >
        <div className="warpath-result-panel">
          <p className="warpath-result-kicker">Battle resolved</p>
          <motion.div
            initial={{ scale: 3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 12, stiffness: 150 }}
          >
            <h1 className="warpath-result-title warpath-result-title--defeat">
              ELIMINATED
            </h1>
          </motion.div>
          <div className="warpath-result-art">
            <motion.img
              src="/assets/dead.gif"
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
            className="warpath-result-score warpath-result-score--defeat"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.4, 1], opacity: [0, 1, 1] }}
            transition={{ delay: 0.6, duration: 0.6, ease: 'easeOut' }}
          >
            {score}
          </motion.div>
          <button type="button" className="warpath-button warpath-button--outline" onClick={dismiss}>
            FIGHT AGAIN
          </button>
          <p className="warpath-result-hint">Tap anywhere to redeploy</p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
