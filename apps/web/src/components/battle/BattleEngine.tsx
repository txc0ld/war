import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Battle, BattleRound, GunStats } from '@warpath/shared';
import { GunCard } from './GunCard';
import { cn } from '@/lib/cn';

interface BattleEngineProps {
  battle: Battle;
  onComplete: (winner: 'left' | 'right') => void;
}

const TICK_DURATION_MS = 250;

export function BattleEngine({
  battle,
  onComplete,
}: BattleEngineProps): React.ReactNode {
  const [currentTick, setCurrentTick] = useState(-1);
  const [leftHp, setLeftHp] = useState(100);
  const [rightHp, setRightHp] = useState(100);
  const [leftStats, setLeftStats] = useState<GunStats>(battle.left.stats);
  const [rightStats, setRightStats] = useState<GunStats>(battle.right.stats);
  const [currentEvent, setCurrentEvent] = useState<BattleRound['event'] | null>(null);
  const [screenShake, setScreenShake] = useState(false);
  const [showMissLeft, setShowMissLeft] = useState(false);
  const [showMissRight, setShowMissRight] = useState(false);
  const tickRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completedRef = useRef(false);

  const rounds = battle.result.rounds;

  const playTick = useCallback(
    (tick: number) => {
      const round = rounds[tick];
      if (!round) {
        if (!completedRef.current) {
          completedRef.current = true;
          onComplete(battle.result.winner);
        }
        return;
      }

      setCurrentTick(tick);
      setLeftHp(round.leftHp);
      setRightHp(round.rightHp);
      setLeftStats(round.leftStatsDisplay);
      setRightStats(round.rightStatsDisplay);
      setCurrentEvent(round.event);

      // Trigger visual effects based on event
      if (
        round.event === 'hit_left' ||
        round.event === 'hit_right' ||
        round.event === 'both_hit'
      ) {
        setScreenShake(true);
        setTimeout(() => setScreenShake(false), 150);
      }

      if (round.event === 'dodge_left') {
        setShowMissLeft(true);
        setTimeout(() => setShowMissLeft(false), 400);
      }
      if (round.event === 'dodge_right') {
        setShowMissRight(true);
        setTimeout(() => setShowMissRight(false), 400);
      }

      // Schedule next tick
      if (tick < rounds.length - 1) {
        // Speed stat affects tick timing — faster gun = snappier visual rhythm
        const speedBonus = Math.max(battle.left.stats.speed, battle.right.stats.speed);
        const adjustedDuration = Math.max(
          120,
          TICK_DURATION_MS - speedBonus
        );
        tickRef.current = setTimeout(() => playTick(tick + 1), adjustedDuration);
      } else {
        // Final tick — wait a beat then complete
        tickRef.current = setTimeout(() => {
          if (!completedRef.current) {
            completedRef.current = true;
            onComplete(battle.result.winner);
          }
        }, 1000);
      }
    },
    [rounds, battle.result.winner, battle.left.stats.speed, battle.right.stats.speed, onComplete]
  );

  useEffect(() => {
    // Start playback after a brief delay
    const startTimer = setTimeout(() => playTick(0), 500);
    return () => {
      clearTimeout(startTimer);
      if (tickRef.current) clearTimeout(tickRef.current);
    };
  }, [playTick]);

  const progress =
    rounds.length > 0 ? ((currentTick + 1) / rounds.length) * 100 : 0;

  return (
    <motion.div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{
        opacity: 1,
        x: screenShake ? [0, -3, 3, -2, 2, 0] : 0,
        y: screenShake ? [0, 2, -2, 1, -1, 0] : 0,
      }}
      transition={screenShake ? { duration: 0.15 } : { duration: 0.3 }}
    >
      {/* Battle progress bar */}
      <div className="absolute left-0 right-0 top-0 h-1 bg-bg-elevated">
        <motion.div
          className="h-full bg-accent-cyan"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.2 }}
        />
      </div>

      {/* Round counter */}
      <div className="absolute left-1/2 top-4 -translate-x-1/2">
        <span className="font-mono text-xs uppercase tracking-widest text-text-dim">
          Round {currentTick + 1}/{rounds.length}
        </span>
      </div>

      {/* Left fighter */}
      <motion.div
        className="absolute left-[5%] md:left-[12%]"
        animate={
          currentEvent === 'hit_left' || currentEvent === 'both_hit'
            ? {
                x: [0, -8, 4, -2, 0],
                filter: [
                  'brightness(1)',
                  'brightness(2.5)',
                  'brightness(1.5)',
                  'brightness(1)',
                ],
              }
            : {}
        }
        transition={{ duration: 0.2 }}
      >
        <GunCard
          imageUrl={battle.left.imageUrl}
          name={`#${battle.left.tokenId}`}
          tokenId={battle.left.tokenId}
          hp={leftHp}
          stats={leftStats}
          side="left"
        />
        <AnimatePresence>
          {showMissLeft && (
            <motion.div
              className="absolute -right-4 top-1/2 -translate-y-1/2"
              initial={{ opacity: 0, scale: 0.5, x: 0 }}
              animate={{ opacity: 1, scale: 1, x: 10 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <span className="font-mono text-lg font-bold text-accent-gold">
                MISS
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Center divider */}
      <div className="flex flex-col items-center gap-2">
        <motion.div
          className="h-32 w-px bg-gradient-to-b from-transparent via-accent-cyan/30 to-transparent md:h-48"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        {currentEvent && (
          <motion.span
            key={`${currentTick}-${currentEvent}`}
            className={cn(
              'font-mono text-[10px] uppercase tracking-widest',
              currentEvent.includes('hit')
                ? 'text-accent-red'
                : 'text-accent-gold'
            )}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            {currentEvent === 'both_hit'
              ? 'CLASH'
              : currentEvent === 'hit_left'
                ? 'HIT'
                : currentEvent === 'hit_right'
                  ? 'HIT'
                  : 'DODGE'}
          </motion.span>
        )}
      </div>

      {/* Right fighter */}
      <motion.div
        className="absolute right-[5%] md:right-[12%]"
        animate={
          currentEvent === 'hit_right' || currentEvent === 'both_hit'
            ? {
                x: [0, 8, -4, 2, 0],
                filter: [
                  'brightness(1)',
                  'brightness(2.5)',
                  'brightness(1.5)',
                  'brightness(1)',
                ],
              }
            : {}
        }
        transition={{ duration: 0.2 }}
      >
        <GunCard
          imageUrl={battle.right.imageUrl}
          name={`#${battle.right.tokenId}`}
          tokenId={battle.right.tokenId}
          hp={rightHp}
          stats={rightStats}
          side="right"
        />
        <AnimatePresence>
          {showMissRight && (
            <motion.div
              className="absolute -left-4 top-1/2 -translate-y-1/2"
              initial={{ opacity: 0, scale: 0.5, x: 0 }}
              animate={{ opacity: 1, scale: 1, x: -10 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <span className="font-mono text-lg font-bold text-accent-gold">
                MISS
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
