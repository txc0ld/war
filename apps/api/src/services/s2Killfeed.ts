// apps/api/src/services/s2Killfeed.ts
import { desc, eq } from 'drizzle-orm';
import { getAddress } from 'viem';
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

  const uniqueTokenIds = Array.from(
    new Set([
      ...rows.map((r) => r.leftToken),
      ...rows.map((r) => r.rightToken),
    ])
  );
  const sniperMetaEntries = await Promise.all(
    uniqueTokenIds.map(async (id) => [id, await getSniperMetadata(id)] as const)
  );
  const sniperMetaMap = new Map(sniperMetaEntries);

  return rows
    .filter((row) => row.winner !== null)
    .map((row) => {
        const winnerIsLeft = row.winner === 'left';
        const winnerAddress = getAddress(winnerIsLeft ? row.leftAddress : row.rightAddress);
        const loserAddress = getAddress(winnerIsLeft ? row.rightAddress : row.leftAddress);
        const winnerTokenId = winnerIsLeft ? row.leftToken : row.rightToken;
        const loserTokenId = winnerIsLeft ? row.rightToken : row.leftToken;

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const winnerSniper = sniperMetaMap.get(winnerTokenId)!;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const loserSniper = sniperMetaMap.get(loserTokenId)!;

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
      });
}
