import { desc } from 'drizzle-orm';
import type { KillfeedEntry } from '@warpath/shared';
import { getAddress } from 'viem';
import { db } from '../db/client';
import { battles } from '../db/schema';
import { getGunMetadataByTokenId } from './guns';
import {
  getBattleResultsVisibilityByAddress,
  getProfilesByAddress,
} from './profiles';

export async function getKillfeed(limit = 25): Promise<KillfeedEntry[]> {
  const rows = await db
    .select()
    .from(battles)
    .orderBy(desc(battles.resolvedAt))
    .limit(limit);
  const visibility = await getBattleResultsVisibilityByAddress(
    rows.flatMap((row) => [row.leftAddress, row.rightAddress])
  );
  const publicRows = rows.filter(
    (row) =>
      (visibility.get(getAddress(row.leftAddress)) ?? true) &&
      (visibility.get(getAddress(row.rightAddress)) ?? true)
  );

  const profileMap = await getProfilesByAddress(
    publicRows.flatMap((row) => [row.leftAddress, row.rightAddress])
  );

  return Promise.all(
    publicRows.map(async (row) => {
      const winnerIsLeft = row.winner === 'left';
      const winnerAddress = getAddress(winnerIsLeft ? row.leftAddress : row.rightAddress);
      const loserAddress = getAddress(winnerIsLeft ? row.rightAddress : row.leftAddress);
      const winnerTokenId = winnerIsLeft ? row.leftToken : row.rightToken;
      const loserTokenId = winnerIsLeft ? row.rightToken : row.leftToken;
      const [winnerGun, loserGun] = await Promise.all([
        getGunMetadataByTokenId(winnerTokenId),
        getGunMetadataByTokenId(loserTokenId),
      ]);

      return {
        battleId: row.id,
        winnerAddress,
        loserAddress,
        winnerTokenId,
        loserTokenId,
        winnerGunName: winnerGun.name,
        loserGunName: loserGun.name,
        winnerImageUrl: winnerGun.image,
        loserImageUrl: loserGun.image,
        winnerProfile: {
          displayName: profileMap.get(winnerAddress)?.displayName ?? null,
          ensName: profileMap.get(winnerAddress)?.ensName ?? null,
          avatarUrl: profileMap.get(winnerAddress)?.avatarUrl ?? null,
          showBattleResults:
            profileMap.get(winnerAddress)?.showBattleResults ?? true,
        },
        loserProfile: {
          displayName: profileMap.get(loserAddress)?.displayName ?? null,
          ensName: profileMap.get(loserAddress)?.ensName ?? null,
          avatarUrl: profileMap.get(loserAddress)?.avatarUrl ?? null,
          showBattleResults: profileMap.get(loserAddress)?.showBattleResults ?? true,
        },
        resolvedAt: row.resolvedAt?.toISOString() ?? new Date().toISOString(),
      } satisfies KillfeedEntry;
    })
  );
}
