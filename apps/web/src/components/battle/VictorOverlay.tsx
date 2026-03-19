import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/cn';

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

  // Auto-dismiss after 4 seconds
  useEffect(() => {
    const timer = setTimeout(dismiss, 4000);
    return () => clearTimeout(timer);
  }, [dismiss]);

  return (
    <AnimatePresence>
      <motion.div
        className={cn(
          'fixed inset-0 z-50 flex flex-col items-center justify-center',
          'cursor-pointer select-none',
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={dismiss}
      >
        {/* Black background overlay at 80% opacity */}
        <motion.div
          className="absolute inset-0 bg-black/80"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        />

        {/* Content layer */}
        <div className="relative z-10 flex flex-col items-center gap-6">
          {/* "VICTOR" glitch text */}
          <motion.div
            className="relative"
            initial={{ scale: 3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 12, stiffness: 150 }}
          >
            {/* Glitch layers */}
            <motion.h1
              className="absolute inset-0 font-mono text-6xl font-bold uppercase tracking-[0.3em] text-[#CCFF00] opacity-70 md:text-8xl"
              animate={{
                x: [0, -3, 3, -2, 2, 0],
                y: [0, 1, -1, 2, -2, 0],
                opacity: [0.7, 0.4, 0.7, 0.5, 0.7],
              }}
              transition={{
                duration: 0.3,
                repeat: Infinity,
                repeatType: 'loop',
              }}
              style={{ clipPath: 'inset(0 0 50% 0)' }}
              aria-hidden
            >
              VICTOR
            </motion.h1>
            <motion.h1
              className="absolute inset-0 font-mono text-6xl font-bold uppercase tracking-[0.3em] text-[#CCFF00] opacity-70 md:text-8xl"
              animate={{
                x: [0, 2, -2, 1, -1, 0],
                y: [0, -1, 1, -2, 2, 0],
                opacity: [0.7, 0.5, 0.7, 0.4, 0.7],
              }}
              transition={{
                duration: 0.25,
                repeat: Infinity,
                repeatType: 'loop',
              }}
              style={{ clipPath: 'inset(50% 0 0 0)' }}
              aria-hidden
            >
              VICTOR
            </motion.h1>
            {/* Main text */}
            <h1 className="font-mono text-6xl font-bold uppercase tracking-[0.3em] text-[#CCFF00] md:text-8xl">
              VICTOR
            </h1>
          </motion.div>

          {/* victor.gif centered */}
          <motion.img
            src="/assets/victor.gif"
            alt=""
            className="h-48 w-48 object-contain md:h-64 md:w-64"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.3 }}
          />

          {/* Gun name */}
          <motion.p
            className="font-mono text-xl tracking-wide text-white/80 md:text-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            {gunName}
          </motion.p>

          {/* Score popup */}
          <motion.div
            className="font-mono text-4xl font-bold text-[#CCFF00] md:text-5xl"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.4, 1], opacity: [0, 1, 1] }}
            transition={{ delay: 0.6, duration: 0.6, ease: 'easeOut' }}
          >
            +{score}
          </motion.div>

          {/* Fade out score after appearing */}
          <motion.div
            className="absolute bottom-0 font-mono text-4xl font-bold text-[#CCFF00] md:text-5xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0, 1, 1, 0], y: [0, 0, 0, -20, -40] }}
            transition={{ delay: 0.6, duration: 2, ease: 'easeOut' }}
            aria-hidden
          >
            +{score}
          </motion.div>
        </div>

        {/* Flash on entry */}
        <motion.div
          className="pointer-events-none absolute inset-0 bg-[#CCFF00]/20"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        />
      </motion.div>
    </AnimatePresence>
  );
}
