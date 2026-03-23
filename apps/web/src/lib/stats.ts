import type { BattleResult, BattleRound, GunStats } from '@warpath/shared';
import { BATTLE_CONFIG } from '@warpath/shared';
import { TIER_CONFIG } from '@/data/guns';
import { createDeterministicRandom } from './rng';

export function generateStats(
  gunId: number,
  tier: keyof typeof TIER_CONFIG
): GunStats {
  const [min, max] = TIER_CONFIG[tier].statRange;
  const rng = createDeterministicRandom(`war-room-gun-${gunId}`);
  return {
    damage: Math.round(min + rng(0) * (max - min)),
    dodge: Math.round(min + rng(1) * (max - min)),
    speed: Math.round(min + rng(2) * (max - min)),
  };
}

export function calcPower(stats: GunStats, holderGunCount: number): number {
  return holderGunCount >= 3 ? 1 + BATTLE_CONFIG.ARSENAL_WIN_CHANCE_BONUS : 1;
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
  const rng = createDeterministicRandom(seed);
  const leftWinChance =
    BATTLE_CONFIG.BASE_WIN_CHANCE +
    (leftGunCount >= 3 ? BATTLE_CONFIG.ARSENAL_WIN_CHANCE_BONUS : 0) -
    (rightGunCount >= 3 ? BATTLE_CONFIG.ARSENAL_WIN_CHANCE_BONUS : 0);
  const winner: 'left' | 'right' = rng(0) < leftWinChance ? 'left' : 'right';
  let rngIndex = 0;
  const nextRandom = () => rng(rngIndex++);

  let leftHp = 100;
  let rightHp = 100;
  const rounds: BattleRound[] = [];
  let tick = 0;

  while (leftHp > 0 && rightHp > 0 && tick < 30) {
    const attackerFirst = nextRandom() >= 0.5;
    let damageToRight = 6 + Math.floor(nextRandom() * 11);
    let damageToLeft = 6 + Math.floor(nextRandom() * 11);

    if (nextRandom() < 0.08) {
      damageToRight = Math.round(damageToRight * 1.5);
    }

    if (nextRandom() < 0.08) {
      damageToLeft = Math.round(damageToLeft * 1.5);
    }

    const rightDodged = nextRandom() < 0.12;
    const leftDodged = nextRandom() < 0.12;

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
      leftStatsDisplay: fluctuateStats(leftStats, nextRandom),
      rightStatsDisplay: fluctuateStats(rightStats, nextRandom),
      event,
    });

    tick += 1;
  }

  if (winner === 'left') {
    leftHp = Math.max(1, leftHp);
    rightHp = 0;
  } else {
    rightHp = Math.max(1, rightHp);
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
