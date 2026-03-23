import type { CSSProperties } from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { BattleRound, GunStats, ResolvedBattle } from '@warpath/shared';
import { GunCard } from './GunCard';
import { playBattleCue, prepareBattleAudio, stopBattleCue } from '@/lib/battleAudio';
import './battlePresentation.css';

interface BattleEngineProps {
  battle: ResolvedBattle;
  playerSide?: 'left' | 'right';
  onComplete: (winner: 'left' | 'right') => void;
}

const TICK_DURATION_MS = 520;
const MIN_TICK_DURATION_MS = 360;
const RESULT_HOLD_MS = 1400;
const HIT_SHAKE = {
  x: [0, 4, -3, 2, 0],
  y: [0, -2, 2, -1, 0],
};
const CARD_HIT_SHIFT = {
  x: [0, -6, 3, -2, 0],
  opacity: [1, 0.88, 1, 0.94, 1],
};

export function BattleEngine({
  battle,
  playerSide = 'left',
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

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    prepareBattleAudio();
    playBattleCue('battle', { loop: true });

    return () => {
      stopBattleCue('battle');
    };
  }, []);

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

      if (tick < rounds.length - 1) {
        const adjustedDuration = Math.max(MIN_TICK_DURATION_MS, TICK_DURATION_MS);
        tickRef.current = setTimeout(() => playTick(tick + 1), adjustedDuration);
      } else {
        tickRef.current = setTimeout(() => {
          if (!completedRef.current) {
            completedRef.current = true;
            onComplete(battle.result.winner);
          }
        }, RESULT_HOLD_MS);
      }
    },
    [rounds, battle.result.winner, onComplete]
  );

  useEffect(() => {
    const startTimer = setTimeout(() => playTick(0), 500);
    return () => {
      clearTimeout(startTimer);
      if (tickRef.current) {
        clearTimeout(tickRef.current);
      }
    };
  }, [playTick]);

  const progress =
    rounds.length > 0 ? ((currentTick + 1) / rounds.length) * 100 : 0;
  const eventLabel =
    currentEvent === 'both_hit'
      ? 'Crossfire'
      : currentEvent === 'hit_left'
        ? 'Direct hit'
        : currentEvent === 'hit_right'
          ? 'Return fire'
          : currentEvent === 'dodge_left' || currentEvent === 'dodge_right'
            ? 'Evasion'
            : 'Awaiting strike';
  const eventTone =
    currentEvent === 'dodge_left' || currentEvent === 'dodge_right'
      ? 'warpath-battle-event warpath-battle-event--evasion'
      : 'warpath-battle-event warpath-battle-event--impact';
  const leftLabel = playerSide === 'left' ? 'You' : 'Opponent';
  const rightLabel = playerSide === 'right' ? 'You' : 'Opponent';

  return (
    <motion.div
      className="warpath-battle-engine"
      initial={{ opacity: 0, y: 10 }}
      animate={{
        opacity: 1,
        x: screenShake ? HIT_SHAKE.x : 0,
        y: screenShake ? HIT_SHAKE.y : 0,
      }}
      transition={
        screenShake
          ? { duration: 0.18, ease: [0.34, 1.56, 0.64, 1] }
          : { duration: 0.32, ease: [0.16, 1, 0.3, 1] }
      }
    >
      <div className="warpath-battle-grid" />
      <div className="warpath-battle-stage">
        <div className="warpath-battle-stage__topline">
          <p className="warpath-battle-round">
            Round {Math.max(currentTick + 1, 0)}/{rounds.length}
          </p>
          <div
            className="warpath-battle-progress"
            style={{ '--progress': `${progress}%` } as CSSProperties}
          >
            <motion.div
              className="warpath-battle-progress__fill"
              animate={{ scaleX: progress / 100 }}
              transition={{ duration: 0.24, ease: [0.25, 1, 0.5, 1] }}
              style={{ transformOrigin: 'left center' }}
            />
          </div>
          <p className="warpath-battle-readout">{progress.toFixed(0)}% Complete</p>
        </div>

        <div className="warpath-battle-stage__status">
          <p className={eventTone}>{eventLabel}</p>
          <p className="warpath-battle-stage__status-copy">
            {playerSide === 'left'
              ? 'You are pushing from the left sector.'
              : 'You are pushing from the right sector.'}
          </p>
        </div>

        <div className="warpath-battle-arena">
          <motion.div
            className="warpath-battle-fighter warpath-battle-fighter--left"
            animate={
              currentEvent === 'hit_left' || currentEvent === 'both_hit'
                ? CARD_HIT_SHIFT
                : {}
            }
            transition={{ duration: 0.22, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <GunCard
              imageUrl={battle.left.imageUrl}
              name={battle.left.name}
              tokenId={battle.left.tokenId}
              hp={leftHp}
              stats={leftStats}
              side="left"
              label={leftLabel}
              animated
              className={
                currentEvent === 'hit_left' || currentEvent === 'both_hit'
                  ? 'warpath-gun-card--impact'
                  : undefined
              }
            />
            <AnimatePresence>
              {showMissLeft ? (
                <motion.div
                  className="warpath-battle-miss warpath-battle-miss--left"
                  initial={{ opacity: 0, scale: 0.72, x: 0 }}
                  animate={{ opacity: 1, scale: 1, x: 8 }}
                  exit={{ opacity: 0, y: -12, scale: 0.88 }}
                  transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                >
                  MISS
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>

          <div className="warpath-battle-center">
            <motion.div
              className="warpath-battle-center__core"
              animate={{ opacity: [0.42, 1, 0.42], scale: [0.98, 1.02, 0.98] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: [0.76, 0, 0.24, 1] }}
            >
              <motion.div
                className="warpath-battle-divider"
                animate={{ opacity: [0.24, 0.66, 0.24] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: [0.76, 0, 0.24, 1] }}
              />
              <p className="warpath-battle-center__stamp">Engaged</p>
              <p className="warpath-battle-center__detail">Live fire exchange</p>
            </motion.div>
          </div>

          <motion.div
            className="warpath-battle-fighter warpath-battle-fighter--right"
            animate={
              currentEvent === 'hit_right' || currentEvent === 'both_hit'
                ? {
                    x: [0, 6, -3, 2, 0],
                    opacity: [1, 0.9, 1, 0.95, 1],
                  }
                : {}
            }
            transition={{ duration: 0.22, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <GunCard
              imageUrl={battle.right.imageUrl}
              name={battle.right.name}
              tokenId={battle.right.tokenId}
              hp={rightHp}
              stats={rightStats}
              side="right"
              label={rightLabel}
              animated
              className={
                currentEvent === 'hit_right' || currentEvent === 'both_hit'
                  ? 'warpath-gun-card--impact'
                  : undefined
              }
            />
            <AnimatePresence>
              {showMissRight ? (
                <motion.div
                  className="warpath-battle-miss warpath-battle-miss--right"
                  initial={{ opacity: 0, scale: 0.72, x: 0 }}
                  animate={{ opacity: 1, scale: 1, x: -8 }}
                  exit={{ opacity: 0, y: -12, scale: 0.88 }}
                  transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                >
                  MISS
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
