import { useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './battlePresentation.css';

interface DeathOverlayProps {
  gunName: string;
  score: number;
  onDismiss: () => void;
  onFightAgain: () => void;
}

export function DeathOverlay({
  gunName,
  score,
  onDismiss,
  onFightAgain,
}: DeathOverlayProps): React.ReactNode {
  const loserAudioRef = useRef<HTMLAudioElement | null>(null);

  const dismiss = useCallback(() => {
    onDismiss();
  }, [onDismiss]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const audio = new Audio('/assets/Loser.mp3');
    audio.preload = 'auto';
    audio.loop = false;
    loserAudioRef.current = audio;
    void audio.play().catch(() => {});

    return () => {
      audio.pause();
      audio.currentTime = 0;
      loserAudioRef.current = null;
    };
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        className="warpath-result-overlay warpath-result-overlay--defeat"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
        onClick={dismiss}
      >
        <div
          className="warpath-result-panel warpath-result-panel--defeat"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="warpath-result-headline">
            <p className="warpath-result-kicker">Battle resolved</p>
          </div>
          <div className="warpath-result-stack warpath-result-stack--defeat">
            <motion.h1
              className="warpath-result-title warpath-result-title--defeat"
              initial={{ scale: 2.6, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.36, ease: [0.22, 1.4, 0.36, 1] }}
            >
              ELIMINATED
            </motion.h1>
            <motion.p
              className="warpath-result-gun"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.38, duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            >
              {gunName}
            </motion.p>
            <motion.div
              className="warpath-result-score warpath-result-score--defeat"
              initial={{ scale: 0.8, opacity: 0, y: 6 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ delay: 0.58, duration: 0.34, ease: [0.34, 1.56, 0.64, 1] }}
            >
              {score}
            </motion.div>
          </div>
          <div className="warpath-result-actions">
            <button
              type="button"
              className="warpath-button warpath-button--outline"
              onClick={onFightAgain}
            >
              FIGHT AGAIN
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
