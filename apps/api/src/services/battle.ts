import { eq } from 'drizzle-orm';
import { keccak256, encodePacked } from 'viem';
import {
  resolveBattle,
  getStatsForToken,
} from '@warpath/shared';
import type { BattleRound } from '@warpath/shared';
import { db } from '../db/client';
import { battles } from '../db/schema';
import { getGunMetadataByTokenId } from './guns';

export interface Fighter {
  address: string;
  tokenId: number;
}

export function resolveBattleForMatch(
  left: Fighter,
  right: Fighter
): {
  leftStats: ReturnType<typeof getStatsForToken>;
  rightStats: ReturnType<typeof getStatsForToken>;
  result: ReturnType<typeof resolveBattle>;
} {
  const leftStats = getStatsForToken(left.tokenId);
  const rightStats = getStatsForToken(right.tokenId);

  // Deterministic seed from both token IDs + timestamp bucket (hourly)
  const timeBucket = Math.floor(Date.now() / 3600000);
  const seed = keccak256(
    encodePacked(
      ['uint256', 'uint256', 'uint256'],
      [BigInt(left.tokenId), BigInt(right.tokenId), BigInt(timeBucket)]
    )
  );

  const result = resolveBattle(leftStats, rightStats, seed);

  return { leftStats, rightStats, result };
}

export async function getBattle(battleId: string): Promise<{
  id: string;
  left: { address: string; tokenId: number; stats: ReturnType<typeof getStatsForToken>; imageUrl: string };
  right: { address: string; tokenId: number; stats: ReturnType<typeof getStatsForToken>; imageUrl: string };
  result: {
    winner: 'left' | 'right';
    leftHpRemaining: number;
    rightHpRemaining: number;
    rounds: BattleRound[];
  };
  resolvedAt: string;
} | null> {
  const [battle] = await db
    .select()
    .from(battles)
    .where(eq(battles.id, battleId))
    .limit(1);

  if (!battle) return null;

  const [leftGun, rightGun] = await Promise.all([
    getGunMetadataByTokenId(battle.leftToken),
    getGunMetadataByTokenId(battle.rightToken),
  ]);

  return {
    id: battle.id,
    left: {
      address: battle.leftAddress,
      tokenId: battle.leftToken,
      stats: getStatsForToken(battle.leftToken),
      imageUrl: leftGun.image,
    },
    right: {
      address: battle.rightAddress,
      tokenId: battle.rightToken,
      stats: getStatsForToken(battle.rightToken),
      imageUrl: rightGun.image,
    },
    result: {
      winner: battle.winner as 'left' | 'right',
      leftHpRemaining: battle.leftHp,
      rightHpRemaining: battle.rightHp,
      rounds: battle.roundsJson as unknown as BattleRound[],
    },
    resolvedAt: battle.resolvedAt?.toISOString() ?? new Date().toISOString(),
  };
}
