// apps/api/src/services/s2Leaderboard.ts
import { desc, gt, or, sql } from 'drizzle-orm';
import { db } from '../db/client';
import { s2Players } from '../db/schema';
import { getProfilesByAddress } from './profiles';
import type { S2LeaderboardEntry } from '@warpath/shared';

interface S2LeaderboardResponse {
  entries: S2LeaderboardEntry[];
  total: number;
}

export async function getS2Leaderboard(
  limit = 50,
  offset = 0
): Promise<S2LeaderboardResponse> {
  const hasCombatRecord = or(gt(s2Players.wins, 0), gt(s2Players.losses, 0));

  const rows = await db
    .select()
    .from(s2Players)
    .where(hasCombatRecord)
    .orderBy(desc(s2Players.score))
    .limit(limit)
    .offset(offset);

  const profilesByAddress = await getProfilesByAddress(
    rows.map((row) => row.address)
  );

  const entries: S2LeaderboardEntry[] = rows.map((row, i) => {
    const profile = profilesByAddress.get(row.address);
    const totalKills = row.totalKills;
    const headshotPct =
      totalKills > 0
        ? Number(((row.headshotKills / totalKills) * 100).toFixed(1))
        : 0;

    return {
      rank: offset + i + 1,
      address: row.address,
      score: row.score,
      elo: row.elo,
      wins: row.wins,
      losses: row.losses,
      headshotKills: row.headshotKills,
      totalKills: row.totalKills,
      sniperCount: row.sniperCount,
      headshotPct,
      winStreak: row.winStreak,
      displayName: profile?.displayName ?? null,
      ensName: profile?.ensName ?? null,
    };
  });

  const totals = await db
    .select({ count: sql<number>`count(*)` })
    .from(s2Players)
    .where(hasCombatRecord);
  const total = Number(totals[0]?.count ?? 0);

  return { entries, total };
}
