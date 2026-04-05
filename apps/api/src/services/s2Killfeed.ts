// apps/api/src/services/s2Killfeed.ts
import { desc, eq } from 'drizzle-orm';
import type { S2KillfeedEntry, S2RoundResult } from '@warpath/shared';
import { db } from '../db/client';
import { s2Battles } from '../db/schema';
import { getSniperMetadata } from './s2Snipers';
import { getProfilesByAddress } from './profiles';

export async function getS2Killfeed(
  limit = 25
): Promise<S2KillfeedEntry[]> {
  const rows = await db
    .select()
    .from(s2Battles)
    .where(eq(s2Battles.status, 'resolved'))
    .orderBy(desc(s2Battles.resolvedAt))
    .limit(limit);

  const profileMap = await getProfilesByAddress(
    rows.flatMap((row) => [row.leftAddress, row.rightAddress])
  );

  return Promise.all(
    rows
      .filter((row) => row.winner !== null)
      .map(async (row) => {
        const winnerIsLeft = row.winner === 'left';
        const winnerAddress = winnerIsLeft
          ? row.leftAddress
          : row.rightAddress;
        const loserAddress = winnerIsLeft
          ? row.rightAddress
          : row.leftAddress;
        const winnerTokenId = winnerIsLeft
          ? row.leftToken
          : row.rightToken;
        const loserTokenId = winnerIsLeft
          ? row.rightToken
          : row.leftToken;

        const [winnerSniper, loserSniper] = await Promise.all([
          getSniperMetadata(winnerTokenId),
          getSniperMetadata(loserTokenId),
        ]);

        const rounds = (row.roundsJson ?? []) as S2RoundResult[];
        const lastRound = rounds.at(-1);
        const headshot = lastRound?.killerHeadshot ?? false;

        const winnerProfile = profileMap.get(winnerAddress);
        const loserProfile = profileMap.get(loserAddress);

        return {
          battleId: row.id,
          winnerAddress,
          loserAddress,
          winnerTokenId,
          loserTokenId,
          winnerSniperName: winnerSniper.name,
          loserSniperName: loserSniper.name,
          winnerImageUrl: winnerSniper.image,
          loserImageUrl: loserSniper.image,
          headshot,
          winnerProfile: {
            displayName: winnerProfile?.displayName ?? null,
            ensName: winnerProfile?.ensName ?? null,
            avatarUrl: winnerProfile?.avatarUrl ?? null,
          },
          loserProfile: {
            displayName: loserProfile?.displayName ?? null,
            ensName: loserProfile?.ensName ?? null,
            avatarUrl: loserProfile?.avatarUrl ?? null,
          },
          resolvedAt:
            row.resolvedAt?.toISOString() ?? new Date().toISOString(),
        } satisfies S2KillfeedEntry;
      })
  );
}
