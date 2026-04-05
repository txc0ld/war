import { randomUUID } from 'node:crypto';
import { and, eq, isNull, lt, ne, sql } from 'drizzle-orm';
import type {
  S2QueueCancelResponse,
  S2QueueJoinResponse,
  S2QueueStatus,
  S2BattleStatus,
} from '@warpath/shared';
import { S2_QUEUE_TTL_MS } from '@warpath/shared';
import { db } from '../db/client';
import { s2Battles, s2Players, s2Queue } from '../db/schema';
import { AppError } from '../lib/errors';
import { ensureS2Player, syncS2PlayerSniperCount } from './s2Players';

const GAME_SERVER_URL = process.env['S2_GAME_SERVER_URL'] ?? null;

export async function joinS2Queue(
  address: string,
  tokenId: number
): Promise<S2QueueJoinResponse> {
  await ensureS2Player(address);
  await syncS2PlayerSniperCount(address as `0x${string}`);
  await expireStaleS2QueueEntries();

  const [activeEntry] = await db
    .select({ id: s2Queue.id })
    .from(s2Queue)
    .where(
      and(
        eq(s2Queue.address, address),
        eq(s2Queue.status, 'waiting'),
        isNull(s2Queue.battleId),
        sql`${s2Queue.expiresAt} > now()`
      )
    )
    .limit(1);

  if (activeEntry) {
    throw new AppError(
      409,
      'S2_QUEUE_ALREADY_ACTIVE',
      'Wallet already has an active Season 2 queue entry'
    );
  }

  const now = new Date();
  const statusToken = randomUUID();
  const [entry] = await db
    .insert(s2Queue)
    .values({
      address,
      tokenId,
      statusToken,
      status: 'waiting',
      expiresAt: new Date(now.getTime() + S2_QUEUE_TTL_MS),
      updatedAt: now,
    })
    .returning({ id: s2Queue.id, statusToken: s2Queue.statusToken });

  if (!entry) {
    throw new Error('Failed to create Season 2 queue entry');
  }

  await tryS2Match(entry.id, address);

  return {
    queueId: entry.id,
    status: 'queued',
    statusToken: entry.statusToken,
  };
}

async function tryS2Match(queueId: string, address: string): Promise<void> {
  await db.transaction(async (tx) => {
    const [currentEntry] = await tx
      .select()
      .from(s2Queue)
      .where(eq(s2Queue.id, queueId))
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
      .from(s2Queue)
      .where(
        and(
          eq(s2Queue.status, 'waiting'),
          isNull(s2Queue.battleId),
          ne(s2Queue.id, queueId),
          ne(s2Queue.address, address),
          sql`${s2Queue.expiresAt} > now()`
        )
      )
      .orderBy(s2Queue.createdAt)
      .for('update', { skipLocked: true })
      .limit(1);

    if (!opponent) {
      return;
    }

    const roomId = randomUUID();
    const roomTokenLeft = randomUUID();
    const roomTokenRight = randomUUID();

    const [battle] = await tx
      .insert(s2Battles)
      .values({
        leftAddress: currentEntry.address,
        leftToken: currentEntry.tokenId,
        rightAddress: opponent.address,
        rightToken: opponent.tokenId,
        status: 'pending',
        roomId,
        roomTokenLeft,
        roomTokenRight,
        updatedAt: new Date(),
      })
      .returning({ id: s2Battles.id });

    if (!battle) {
      throw new Error('Failed to create Season 2 battle');
    }

    const [currentUpdated] = await tx
      .update(s2Queue)
      .set({
        status: 'matched',
        battleId: battle.id,
        matchedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(s2Queue.id, currentEntry.id),
          eq(s2Queue.status, 'waiting'),
          isNull(s2Queue.battleId)
        )
      )
      .returning({ id: s2Queue.id });

    const [opponentUpdated] = await tx
      .update(s2Queue)
      .set({
        status: 'matched',
        battleId: battle.id,
        matchedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(s2Queue.id, opponent.id),
          eq(s2Queue.status, 'waiting'),
          isNull(s2Queue.battleId)
        )
      )
      .returning({ id: s2Queue.id });

    if (!currentUpdated || !opponentUpdated) {
      throw new Error('Season 2 queue resolution race detected');
    }
  });
}

export async function getS2QueueStatus(
  queueId: string,
  statusToken: string
): Promise<S2QueueStatus> {
  await expireStaleS2QueueEntries();

  const [entry] = await db
    .select()
    .from(s2Queue)
    .where(eq(s2Queue.id, queueId))
    .limit(1);

  if (!entry) {
    throw new AppError(404, 'S2_QUEUE_NOT_FOUND', 'Queue entry not found');
  }

  if (entry.statusToken !== statusToken) {
    throw new AppError(
      401,
      'S2_QUEUE_STATUS_TOKEN_INVALID',
      'Queue status token is invalid'
    );
  }

  if (entry.status === 'waiting') {
    await tryS2Match(queueId, entry.address);
  }

  const [refreshed] = await db
    .select()
    .from(s2Queue)
    .where(eq(s2Queue.id, queueId))
    .limit(1);

  if (!refreshed) {
    throw new AppError(404, 'S2_QUEUE_NOT_FOUND', 'Queue entry not found');
  }

  if (refreshed.status === 'cancelled') {
    return {
      status: 'cancelled',
      queueId: refreshed.id,
      cancelledAt:
        refreshed.cancelledAt?.toISOString() ?? new Date().toISOString(),
    };
  }

  if (refreshed.status === 'expired') {
    return {
      status: 'expired',
      queueId: refreshed.id,
      expiredAt:
        refreshed.updatedAt?.toISOString() ??
        refreshed.expiresAt.toISOString(),
    };
  }

  if (refreshed.status === 'waiting') {
    return {
      status: 'waiting',
      queueId: refreshed.id,
      expiresAt: refreshed.expiresAt.toISOString(),
    };
  }

  // Status is 'matched'
  const [battle] = await db
    .select()
    .from(s2Battles)
    .where(eq(s2Battles.id, refreshed.battleId!))
    .limit(1);

  const [opponentEntry] = await db
    .select()
    .from(s2Queue)
    .where(
      and(
        eq(s2Queue.battleId, refreshed.battleId!),
        ne(s2Queue.id, queueId)
      )
    )
    .limit(1);

  const isLeft = battle?.leftAddress === refreshed.address;
  const roomToken = isLeft
    ? battle?.roomTokenLeft
    : battle?.roomTokenRight;

  return {
    status: 'matched',
    queueId: refreshed.id,
    battleId: refreshed.battleId!,
    battleStatus: (battle?.status ?? 'pending') as S2BattleStatus,
    roomId: battle?.roomId ?? null,
    gameServerUrl: GAME_SERVER_URL,
    roomToken: roomToken ?? null,
    opponent: {
      address: opponentEntry?.address ?? '',
      tokenId: opponentEntry?.tokenId ?? 0,
    },
  };
}

export async function cancelS2Queue(
  queueId: string,
  address: string
): Promise<S2QueueCancelResponse> {
  await expireStaleS2QueueEntries();

  const [entry] = await db
    .select()
    .from(s2Queue)
    .where(eq(s2Queue.id, queueId))
    .limit(1);

  if (!entry) {
    throw new AppError(404, 'S2_QUEUE_NOT_FOUND', 'Queue entry not found');
  }

  if (entry.address.toLowerCase() !== address.toLowerCase()) {
    throw new AppError(
      403,
      'S2_QUEUE_ADDRESS_MISMATCH',
      'Queue entry does not belong to caller'
    );
  }

  if (
    entry.status !== 'waiting' ||
    entry.battleId !== null ||
    entry.expiresAt.getTime() <= Date.now()
  ) {
    throw new AppError(
      409,
      'S2_QUEUE_NOT_CANCELLABLE',
      'Queue entry is no longer cancellable'
    );
  }

  const [cancelled] = await db
    .update(s2Queue)
    .set({
      status: 'cancelled',
      cancelledAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(s2Queue.id, queueId),
        eq(s2Queue.status, 'waiting'),
        isNull(s2Queue.battleId),
        sql`${s2Queue.expiresAt} > now()`
      )
    )
    .returning({ id: s2Queue.id, cancelledAt: s2Queue.cancelledAt });

  if (!cancelled) {
    throw new AppError(
      409,
      'S2_QUEUE_NOT_CANCELLABLE',
      'Queue entry is no longer cancellable'
    );
  }

  return {
    queueId: cancelled.id,
    status: 'cancelled',
    cancelledAt:
      cancelled.cancelledAt?.toISOString() ?? new Date().toISOString(),
  };
}

async function expireStaleS2QueueEntries(): Promise<void> {
  await db
    .update(s2Queue)
    .set({ status: 'expired', updatedAt: new Date() })
    .where(
      and(
        eq(s2Queue.status, 'waiting'),
        isNull(s2Queue.battleId),
        lt(s2Queue.expiresAt, new Date())
      )
    );
}
