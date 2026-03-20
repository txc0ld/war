import type { BattleResult, BattleRound, GunStats } from '@warpath/shared';
import { TIER_CONFIG } from '@/data/guns';
import { hashSeed, seededRandom } from './rng';

export function generateStats(
  gunId: number,
  tier: keyof typeof TIER_CONFIG
): GunStats {
  const [min, max] = TIER_CONFIG[tier].statRange;
  const rng = seededRandom(gunId * 7919);
  return {
    damage: Math.round(min + rng() * (max - min)),
    dodge: Math.round(min + rng() * (max - min)),
    speed: Math.round(min + rng() * (max - min)),
  };
}

export function calcPower(stats: GunStats, holderGunCount: number): number {
  const base = stats.damage * 0.5 + stats.dodge * 0.25 + stats.speed * 0.25;
  const buff = holderGunCount >= 3 ? 1.1 : 1;
  return Number((base * buff).toFixed(2));
}

function fluctuateStat(value: number, variation: number): number {
  const adjusted = value + (variation * 2 - 1) * 4;
  return Math.max(1, Math.min(100, Math.round(adjusted)));
}

function fluctuateStats(stats: GunStats, rng: () => number): GunStats {
  return {
    damage: fluctuateStat(stats.damage, rng()),
    dodge: fluctuateStat(stats.dodge, rng()),
    speed: fluctuateStat(stats.speed, rng()),
  };
}

export function resolveWeightedBattle(
  leftStats: GunStats,
  rightStats: GunStats,
  leftGunCount: number,
  rightGunCount: number,
  seed: string
): BattleResult {
  const rng = seededRandom(hashSeed(seed));
  const leftBuff = leftGunCount >= 3 ? 1.1 : 1;
  const rightBuff = rightGunCount >= 3 ? 1.1 : 1;
  const leftPower = calcPower(leftStats, leftGunCount);
  const rightPower = calcPower(rightStats, rightGunCount);

  let leftHp = 100;
  let rightHp = 100;
  const rounds: BattleRound[] = [];
  let tick = 0;

  while (leftHp > 0 && rightHp > 0 && tick < 18) {
    const attackerFirst =
      leftStats.speed + rng() * 20 > rightStats.speed + rng() * 20;

    let damageToRight = leftStats.damage * leftBuff * (0.7 + rng() * 0.6);
    let damageToLeft = rightStats.damage * rightBuff * (0.7 + rng() * 0.6);

    if (rng() < 0.05 + (leftPower > rightPower ? 0.05 : 0)) {
      damageToRight *= 1.5;
    }

    if (rng() < 0.05 + (rightPower > leftPower ? 0.05 : 0)) {
      damageToLeft *= 1.5;
    }

    const rightDodged = rng() < rightStats.dodge / 200;
    const leftDodged = rng() < leftStats.dodge / 200;

    let event: BattleRound['event'] = 'both_hit';

    if (attackerFirst) {
      if (!rightDodged) {
        rightHp = Math.max(0, rightHp - Math.round(damageToRight));
        event = 'hit_right';
      } else {
        event = 'dodge_right';
      }

      if (rightHp > 0) {
        if (!leftDodged) {
          leftHp = Math.max(0, leftHp - Math.round(damageToLeft));
          event = event === 'hit_right' ? 'both_hit' : 'hit_left';
        } else if (event !== 'hit_right') {
          event = 'dodge_left';
        }
      }
    } else {
      if (!leftDodged) {
        leftHp = Math.max(0, leftHp - Math.round(damageToLeft));
        event = 'hit_left';
      } else {
        event = 'dodge_left';
      }

      if (leftHp > 0) {
        if (!rightDodged) {
          rightHp = Math.max(0, rightHp - Math.round(damageToRight));
          event = event === 'hit_left' ? 'both_hit' : 'hit_right';
        } else if (event !== 'hit_left') {
          event = 'dodge_right';
        }
      }
    }

    rounds.push({
      tick,
      leftHp,
      rightHp,
      leftStatsDisplay: fluctuateStats(leftStats, rng),
      rightStatsDisplay: fluctuateStats(rightStats, rng),
      event,
    });

    tick += 1;
  }

  const winner = leftHp === rightHp ? (leftPower >= rightPower ? 'left' : 'right') : leftHp > rightHp ? 'left' : 'right';
  if (winner === 'left' && rightHp > 0) {
    rightHp = 0;
  }

  if (winner === 'right' && leftHp > 0) {
    leftHp = 0;
  }

  const lastRound = rounds.at(-1);
  if (!lastRound || lastRound.leftHp !== leftHp || lastRound.rightHp !== rightHp) {
    rounds.push({
      tick: rounds.length,
      leftHp,
      rightHp,
      leftStatsDisplay: lastRound?.leftStatsDisplay ?? leftStats,
      rightStatsDisplay: lastRound?.rightStatsDisplay ?? rightStats,
      event: winner === 'left' ? 'hit_right' : 'hit_left',
    });
  }

  return {
    winner,
    leftHpRemaining: leftHp,
    rightHpRemaining: rightHp,
    rounds,
  };
}
