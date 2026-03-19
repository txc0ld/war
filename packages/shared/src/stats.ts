import { keccak256, encodePacked } from 'viem';
import type { GunStats, BattleResult, BattleRound } from './types.js';
import { BATTLE_CONFIG } from './constants.js';

function deterministicRandom(seed: string, index: number): number {
  const hash = keccak256(
    encodePacked(['string', 'uint256'], [seed, BigInt(index)])
  );
  const slice = hash.slice(2, 10);
  return parseInt(slice, 16) / 0xffffffff;
}

export function getStatsForToken(tokenId: number): GunStats {
  const salt = BATTLE_CONFIG.STAT_SALT;
  const seed = keccak256(
    encodePacked(['string', 'uint256'], [salt, BigInt(tokenId)])
  );

  const damage = Math.floor(deterministicRandom(seed, 0) * 100) + 1;
  const dodge = Math.floor(deterministicRandom(seed, 1) * 100) + 1;
  const speed = Math.floor(deterministicRandom(seed, 2) * 100) + 1;

  return { damage, dodge, speed };
}

function compositeScore(stats: GunStats): number {
  return stats.damage * 0.4 + stats.dodge * 0.3 + stats.speed * 0.3;
}

function fluctuateStats(stats: GunStats, rng: number): GunStats {
  const f = BATTLE_CONFIG.STAT_FLUCTUATION;
  const fluctuate = (val: number, r: number): number => {
    const delta = val * f * (r * 2 - 1);
    return Math.max(1, Math.min(100, Math.round(val + delta)));
  };
  return {
    damage: fluctuate(stats.damage, rng),
    dodge: fluctuate(stats.dodge, deterministicRandom(String(rng), 1)),
    speed: fluctuate(stats.speed, deterministicRandom(String(rng), 2)),
  };
}

export function resolveBattle(
  left: GunStats,
  right: GunStats,
  seed: string
): BattleResult {
  const leftScore = compositeScore(left);
  const rightScore = compositeScore(right);
  const determinedWinner: 'left' | 'right' =
    leftScore >= rightScore ? 'left' : 'right';

  let leftHp: number = BATTLE_CONFIG.MAX_HP;
  let rightHp: number = BATTLE_CONFIG.MAX_HP;
  const rounds: BattleRound[] = [];

  const targetTicks =
    BATTLE_CONFIG.MIN_TICKS +
    Math.floor(
      deterministicRandom(seed, 999) *
        (BATTLE_CONFIG.MAX_TICKS - BATTLE_CONFIG.MIN_TICKS)
    );

  for (let tick = 0; tick < targetTicks && leftHp > 0 && rightHp > 0; tick++) {
    const rng = deterministicRandom(seed, tick);
    const rng2 = deterministicRandom(seed, tick + 1000);
    const rng3 = deterministicRandom(seed, tick + 2000);
    const rng4 = deterministicRandom(seed, tick + 3000);

    const leftGoesFirst = left.speed + rng * 20 >= right.speed + rng2 * 20;

    let event: BattleRound['event'] = 'both_hit';
    const leftDodges = rng3 * 100 < left.dodge * 0.5;
    const rightDodges = rng4 * 100 < right.dodge * 0.5;

    if (leftGoesFirst) {
      if (!rightDodges) {
        const dmg = Math.max(1, Math.floor(left.damage * 0.15 * (0.8 + rng * 0.4)));
        rightHp = Math.max(0, rightHp - dmg);
        event = 'hit_right';
      } else {
        event = 'dodge_right';
      }
      if (rightHp > 0 && !leftDodges) {
        const dmg = Math.max(1, Math.floor(right.damage * 0.15 * (0.8 + rng2 * 0.4)));
        leftHp = Math.max(0, leftHp - dmg);
        if (event === 'hit_right') event = 'both_hit';
        else event = 'hit_left';
      } else if (rightHp > 0 && leftDodges && event !== 'hit_right') {
        event = 'dodge_left';
      }
    } else {
      if (!leftDodges) {
        const dmg = Math.max(1, Math.floor(right.damage * 0.15 * (0.8 + rng2 * 0.4)));
        leftHp = Math.max(0, leftHp - dmg);
        event = 'hit_left';
      } else {
        event = 'dodge_left';
      }
      if (leftHp > 0 && !rightDodges) {
        const dmg = Math.max(1, Math.floor(left.damage * 0.15 * (0.8 + rng * 0.4)));
        rightHp = Math.max(0, rightHp - dmg);
        if (event === 'hit_left') event = 'both_hit';
        else event = 'hit_right';
      } else if (leftHp > 0 && rightDodges && event !== 'hit_left') {
        event = 'dodge_right';
      }
    }

    rounds.push({
      tick,
      leftHp,
      rightHp,
      leftStatsDisplay: fluctuateStats(left, deterministicRandom(seed, tick + 5000)),
      rightStatsDisplay: fluctuateStats(right, deterministicRandom(seed, tick + 6000)),
      event,
    });
  }

  // Ensure deterministic winner wins
  if (determinedWinner === 'left' && leftHp <= rightHp) {
    leftHp = Math.max(1, leftHp);
    rightHp = 0;
  } else if (determinedWinner === 'right' && rightHp <= leftHp) {
    rightHp = Math.max(1, rightHp);
    leftHp = 0;
  } else if (leftHp > 0 && rightHp > 0) {
    if (determinedWinner === 'left') rightHp = 0;
    else leftHp = 0;
  }

  // Append final round if HP was forced
  const lastRound = rounds[rounds.length - 1];
  if (lastRound && (lastRound.leftHp !== leftHp || lastRound.rightHp !== rightHp)) {
    rounds.push({
      tick: rounds.length,
      leftHp,
      rightHp,
      leftStatsDisplay: lastRound.leftStatsDisplay,
      rightStatsDisplay: lastRound.rightStatsDisplay,
      event: determinedWinner === 'left' ? 'hit_right' : 'hit_left',
    });
  }

  return {
    winner: determinedWinner,
    leftHpRemaining: leftHp,
    rightHpRemaining: rightHp,
    rounds,
  };
}
