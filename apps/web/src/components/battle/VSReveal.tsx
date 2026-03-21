import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GunStats } from '@warpath/shared';
import { GunCard } from './GunCard';

interface FighterCard {
  imageUrl: string;
  name: string;
  tokenId: number;
  stats: GunStats;
  side: 'left' | 'right';
  label: string;
}

interface VSRevealProps {
  left: FighterCard;
  right: FighterCard;
  onComplete: () => void;
}

export function VSReveal({
  left,
  right,
  onComplete,
}: VSRevealProps): React.ReactNode {
  const [showFight, setShowFight] = useState(false);

  useEffect(() => {
    const vsTimer = window.setTimeout(() => setShowFight(true), 1500);
    const completeTimer = window.setTimeout(onComplete, 2300);

    return () => {
      window.clearTimeout(vsTimer);
      window.clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div className="vs-screen">
      <div className="vs-screen__inner">
        <div className="vs-screen__duel">
          <motion.div
            className="vs-screen__fighter-shell vs-screen__fighter-shell--left"
            initial={{ opacity: 0, x: -140, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            <GunCard
              label={left.label}
              name={left.name}
              tokenId={left.tokenId}
              imageUrl={left.imageUrl}
              stats={left.stats}
              side={left.side}
              showStats={false}
            />
          </motion.div>
          <div className="vs-screen__center-slot" aria-hidden="true" />
          <motion.div
            className="vs-screen__fighter-shell vs-screen__fighter-shell--right"
            initial={{ opacity: 0, x: 140, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.06 }}
          >
            <GunCard
              label={right.label}
              name={right.name}
              tokenId={right.tokenId}
              imageUrl={right.imageUrl}
              stats={right.stats}
              side={right.side}
              showStats={false}
            />
          </motion.div>
        </div>
      </div>

      <motion.div
        className="vs-screen__center"
        animate={
          showFight
            ? { x: [0, -3, 3, -2, 2, 0], y: [0, 2, -2, 1, -1, 0] }
            : { x: 0, y: 0 }
        }
        transition={showFight ? { duration: 0.2 } : { duration: 0.4 }}
      >
        <AnimatePresence mode="wait">
          <motion.h2
            key={showFight ? 'fight' : 'vs'}
          className={`vs-screen__headline ${showFight ? 'vs-screen__headline--fight' : 'vs-screen__headline--slam'}`}
            initial={{ opacity: 0, letterSpacing: '0.36em', scale: 1.12 }}
            animate={{ opacity: 1, letterSpacing: '0.18em', scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          >
            {showFight ? 'FIGHT' : 'VS'}
          </motion.h2>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
