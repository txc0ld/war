import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GunStats } from '@warpath/shared';
import { playBattleCue, prepareBattleAudio, stopBattleCue } from '@/lib/battleAudio';
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
    const vsTimer = window.setTimeout(() => setShowFight(true), 1350);
    const completeTimer = window.setTimeout(onComplete, 2200);

    return () => {
      window.clearTimeout(vsTimer);
      window.clearTimeout(completeTimer);
    };
  }, [onComplete]);

  useEffect(() => {
    prepareBattleAudio();

    return () => {
      stopBattleCue('fight');
    };
  }, []);

  useEffect(() => {
    if (!showFight) {
      return;
    }

    playBattleCue('fight');
  }, [showFight]);

  return (
    <div className="vs-screen">
      <div className="vs-screen__inner">
        <div className="vs-screen__duel">
          <motion.div
            className="vs-screen__fighter-shell vs-screen__fighter-shell--left"
            initial={{ opacity: 0, x: -96, scale: 0.94 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
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
          <div className="vs-screen__center-slot">
            <motion.div
              className="vs-screen__center"
              animate={
                showFight
                  ? { x: [0, -2, 2, -1, 1, 0], y: [0, 1, -1, 1, -1, 0] }
                  : { x: 0, y: 0 }
              }
              transition={showFight ? { duration: 0.18, ease: [0.34, 1.56, 0.64, 1] } : { duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
            >
              <AnimatePresence mode="wait">
                <motion.h2
                  key={showFight ? 'fight' : 'vs'}
                  className={`vs-screen__headline ${showFight ? 'vs-screen__headline--fight' : 'vs-screen__headline--slam'}`}
                  style={{ fontFamily: 'MK4, var(--font-display)', fontWeight: 400 }}
                  initial={{ opacity: 0, letterSpacing: '0.32em', scale: 1.18 }}
                  animate={{ opacity: 1, letterSpacing: '0.16em', scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, ease: [0.22, 1.4, 0.36, 1] }}
                >
                  {showFight ? 'FIGHT' : 'VS'}
                </motion.h2>
              </AnimatePresence>
            </motion.div>
          </div>
          <motion.div
            className="vs-screen__fighter-shell vs-screen__fighter-shell--right"
            initial={{ opacity: 0, x: 96, scale: 0.94 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.04 }}
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
    </div>
  );
}
