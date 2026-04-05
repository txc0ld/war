import { randomUUID } from 'node:crypto';
import { and, eq, isNull, lt, ne, sql } from 'drizzle-orm';
import type {
  BattleStatus,
  QueueCancelResponse,
  QueueJoinResponse,
  QueueStatus,
  WalletCooldown,
} from '@warpath/shared';
import { db } from '../db/client';
import { battles, players, queue } from '../db/schema';
import { AppError } from '../lib/errors';
import { createBattleCommitmentForMatch, ensureBattleResolved } from './battle';
import {
  ensurePlayer,
  getWalletCooldownState,
  syncPlayerGunCount,
} from './players';
import { timeOfRound } from './drand';
import { countActiveQueueEntries, notifyQueueActivated } from './notifications';

const QUEUE_TTL_MS = 10 * 60 * 1000;

function serializeCooldown(cooldown: {
  expiresAt: Date | null;
  remainingMs: number;
  gunCount: number;
}): WalletCooldown {
  return {
    expiresAt: cooldown.expiresAt?.toISOString() ?? null,
    remainingMs: cooldown.remainingMs,
    gunCount: cooldown.gunCount,
  };
}

async function getSerializedCooldown(address: string): Promise<WalletCooldown> {
  return serializeCooldown(await getWalletCooldownState(address));
}

export async function joinQueue(
  _address: string,
  _tokenId: number,
  _country: string
): Promise<QueueJoinResponse> {
  throw new AppError(
    410,
    'SEASON_ONE_ENDED',
    'Season 1 matchmaking has ended. Queue for Season 2 at /api/s2/battles/queue'
  );
}

async function tryMatch(queueId: string, address: string): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .update(queue)
      .set({
        status: 'expired',
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(queue.status, 'waiting'),
          isNull(queue.battleId),
          lt(queue.expiresAt, new Date())
        )
      );

    const [currentEntry] = await tx
      .select()
      .from(queue)
      .where(eq(queue.id, queueId))
      .for('update')
      .limit(1);

    if (
      !currentEntry ||
      currentEntry.status !== 'waiting' ||
      currentEntry.battleId !== null ||
      currentEntry.expiresAt.getTime() <= Date.now()
    ) {
      return;
    }

    const [opponent] = await tx
      .select()
      .from(queue)
      .where(
        and(
          eq(queue.status, 'waiting'),
          isNull(queue.battleId),
          ne(queue.id, queueId),
          ne(queue.address, address),
          sql`${queue.expiresAt} > now()`
        )
      )
      .orderBy(queue.createdAt)
      .for('update', { skipLocked: true })
      .limit(1);

    if (!opponent) {
      return;
    }

    const [leftPlayer, rightPlayer] = await Promise.all([
      tx
        .select({ gunCount: players.gunCount })
        .from(players)
        .where(eq(players.address, currentEntry.address))
        .limit(1),
      tx
        .select({ gunCount: players.gunCount })
        .from(players)
        .where(eq(players.address, opponent.address))
        .limit(1),
    ]);

    const battleCommitment = createBattleCommitmentForMatch(
      {
        address: currentEntry.address,
        tokenId: currentEntry.tokenId,
        gunCount: leftPlayer[0]?.gunCount ?? 0,
      },
      {
        address: opponent.address,
        tokenId: opponent.tokenId,
        gunCount: rightPlayer[0]?.gunCount ?? 0,
      }
    );

    const [battle] = await tx
      .insert(battles)
      .values({
        leftQueueId: currentEntry.id,
        rightQueueId: opponent.id,
        leftAddress: currentEntry.address,
        leftToken: currentEntry.tokenId,
        rightAddress: opponent.address,
        rightToken: opponent.tokenId,
        status: 'committed',
        commitHash: battleCommitment.commitHash,
        commitPreimageJson:
          battleCommitment.preimage as unknown as Record<string, unknown>,
        drandRound: battleCommitment.targetRound,
        engineVersion: battleCommitment.preimage.engineVersion,
        committedAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({ id: battles.id });

    if (!battle) {
      throw new Error('Failed to store battle');
    }

    const [currentUpdated] = await tx
      .update(queue)
      .set({
        status: 'matched',
        battleId: battle.id,
        matchedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(queue.id, currentEntry.id),
          eq(queue.status, 'waiting'),
          isNull(queue.battleId)
        )
      )
      .returning({ id: queue.id });

    const [opponentUpdated] = await tx
      .update(queue)
      .set({
        status: 'matched',
        battleId: battle.id,
        matchedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(queue.id, opponent.id),
          eq(queue.status, 'waiting'),
          isNull(queue.battleId)
        )
      )
      .returning({ id: queue.id });

    if (!currentUpdated || !opponentUpdated) {
      throw new Error('Queue resolution race detected');
    }
  });
}

export async function getQueueStatus(
  queueId: string,
  statusToken: string
): Promise<QueueStatus> {
  await expireStaleQueueEntries();

  const [entry] = await db
    .select()
    .from(queue)
    .where(eq(queue.id, queueId))
    .limit(1);

  if (!entry) {
    throw new Error('Queue entry not found');
  }

  if (!statusToken || entry.statusToken !== statusToken) {
    throw new AppError(
      401,
      'QUEUE_STATUS_TOKEN_INVALID',
      'Queue status token is invalid'
    );
  }

  if (entry.status === 'waiting') {
    await tryMatch(queueId, entry.address);
  }

  const [refreshed] = await db
    .select()
    .from(queue)
    .where(eq(queue.id, queueId))
    .limit(1);

  if (!refreshed) {
    throw new Error('Queue entry not found');
  }

  const cooldown = await getSerializedCooldown(refreshed.address);

  if (refreshed.status === 'cancelled') {
    return {
      status: 'cancelled',
      queueId: refreshed.id,
      cancelledAt:
        refreshed.cancelledAt?.toISOString() ??
        refreshed.updatedAt?.toISOString() ??
        new Date().toISOString(),
      cooldown,
    };
  }

  if (refreshed.status === 'expired') {
    return {
      status: 'expired',
      queueId: refreshed.id,
      expiredAt: refreshed.updatedAt?.toISOString() ?? refreshed.expiresAt.toISOString(),
      cooldown,
    };
  }

  if (refreshed.status === 'waiting') {
    return {
      status: 'waiting',
      queueId: refreshed.id,
      expiresAt: refreshed.expiresAt.toISOString(),
      cooldown,
    };
  }

  await ensureBattleResolved(refreshed.battleId!);

  const [battle] = await db
    .select({
      id: battles.id,
      status: battles.status,
      commitHash: battles.commitHash,
      drandRound: battles.drandRound,
    })
    .from(battles)
    .where(eq(battles.id, refreshed.battleId!))
    .limit(1);

  const [opponentEntry] = await db
    .select()
    .from(queue)
    .where(and(eq(queue.battleId, refreshed.battleId!), ne(queue.id, queueId)))
    .limit(1);

  return {
    status: 'matched',
    queueId: refreshed.id,
    battleId: refreshed.battleId!,
    battleStatus: (battle?.status ?? 'committed') as BattleStatus,
    commitHash: (battle?.commitHash ?? null) as `0x${string}` | null,
    targetRound: battle?.drandRound ?? null,
    estimatedResolveTime:
      battle?.drandRound != null
        ? new Date(timeOfRound(battle.drandRound) * 1000).toISOString()
        : null,
    cooldown,
    opponent: {
      address: opponentEntry?.address ?? '',
      tokenId: opponentEntry?.tokenId ?? 0,
      country: opponentEntry?.country ?? '',
    },
  };
}

export async function cancelQueue(
  queueId: string,
  address: string
): Promise<QueueCancelResponse> {
  await expireStaleQueueEntries();

  const [entry] = await db
    .select()
    .from(queue)
    .where(eq(queue.id, queueId))
    .limit(1);

  if (!entry) {
    throw new AppError(404, 'QUEUE_NOT_FOUND', 'Queue entry not found');
  }

  if (entry.address.toLowerCase() !== address.toLowerCase()) {
    throw new AppError(403, 'QUEUE_ADDRESS_MISMATCH', 'Queue entry does not belong to caller');
  }

  if (entry.status !== 'waiting' || entry.battleId !== null || entry.expiresAt.getTime() <= Date.now()) {
    throw new AppError(
      409,
      'QUEUE_NOT_CANCELLABLE',
      'Queue entry is no longer cancellable'
    );
  }

  const [cancelled] = await db
    .update(queue)
    .set({
      status: 'cancelled',
      cancelledAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(queue.id, queueId),
        eq(queue.address, address),
        eq(queue.status, 'waiting'),
        isNull(queue.battleId),
        sql`${queue.expiresAt} > now()`
      )
    )
    .returning({
      id: queue.id,
      cancelledAt: queue.cancelledAt,
    });

  if (!cancelled) {
    throw new AppError(
      409,
      'QUEUE_NOT_CANCELLABLE',
      'Queue entry is no longer cancellable'
    );
  }

  return {
    queueId: cancelled.id,
    status: 'cancelled',
    cancelledAt: cancelled.cancelledAt?.toISOString() ?? new Date().toISOString(),
    cooldown: await getSerializedCooldown(address),
  };
}

export async function expireStaleQueueEntries(): Promise<void> {
  await db
    .update(queue)
    .set({
      status: 'expired',
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(queue.status, 'waiting'),
        isNull(queue.battleId),
        lt(queue.expiresAt, new Date())
      )
    );
}

export const __testing = {
  tryMatch,
};
