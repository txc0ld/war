import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { s2Players } from '../db/schema';
import { getOwnedSniperTokenIds } from './s2Snipers';

export async function ensureS2Player(address: string): Promise<void> {
  await db.insert(s2Players).values({ address }).onConflictDoNothing();
}

export async function syncS2PlayerSniperCount(
  address: `0x${string}`
): Promise<number> {
  const tokenIds = await getOwnedSniperTokenIds(address);
  const sniperCount = tokenIds.length;

  await ensureS2Player(address);
  await db
    .update(s2Players)
    .set({ sniperCount, updatedAt: new Date() })
    .where(eq(s2Players.address, address));

  return sniperCount;
}

export async function getS2Player(
  address: string
): Promise<typeof s2Players.$inferSelect | null> {
  const [player] = await db
    .select()
    .from(s2Players)
    .where(eq(s2Players.address, address))
    .limit(1);

  return player ?? null;
}
