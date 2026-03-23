import { and, eq, lt, or, sql } from 'drizzle-orm';
import { getAddress } from 'viem';
import type {
  Battle,
  BattleCommitPreimage,
  BattleProof,
  BattleReplay,
  BattleResult,
} from '@warpath/shared';
import {
  BATTLE_ENGINE_VERSION,
  DRAND_QUICKNET,
  POINTS,
  buildBattleCommitPreimage,
  createBattleCommitmentHash,
  createBattleSeed,
  getStatsForToken,
  resolveBattle,
} from '@warpath/shared';
import { db } from '../db/client';
import { battles, players } from '../db/schema';
import { AppError } from '../lib/errors';
import {
  estimatedResolveTimeIso,
  fetchVerifiedDrandRound,
  futureRound,
  timeOfRound,
} from './drand';
import { getGunMetadataByTokenId } from './guns';
import { applyWalletCooldown } from './players';
import { getBattleResultsVisibilityByAddress } from './profiles';

export interface Fighter {
  address: string;
  tokenId: number;
  gunCount: number;
}

type BattleRow = typeof battles.$inferSelect;

function hasProof(row: BattleRow): boolean {
  return (
    row.status === 'resolved' &&
    !!row.commitHash &&
    !!row.commitPreimageJson &&
    !!row.drandRound &&
    !!row.drandRandomness &&
    !!row.drandSignature &&
    !!row.battleSeed &&
    !!row.roundsJson &&
    !!row.winner
  );
}

function parseCommitPreimage(row: BattleRow): BattleCommitPreimage | null {
  if (!row.commitPreimageJson || typeof row.commitPreimageJson !== 'object') {
    return null;
  }

  return row.commitPreimageJson as BattleCommitPreimage;
}

function estimatedResolveTime(row: BattleRow): string | null {
  return row.drandRound ? estimatedResolveTimeIso(row.drandRound) : null;
}

async function isBattlePublic(row: BattleRow): Promise<boolean> {
  const visibility = await getBattleResultsVisibilityByAddress([
    row.leftAddress,
    row.rightAddress,
  ]);

  return (
    (visibility.get(getAddress(row.leftAddress)) ?? true) &&
    (visibility.get(getAddress(row.rightAddress)) ?? true)
  );
}

export function createBattleCommitmentForMatch(
  left: Fighter,
  right: Fighter
): {
  leftStats: ReturnType<typeof getStatsForToken>;
  rightStats: ReturnType<typeof getStatsForToken>;
  preimage: BattleCommitPreimage;
  commitHash: `0x${string}`;
  targetRound: number;
  estimatedResolveTime: string;
} {
  const leftStats = getStatsForToken(left.tokenId);
  const rightStats = getStatsForToken(right.tokenId);
  const targetRound = futureRound();
  const preimage = buildBattleCommitPreimage({
    leftAddress: left.address,
    leftTokenId: left.tokenId,
    leftStats,
    leftArsenalBonus: left.gunCount >= 3,
    rightAddress: right.address,
    rightTokenId: right.tokenId,
    rightStats,
    rightArsenalBonus: right.gunCount >= 3,
    targetRound,
  });

  return {
    leftStats,
    rightStats,
    preimage,
    commitHash: createBattleCommitmentHash(preimage),
    targetRound,
    estimatedResolveTime: estimatedResolveTimeIso(targetRound),
  };
}

async function serializeBattle(row: BattleRow): Promise<Battle> {
  const [leftGun, rightGun] = await Promise.all([
    getGunMetadataByTokenId(row.leftToken),
    getGunMetadataByTokenId(row.rightToken),
  ]);
  const preimage = parseCommitPreimage(row);
  const proofAvailable = hasProof(row);
  const base = {
    id: row.id,
    status: row.status as Battle['status'],
    engineVersion: row.engineVersion,
    commitHash: (row.commitHash ?? null) as Battle['commitHash'],
    targetRound: row.drandRound ?? null,
    estimatedResolveTime: estimatedResolveTime(row),
    committedAt: row.committedAt?.toISOString() ?? null,
    resolvedAt: row.resolvedAt?.toISOString() ?? null,
    proofAvailable,
    left: {
      address: row.leftAddress,
      tokenId: row.leftToken,
      name: leftGun.name,
      stats: getStatsForToken(row.leftToken),
      imageUrl: leftGun.image,
      arsenalBonus: preimage?.leftArsenalBonus ?? false,
    },
    right: {
      address: row.rightAddress,
      tokenId: row.rightToken,
      name: rightGun.name,
      stats: getStatsForToken(row.rightToken),
      imageUrl: rightGun.image,
      arsenalBonus: preimage?.rightArsenalBonus ?? false,
    },
  };

  if (row.status === 'resolved' && row.winner && row.roundsJson) {
    return {
      ...base,
      status: 'resolved',
      result: {
        winner: row.winner as 'left' | 'right',
        leftHpRemaining: row.leftHp ?? 0,
        rightHpRemaining: row.rightHp ?? 0,
        rounds: row.roundsJson as BattleResult['rounds'],
      },
    };
  }

  if (row.status === 'failed') {
    return {
      ...base,
      status: 'failed',
      result: null,
      resolutionError: row.resolutionError ?? 'Battle resolution failed',
    };
  }

  return {
    ...base,
    status: row.status === 'resolving' ? 'resolving' : 'committed',
    result: null,
  };
}

async function applyResolvedBattleOutcome(
  tx: Pick<typeof db, 'select' | 'update'>,
  row: BattleRow,
  result: BattleResult
): Promise<void> {
  const winnerAddress = result.winner === 'left' ? row.leftAddress : row.rightAddress;
  const loserAddress = result.winner === 'left' ? row.rightAddress : row.leftAddress;

  const [winnerPlayer, loserPlayer] = await Promise.all([
    tx
      .select({ gunCount: players.gunCount })
      .from(players)
      .where(eq(players.address, winnerAddress))
      .limit(1),
    tx
      .select({ gunCount: players.gunCount })
      .from(players)
      .where(eq(players.address, loserAddress))
      .limit(1),
  ]);

  const winnerMultiplier =
    (winnerPlayer[0]?.gunCount ?? 0) >= 3 ? POINTS.THREE_GUN_MULTIPLIER : 1;

  await tx
    .update(players)
    .set({
      score: sql`${players.score} + ${Math.round(POINTS.WIN * winnerMultiplier)}`,
      wins: sql`${players.wins} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(players.address, winnerAddress));

  await tx
    .update(players)
    .set({
      score: sql`${players.score} + ${POINTS.LOSS}`,
      losses: sql`${players.losses} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(players.address, loserAddress));

  const leftGunCount =
    row.leftAddress === winnerAddress
      ? (winnerPlayer[0]?.gunCount ?? 0)
      : (loserPlayer[0]?.gunCount ?? 0);
  const rightGunCount =
    row.rightAddress === winnerAddress
      ? (winnerPlayer[0]?.gunCount ?? 0)
      : (loserPlayer[0]?.gunCount ?? 0);

  await Promise.all([
    applyWalletCooldown(tx, row.leftAddress, leftGunCount),
    applyWalletCooldown(tx, row.rightAddress, rightGunCount),
  ]);
}

async function tryResolveBattle(row: BattleRow): Promise<void> {
  const preimage = parseCommitPreimage(row);
  if (!preimage || !row.commitHash || !row.drandRound) {
    return;
  }

  const [acquired] = await db
    .update(battles)
    .set({
      status: 'resolving',
      resolutionError: null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(battles.id, row.id),
        or(
          eq(battles.status, 'committed'),
          eq(battles.status, 'failed'),
          and(
            eq(battles.status, 'resolving'),
            lt(battles.updatedAt, new Date(Date.now() - 30_000))
          )
        )
      )
    )
    .returning();

  if (!acquired) {
    return;
  }

  try {
    const drand = await fetchVerifiedDrandRound(acquired.drandRound!);
    const battleSeed = createBattleSeed(
      acquired.commitHash as `0x${string}`,
      drand.randomness
    );
    const result = resolveBattle(
      preimage.leftStats,
      preimage.rightStats,
      battleSeed,
      {
        leftArsenalBonus: preimage.leftArsenalBonus,
        rightArsenalBonus: preimage.rightArsenalBonus,
      }
    );

    await db.transaction(async (tx) => {
      const [resolvedRow] = await tx
        .update(battles)
        .set({
          status: 'resolved',
          winner: result.winner,
          leftHp: result.leftHpRemaining,
          rightHp: result.rightHpRemaining,
          roundsJson: result.rounds as unknown as Record<string, unknown>,
          drandRandomness: drand.randomness,
          drandSignature: drand.signature,
          battleSeed,
          engineVersion: BATTLE_ENGINE_VERSION,
          resolutionError: null,
          resolvedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(and(eq(battles.id, acquired.id), eq(battles.status, 'resolving')))
        .returning();

      if (!resolvedRow) {
        return;
      }

      await applyResolvedBattleOutcome(tx, resolvedRow, result);
    });
  } catch (error) {
    await db
      .update(battles)
      .set({
        status:
          Date.now() < timeOfRound(acquired.drandRound!) * 1000
            ? 'committed'
            : 'failed',
        resolutionError:
          error instanceof Error ? error.message.slice(0, 500) : 'Unknown resolution error',
        updatedAt: new Date(),
      })
      .where(eq(battles.id, acquired.id));
  }
}

export async function ensureBattleResolved(battleId: string): Promise<void> {
  const [row] = await db
    .select()
    .from(battles)
    .where(eq(battles.id, battleId))
    .limit(1);

  if (!row || row.status === 'resolved') {
    return;
  }

  if (!row.drandRound || Date.now() < timeOfRound(row.drandRound) * 1000) {
    return;
  }

  await tryResolveBattle(row);
}

export async function getBattle(battleId: string): Promise<Battle | null> {
  await ensureBattleResolved(battleId);

  const [battle] = await db
    .select()
    .from(battles)
    .where(eq(battles.id, battleId))
    .limit(1);

  if (!battle) {
    return null;
  }

  if (!(await isBattlePublic(battle))) {
    return null;
  }

  return serializeBattle(battle);
}

export async function getBattleProof(battleId: string): Promise<BattleProof | null> {
  await ensureBattleResolved(battleId);

  const [battle] = await db
    .select()
    .from(battles)
    .where(eq(battles.id, battleId))
    .limit(1);

  if (!battle || !hasProof(battle)) {
    return null;
  }

  if (!(await isBattlePublic(battle))) {
    return null;
  }

  return {
    engineVersion: battle.engineVersion,
    commitHash: battle.commitHash as `0x${string}`,
    preimage: battle.commitPreimageJson as BattleCommitPreimage,
    drand: {
      chainHash: DRAND_QUICKNET.chainHash,
      publicKey: DRAND_QUICKNET.publicKey,
      round: battle.drandRound!,
      randomness: battle.drandRandomness!,
      signature: battle.drandSignature!,
      relaysChecked: [],
    },
    battleSeed: battle.battleSeed as `0x${string}`,
    result: {
      winner: battle.winner as 'left' | 'right',
      leftHpRemaining: battle.leftHp ?? 0,
      rightHpRemaining: battle.rightHp ?? 0,
      rounds: battle.roundsJson as BattleResult['rounds'],
    },
  };
}

export async function getBattleReplay(battleId: string): Promise<BattleReplay> {
  await ensureBattleResolved(battleId);

  const [battle] = await db
    .select()
    .from(battles)
    .where(eq(battles.id, battleId))
    .limit(1);

  if (!battle) {
    throw new AppError(404, 'BATTLE_NOT_FOUND', 'Battle not found');
  }

  if (!(await isBattlePublic(battle))) {
    throw new AppError(404, 'BATTLE_NOT_FOUND', 'Battle not found');
  }

  return {
    battleId: battle.id,
    status: battle.status as Battle['status'],
    rounds: battle.status === 'resolved'
      ? (battle.roundsJson as BattleResult['rounds'])
      : null,
    winner:
      battle.status === 'resolved' ? (battle.winner as 'left' | 'right') : null,
    resolvedAt: battle.resolvedAt?.toISOString() ?? null,
  };
}
