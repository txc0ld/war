import { beforeEach, describe, expect, it, vi } from 'vitest';

const leaderboardStore = {
  rows: [] as Array<{
    address: string;
    score: number;
    wins: number;
    losses: number;
    gunCount: number;
  }>,
};

vi.mock('drizzle-orm', () => ({
  desc: () => ({ kind: 'desc' }),
  gt: (column: string, value: number) => ({ kind: 'gt', column, value }),
  or: (...clauses: unknown[]) => ({ kind: 'or', clauses }),
  sql: () => ({ kind: 'sql' }),
}));

vi.mock('../db/schema', () => ({
  players: {
    score: 'score',
    wins: 'wins',
    losses: 'losses',
  },
}));

vi.mock('../db/client', () => ({
  db: {
    select: (shape?: { count: unknown }) => ({
      from: () => ({
        where: () => {
          const filtered = leaderboardStore.rows.filter(
            (row) => row.wins > 0 || row.losses > 0
          );

          if (shape?.count) {
            return Promise.resolve([{ count: filtered.length }]);
          }

          return {
            orderBy: () => ({
              limit: (limit: number) => ({
                offset: async (offset: number) =>
                  filtered
                    .slice()
                    .sort((left, right) => right.score - left.score)
                    .slice(offset, offset + limit),
              }),
            }),
          };
        },
      }),
    }),
  },
}));

describe('leaderboard service', () => {
  beforeEach(() => {
    leaderboardStore.rows = [];
  });

  it('only returns players who have completed at least one battle', async () => {
    leaderboardStore.rows = [
      {
        address: '0x111',
        score: 100,
        wins: 1,
        losses: 0,
        gunCount: 2,
      },
      {
        address: '0x222',
        score: 50,
        wins: 0,
        losses: 0,
        gunCount: 3,
      },
      {
        address: '0x333',
        score: -100,
        wins: 0,
        losses: 1,
        gunCount: 1,
      },
    ];

    const { getLeaderboard } = await import('../services/leaderboard');
    const result = await getLeaderboard(50, 0);

    expect(result.total).toBe(2);
    expect(result.entries).toEqual([
      {
        rank: 1,
        address: '0x111',
        score: 100,
        wins: 1,
        losses: 0,
        gunCount: 2,
      },
      {
        rank: 2,
        address: '0x333',
        score: -100,
        wins: 0,
        losses: 1,
        gunCount: 1,
      },
    ]);
  });
});
