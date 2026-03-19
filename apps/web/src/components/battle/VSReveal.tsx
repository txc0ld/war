import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GunStats } from '@warpath/shared';
import { GunCard } from './GunCard';

interface VSRevealProps {
  left: {
    imageUrl: string;
    name: string;
    tokenId: number;
    stats: GunStats;
  };
  right: {
    imageUrl: string;
    name: string;
    tokenId: number;
    stats: GunStats;
  };
  onComplete: () => void;
}

export function VSReveal({
  left,
  right,
  onComplete,
}: VSRevealProps): React.ReactNode {
  const [phase, setPhase] = useState<'vs' | 'fight'>('vs');

  useEffect(() => {
    const timer1 = setTimeout(() => setPhase('fight'), 2000);
    const timer2 = setTimeout(() => onComplete(), 3000);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/85 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Left gun slides in */}
      <motion.div
        className="absolute left-[10%] md:left-[15%]"
        initial={{ x: '-200%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
      >
        <GunCard
          imageUrl={left.imageUrl}
          name={left.name}
          tokenId={left.tokenId}
          hp={100}
          stats={left.stats}
          side="left"
          showStats={false}
        />
      </motion.div>

      {/* Right gun slides in */}
      <motion.div
        className="absolute right-[10%] md:right-[15%]"
        initial={{ x: '200%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
      >
        <GunCard
          imageUrl={right.imageUrl}
          name={right.name}
          tokenId={right.tokenId}
          hp={100}
          stats={right.stats}
          side="right"
          showStats={false}
        />
      </motion.div>

      {/* VS / FIGHT text */}
      <AnimatePresence mode="wait">
        {phase === 'vs' ? (
          <motion.div
            key="vs"
            className="relative z-10"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ type: 'spring', damping: 15 }}
          >
            <motion.h1
              className="font-mono text-6xl font-bold tracking-widest text-text-primary md:text-8xl"
              animate={{
                x: [0, -2, 2, -1, 1, 0],
                y: [0, 1, -1, 2, -2, 0],
              }}
              transition={{
                duration: 0.3,
                repeat: Infinity,
                repeatType: 'loop',
              }}
            >
              VS
            </motion.h1>
          </motion.div>
        ) : (
          <motion.div
            key="fight"
            className="relative z-10"
            initial={{ scale: 3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 12 }}
          >
            {/* Flash effect */}
            <motion.div
              className="absolute inset-0 -m-20 bg-accent-neon/20"
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            />
            <h1 className="font-mono text-6xl font-bold tracking-[0.3em] text-accent-neon md:text-8xl">
              FIGHT
            </h1>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Screen shake on FIGHT */}
      {phase === 'fight' && (
        <motion.div
          className="pointer-events-none fixed inset-0"
          animate={{
            x: [0, -4, 4, -3, 3, -1, 1, 0],
            y: [0, 2, -2, 3, -3, 1, -1, 0],
          }}
          transition={{ duration: 0.4 }}
        />
      )}
    </motion.div>
  );
}
