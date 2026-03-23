import { concatHex, encodePacked, keccak256, stringToHex } from 'viem';
import type {
  BattleCommitPreimage,
  BattleProof,
  BattleProofVerification,
  BattleResult,
  BattleRound,
  GunStats,
} from './types.js';
import {
  BATTLE_CONFIG,
  BATTLE_ENGINE_VERSION,
} from './constants.js';

function normalizeSeed(seed: string): `0x${string}` {
  const normalized = seed.toLowerCase();

  if (/^0x[0-9a-f]{64}$/.test(normalized)) {
    return normalized as `0x${string}`;
  }

  return keccak256(stringToHex(seed));
}

function deterministicRandom(seed: `0x${string}`, index: number): number {
  const hash = keccak256(
    encodePacked(['bytes32', 'uint256'], [seed, BigInt(index)])
  );
  const slice = hash.slice(2, 18);
  return Number.parseInt(slice, 16) / 0xffffffffffffffff;
}

function canonicalize(value: unknown): string {
  if (value === null) {
    return 'null';
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return JSON.stringify(value);
  }

  if (typeof value === 'string') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((entry) => canonicalize(entry)).join(',')}]`;
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
      a.localeCompare(b)
    );
    return `{${entries
      .map(([key, entry]) => `${JSON.stringify(key)}:${canonicalize(entry)}`)
      .join(',')}}`;
  }

  return JSON.stringify(String(value));
}

function normalizeHex(value: string): `0x${string}` {
  return (
    value.startsWith('0x') ? value.toLowerCase() : `0x${value.toLowerCase()}`
  ) as `0x${string}`;
}

export function createBattleCommitmentHash(
  preimage: BattleCommitPreimage
): `0x${string}` {
  return keccak256(stringToHex(canonicalize(preimage)));
}

export function createBattleSeed(
  commitHash: `0x${string}`,
  drandRandomness: string
): `0x${string}` {
  return keccak256(concatHex([commitHash, normalizeHex(drandRandomness)]));
}

export function getStatsForToken(tokenId: number): GunStats {
  const seed = keccak256(
    encodePacked(['string', 'uint256'], [BATTLE_CONFIG.STAT_SALT, BigInt(tokenId)])
  );

  return {
    damage: Math.floor(deterministicRandom(seed, 0) * 100) + 1,
    dodge: Math.floor(deterministicRandom(seed, 1) * 100) + 1,
    speed: Math.floor(deterministicRandom(seed, 2) * 100) + 1,
  };
}

function fluctuateStats(
  stats: GunStats,
  seed: `0x${string}`,
  tick: number
): GunStats {
  const fluctuate = (value: number, offset: number): number => {
    const random = deterministicRandom(seed, tick + offset);
    const delta = value * BATTLE_CONFIG.STAT_FLUCTUATION * (random * 2 - 1);
    return Math.max(1, Math.min(100, Math.round(value + delta)));
  };

  return {
    damage: fluctuate(stats.damage, 5_000),
    dodge: fluctuate(stats.dodge, 6_000),
    speed: fluctuate(stats.speed, 7_000),
  };
}

class SeededRng {
  private index = 0;

  constructor(private readonly seed: `0x${string}`) {}

  nextFloat(): number {
    return deterministicRandom(this.seed, this.index++);
  }

  nextInt(maxExclusive: number): number {
    if (maxExclusive <= 1) {
      return 0;
    }

    return Math.floor(this.nextFloat() * maxExclusive);
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function getBattleWinChance(options?: {
  leftArsenalBonus?: boolean;
  rightArsenalBonus?: boolean;
}): number {
  const leftBonus = options?.leftArsenalBonus
    ? BATTLE_CONFIG.ARSENAL_WIN_CHANCE_BONUS
    : 0;
  const rightBonus = options?.rightArsenalBonus
    ? BATTLE_CONFIG.ARSENAL_WIN_CHANCE_BONUS
    : 0;

  return clamp(
    BATTLE_CONFIG.BASE_WIN_CHANCE + leftBonus - rightBonus,
    0.05,
    0.95
  );
}

function rollAttack(rng: SeededRng): { damage: number; dodged: boolean; crit: boolean } {
  if (rng.nextFloat() < BATTLE_CONFIG.ATTACK_DODGE_CHANCE) {
    return { damage: 0, dodged: true, crit: false };
  }

  let damage =
    BATTLE_CONFIG.ATTACK_DAMAGE_MIN +
    rng.nextInt(
      BATTLE_CONFIG.ATTACK_DAMAGE_MAX - BATTLE_CONFIG.ATTACK_DAMAGE_MIN + 1
    );
  const crit = rng.nextFloat() < BATTLE_CONFIG.ATTACK_CRIT_CHANCE;

  if (crit) {
    damage = Math.round(damage * 1.5);
  }

  return { damage, dodged: false, crit };
}

export function effectivePower(
  _stats: GunStats,
  hasArsenalBonus = false
): number {
  return hasArsenalBonus ? 1 + BATTLE_CONFIG.ARSENAL_WIN_CHANCE_BONUS : 1;
}

export function resolveBattle(
  left: GunStats,
  right: GunStats,
  seed: string,
  options?: {
    leftArsenalBonus?: boolean;
    rightArsenalBonus?: boolean;
  }
): BattleResult {
  const normalizedSeed = normalizeSeed(seed);
  const rng = new SeededRng(normalizedSeed);
  const leftWinChance = getBattleWinChance(options);
  const winner: 'left' | 'right' =
    rng.nextFloat() < leftWinChance ? 'left' : 'right';

  let leftHp: number = BATTLE_CONFIG.MAX_HP;
  let rightHp: number = BATTLE_CONFIG.MAX_HP;
  const rounds: BattleRound[] = [];
  const maxTicks =
    BATTLE_CONFIG.MIN_TICKS +
    rng.nextInt(BATTLE_CONFIG.MAX_TICKS - BATTLE_CONFIG.MIN_TICKS + 1);

  for (let tick = 0; tick < maxTicks && leftHp > 0 && rightHp > 0; tick += 1) {
    const leftFirst = rng.nextFloat() >= 0.5;
    let event: BattleRound['event'] = 'both_hit';

    if (leftFirst) {
      const leftAttack = rollAttack(rng);
      if (!leftAttack.dodged) {
        rightHp = Math.max(0, rightHp - leftAttack.damage);
        event = 'hit_right';
      } else {
        event = 'dodge_right';
      }

      if (rightHp > 0) {
        const rightAttack = rollAttack(rng);
        if (!rightAttack.dodged) {
          leftHp = Math.max(0, leftHp - rightAttack.damage);
          event = event === 'hit_right' ? 'both_hit' : 'hit_left';
        } else if (event !== 'hit_right') {
          event = 'dodge_left';
        }
      }
    } else {
      const rightAttack = rollAttack(rng);
      if (!rightAttack.dodged) {
        leftHp = Math.max(0, leftHp - rightAttack.damage);
        event = 'hit_left';
      } else {
        event = 'dodge_left';
      }

      if (leftHp > 0) {
        const leftAttack = rollAttack(rng);
        if (!leftAttack.dodged) {
          rightHp = Math.max(0, rightHp - leftAttack.damage);
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
      leftStatsDisplay: fluctuateStats(left, normalizedSeed, tick),
      rightStatsDisplay: fluctuateStats(right, normalizedSeed, tick + 100),
      event,
    });
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
      leftStatsDisplay: lastRound?.leftStatsDisplay ?? left,
      rightStatsDisplay: lastRound?.rightStatsDisplay ?? right,
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

export function buildBattleCommitPreimage(input: {
  leftAddress: string;
  leftTokenId: number;
  leftStats: GunStats;
  leftArsenalBonus: boolean;
  rightAddress: string;
  rightTokenId: number;
  rightStats: GunStats;
  rightArsenalBonus: boolean;
  targetRound: number;
}): BattleCommitPreimage {
  return {
    engineVersion: BATTLE_ENGINE_VERSION,
    leftAddress: input.leftAddress,
    leftTokenId: input.leftTokenId,
    leftStats: input.leftStats,
    leftArsenalBonus: input.leftArsenalBonus,
    rightAddress: input.rightAddress,
    rightTokenId: input.rightTokenId,
    rightStats: input.rightStats,
    rightArsenalBonus: input.rightArsenalBonus,
    targetRound: input.targetRound,
  };
}

export function recomputeBattleResultFromProof(
  proof: BattleProof
): BattleResult {
  return resolveBattle(
    proof.preimage.leftStats,
    proof.preimage.rightStats,
    proof.battleSeed,
    {
      leftArsenalBonus: proof.preimage.leftArsenalBonus,
      rightArsenalBonus: proof.preimage.rightArsenalBonus,
    }
  );
}

export function verifyBattleProof(
  proof: BattleProof
): BattleProofVerification {
  const recomputedCommitHash = createBattleCommitmentHash(proof.preimage);
  const recomputedBattleSeed = createBattleSeed(
    recomputedCommitHash,
    proof.drand.randomness
  );
  const recomputedResult = recomputeBattleResultFromProof({
    ...proof,
    battleSeed: recomputedBattleSeed,
  });
  const commitHashValid = recomputedCommitHash === proof.commitHash;
  const battleSeedValid = recomputedBattleSeed === proof.battleSeed;
  const resultValid =
    canonicalize(recomputedResult) === canonicalize(proof.result);

  return {
    verified: commitHashValid && battleSeedValid && resultValid,
    commitHashValid,
    battleSeedValid,
    resultValid,
    recomputedCommitHash,
    recomputedBattleSeed,
    recomputedResult,
  };
}
