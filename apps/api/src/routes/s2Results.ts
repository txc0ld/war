// apps/api/src/routes/s2Results.ts
import { Hono } from 'hono';
import { z } from 'zod';
import { S2_GAME_SERVER_SECRET_HEADER } from '@warpath/shared';
import { AppError } from '../lib/errors';
import { validateJson } from '../middleware/validate';
import { applyS2MatchResult } from '../services/s2Scoring';

const app = new Hono();

const SERVER_SECRET = process.env['S2_GAME_SERVER_SECRET'] ?? '';

const roundResultSchema = z.object({
  round: z.number().int().min(1),
  winner: z.union([z.literal(0), z.literal(1), z.null()]),
  killerHeadshot: z.boolean(),
  player0Hp: z.number().int().min(0),
  player1Hp: z.number().int().min(0),
  durationMs: z.number().int().min(0),
});

const matchResultSchema = z.object({
  battleId: z.string().uuid(),
  secret: z.string().min(1).optional(),
  result: z.object({
    winner: z.union([z.literal(0), z.literal(1)]),
    rounds: z.array(roundResultSchema).min(1).max(5),
    leftScore: z.number().int().min(0),
    rightScore: z.number().int().min(0),
  }),
});

// POST /api/s2/results — submit match result from game server
app.post('/', async (c) => {
  if (!SERVER_SECRET) {
    throw new AppError(503, 'S2_RESULTS_UNAVAILABLE', 'Result submission not configured');
  }

  const headerSecret = c.req.header(S2_GAME_SERVER_SECRET_HEADER);
  const body = await validateJson(c, matchResultSchema);

  if (body.secret !== SERVER_SECRET && (headerSecret == null || headerSecret !== SERVER_SECRET)) {
    throw new AppError(401, 'S2_RESULTS_UNAUTHORIZED', 'Invalid server secret');
  }

  await applyS2MatchResult(body.battleId, body.result);

  return c.json({ status: 'accepted', battleId: body.battleId });
});

export default app;
