import { desc, gt, or, sql } from 'drizzle-orm';
import { db } from '../db/client';
import { players } from '../db/schema';

interface LeaderboardEntry {
  rank: number;
  address: string;
  score: number;
  wins: number;
  losses: number;
  gunCount: number;
}

interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  total: number;
}

export async function getLeaderboard(
  limit = 50,
  offset = 0
): Promise<LeaderboardResponse> {
  const hasCombatRecord = or(gt(players.wins, 0), gt(players.losses, 0));
  const rows = await db
    .select()
    .from(players)
    .where(hasCombatRecord)
    .orderBy(desc(players.score))
    .limit(limit)
    .offset(offset);

  const entries: LeaderboardEntry[] = rows.map((row, i) => ({
    rank: offset + i + 1,
    address: row.address,
    score: row.score,
    wins: row.wins,
    losses: row.losses,
    gunCount: row.gunCount,
  }));

  const totals = await db
    .select({ count: sql<number>`count(*)` })
    .from(players)
    .where(hasCombatRecord);
  const total = Number(totals[0]?.count ?? 0);

  return { entries, total };
}
