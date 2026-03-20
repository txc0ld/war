import type { CSSProperties } from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Battle, BattleRound, GunStats } from '@warpath/shared';
import { GUNS_BY_ID } from '@/data/guns';
import { GunCard } from './GunCard';
import { ChatPanel } from '@/components/chat/ChatPanel';
import './battlePresentation.css';

interface BattleEngineProps {
  battle: Battle;
  playerSide?: 'left' | 'right';
  onComplete: (winner: 'left' | 'right') => void;
}

const TICK_DURATION_MS = 520;
const TICK_SPEED_FACTOR_MS = 1.6;
const MIN_TICK_DURATION_MS = 360;
const RESULT_HOLD_MS = 1400;

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
        const speedBonus = Math.max(battle.left.stats.speed, battle.right.stats.speed);
        const adjustedDuration = Math.max(
          MIN_TICK_DURATION_MS,
          TICK_DURATION_MS - speedBonus * TICK_SPEED_FACTOR_MS
        );
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
    [rounds, battle.result.winner, battle.left.stats.speed, battle.right.stats.speed, onComplete]
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
  const leftLabel = playerSide === 'left' ? 'Player' : 'Opponent';
  const rightLabel = playerSide === 'right' ? 'Player' : 'Opponent';

  return (
    <motion.div
      className="warpath-battle-engine"
      initial={{ opacity: 0 }}
      animate={{
        opacity: 1,
        x: screenShake ? [0, -3, 3, -2, 2, 0] : 0,
        y: screenShake ? [0, 2, -2, 1, -1, 0] : 0,
      }}
      transition={screenShake ? { duration: 0.15 } : { duration: 0.3 }}
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
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.2 }}
            />
          </div>
          <p className="warpath-battle-readout">{progress.toFixed(0)}% Complete</p>
        </div>

        <div className="warpath-battle-stage__status">
          <p className="warpath-battle-stage__side warpath-battle-stage__side--left">
            {leftLabel}
          </p>
          <p className={eventTone}>{eventLabel}</p>
          <p className="warpath-battle-stage__side warpath-battle-stage__side--right">
            {rightLabel}
          </p>
        </div>

        <div className="warpath-battle-arena">
          <motion.div
            className="warpath-battle-fighter warpath-battle-fighter--left"
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
              name={GUNS_BY_ID.get(battle.left.tokenId)?.name ?? `Gun #${battle.left.tokenId}`}
              tokenId={battle.left.tokenId}
              hp={leftHp}
              stats={leftStats}
              side="left"
              label={leftLabel}
              animated
            />
            <AnimatePresence>
              {showMissLeft ? (
                <motion.div
                  className="warpath-battle-miss warpath-battle-miss--left"
                  initial={{ opacity: 0, scale: 0.5, x: 0 }}
                  animate={{ opacity: 1, scale: 1, x: 10 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  MISS
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>

          <div className="warpath-battle-center">
            <motion.div
              className="warpath-battle-divider"
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <p className="warpath-battle-center__stamp">Engaged</p>
            <motion.div
              className="warpath-battle-divider"
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.35 }}
            />
          </div>

          <motion.div
            className="warpath-battle-fighter warpath-battle-fighter--right"
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
              name={GUNS_BY_ID.get(battle.right.tokenId)?.name ?? `Gun #${battle.right.tokenId}`}
              tokenId={battle.right.tokenId}
              hp={rightHp}
              stats={rightStats}
              side="right"
              label={rightLabel}
              animated
            />
            <AnimatePresence>
              {showMissRight ? (
                <motion.div
                  className="warpath-battle-miss warpath-battle-miss--right"
                  initial={{ opacity: 0, scale: 0.5, x: 0 }}
                  animate={{ opacity: 1, scale: 1, x: -10 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  MISS
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>
        </div>

        <div className="warpath-battle-sidebar">
          <ChatPanel embedded />
        </div>
      </div>
    </motion.div>
  );
}
