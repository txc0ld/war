import { Hono } from 'hono';
import { z } from 'zod';
import { isAddress } from 'viem';
import { getLeaderboard } from '../services/leaderboard';
import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { players } from '../db/schema';
import { validateParams, validateQuery } from '../middleware/validate';

const app = new Hono();
const leaderboardQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
const playerParamsSchema = z.object({
  address: z.string().refine((value) => isAddress(value), 'must be a valid address'),
});

// GET /api/leaderboard
app.get('/', async (c) => {
  const { limit, offset } = validateQuery(c, leaderboardQuerySchema);
  const result = await getLeaderboard(limit, offset);
  return c.json(result);
});

// GET /api/leaderboard/:address
app.get('/:address', async (c) => {
  const { address } = validateParams(c, playerParamsSchema);
  const [player] = await db
    .select()
    .from(players)
    .where(eq(players.address, address))
    .limit(1);

  if (!player) {
    return c.json({
      address,
      score: 0,
      wins: 0,
      losses: 0,
      gunCount: 0,
    });
  }

  return c.json({
    address: player.address,
    score: player.score,
    wins: player.wins,
    losses: player.losses,
    gunCount: player.gunCount,
  });
});

export default app;
