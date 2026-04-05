// apps/api/src/routes/s2Leaderboard.ts
import { Hono } from 'hono';
import { z } from 'zod';
import { isAddress } from 'viem';
import { getS2Leaderboard } from '../services/s2Leaderboard';
import { getS2Player } from '../services/s2Players';
import { getProfile } from '../services/profiles';
import { validateParams, validateQuery } from '../middleware/validate';

const app = new Hono();

const leaderboardQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

const playerParamsSchema = z.object({
  address: z.string().refine((value) => isAddress(value), 'must be a valid address'),
});

// GET /api/s2/leaderboard — paginated Season 2 leaderboard
app.get('/', async (c) => {
  const { limit, offset } = validateQuery(c, leaderboardQuerySchema);
  return c.json(await getS2Leaderboard(limit, offset));
});

// GET /api/s2/leaderboard/:address — single player Season 2 stats
app.get('/:address', async (c) => {
  const { address } = validateParams(c, playerParamsSchema);
  const player = await getS2Player(address);

  if (!player) {
    return c.json({
      address,
      score: 0,
      elo: 1000,
      wins: 0,
      losses: 0,
      headshotKills: 0,
      totalKills: 0,
      sniperCount: 0,
      headshotPct: 0,
      winStreak: 0,
      displayName: null,
      ensName: null,
    });
  }

  const profile = await getProfile(player.address);
  const headshotPct =
    player.totalKills > 0
      ? Number(((player.headshotKills / player.totalKills) * 100).toFixed(1))
      : 0;

  return c.json({
    address: player.address,
    score: player.score,
    elo: player.elo,
    wins: player.wins,
    losses: player.losses,
    headshotKills: player.headshotKills,
    totalKills: player.totalKills,
    sniperCount: player.sniperCount,
    headshotPct,
    winStreak: player.winStreak,
    displayName: profile.displayName,
    ensName: profile.ensName,
  });
});

export default app;
