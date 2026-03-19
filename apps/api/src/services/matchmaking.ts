import { eq, and, ne, isNull, sql } from 'drizzle-orm';
import { POINTS } from '@warpath/shared';
import { db } from '../db/client';
import { battles, queue, players } from '../db/schema';
import { resolveBattleForMatch } from './battle';

interface QueueResult {
  queueId: string;
  status: 'queued';
}

interface QueueStatusWaiting {
  status: 'waiting';
}

interface QueueStatusMatched {
  status: 'matched';
  battleId: string;
  opponent: {
    address: string;
    tokenId: number;
    country: string;
  };
}

type QueueStatus = QueueStatusWaiting | QueueStatusMatched;

export async function joinQueue(
  address: string,
  tokenId: number,
  country: string
): Promise<QueueResult> {
  // Ensure player exists
  await db
    .insert(players)
    .values({ address })
    .onConflictDoNothing();

  // Insert into queue
  const [entry] = await db
    .insert(queue)
    .values({ address, tokenId, country, status: 'waiting' })
    .returning({ id: queue.id });

  if (!entry) {
    throw new Error('Failed to create queue entry');
  }

  // Try to find a match immediately
  await tryMatch(entry.id, address);

  return { queueId: entry.id, status: 'queued' };
}

async function tryMatch(queueId: string, address: string): Promise<void> {
  await db.transaction(async (tx) => {
    const [currentEntry] = await tx
      .select()
      .from(queue)
      .where(eq(queue.id, queueId))
      .for('update')
      .limit(1);

    if (
      !currentEntry ||
      currentEntry.status !== 'waiting' ||
      currentEntry.battleId !== null
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
          ne(queue.address, address)
        )
      )
      .orderBy(queue.createdAt)
      .for('update', { skipLocked: true })
      .limit(1);

    if (!opponent) {
      return;
    }

    const battleResolution = resolveBattleForMatch(
      {
        address: currentEntry.address,
        tokenId: currentEntry.tokenId,
      },
      {
        address: opponent.address,
        tokenId: opponent.tokenId,
      }
    );

    const winnerAddress =
      battleResolution.result.winner === 'left'
        ? currentEntry.address
        : opponent.address;
    const loserAddress =
      battleResolution.result.winner === 'left'
        ? opponent.address
        : currentEntry.address;

    const [winnerPlayer] = await tx
      .select()
      .from(players)
      .where(eq(players.address, winnerAddress))
      .limit(1);

    const multiplier =
      winnerPlayer && winnerPlayer.gunCount >= 3
        ? POINTS.THREE_GUN_MULTIPLIER
        : 1;

    const winPoints = Math.round(POINTS.WIN * multiplier);

    const [battle] = await tx
      .insert(battles)
      .values({
        leftQueueId: currentEntry.id,
        rightQueueId: opponent.id,
        leftAddress: currentEntry.address,
        leftToken: currentEntry.tokenId,
        rightAddress: opponent.address,
        rightToken: opponent.tokenId,
        winner: battleResolution.result.winner,
        leftHp: battleResolution.result.leftHpRemaining,
        rightHp: battleResolution.result.rightHpRemaining,
        roundsJson:
          battleResolution.result.rounds as unknown as Record<string, unknown>,
      })
      .returning({ id: battles.id });

    if (!battle) {
      throw new Error('Failed to store battle');
    }

    const [currentUpdated] = await tx
      .update(queue)
      .set({ status: 'matched', battleId: battle.id })
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
      .set({ status: 'matched', battleId: battle.id })
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

    await tx
      .update(players)
      .set({
        score: sql`${players.score} + ${winPoints}`,
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
  });
}

export async function getQueueStatus(
  queueId: string,
  callerAddress: string
): Promise<QueueStatus> {
  const [entry] = await db
    .select()
    .from(queue)
    .where(eq(queue.id, queueId))
    .limit(1);

  if (!entry) {
    throw new Error('Queue entry not found');
  }

  if (entry.status === 'waiting') {
    // Try matching again on poll
    await tryMatch(queueId, entry.address);

    // Re-fetch after match attempt
    const [refreshed] = await db
      .select()
      .from(queue)
      .where(eq(queue.id, queueId))
      .limit(1);

    if (!refreshed || refreshed.status === 'waiting') {
      return { status: 'waiting' };
    }

    // Find opponent from same battle
    const [opponentEntry] = await db
      .select()
      .from(queue)
      .where(
        and(
          eq(queue.battleId, refreshed.battleId!),
          ne(queue.id, queueId)
        )
      )
      .limit(1);

    return {
      status: 'matched',
      battleId: refreshed.battleId!,
      opponent: {
        address: opponentEntry?.address ?? '',
        tokenId: opponentEntry?.tokenId ?? 0,
        country: opponentEntry?.country ?? '',
      },
    };
  }

  // Already matched
  const [opponentEntry] = await db
    .select()
    .from(queue)
    .where(
      and(
        eq(queue.battleId, entry.battleId!),
        ne(queue.id, queueId)
      )
    )
    .limit(1);

  return {
    status: 'matched',
    battleId: entry.battleId!,
    opponent: {
      address: opponentEntry?.address ?? '',
      tokenId: opponentEntry?.tokenId ?? 0,
      country: opponentEntry?.country ?? '',
    },
  };
}

export const __testing = {
  tryMatch,
};
