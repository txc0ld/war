// apps/api/src/routes/s2Killfeed.ts
import { Hono } from 'hono';
import { z } from 'zod';
import type { S2KillfeedResponse } from '@warpath/shared';
import { validateQuery } from '../middleware/validate';
import { getS2Killfeed } from '../services/s2Killfeed';

const app = new Hono();

const killfeedQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

// GET /api/s2/killfeed — recent Season 2 battle results
app.get('/', async (c) => {
  const { limit } = validateQuery(c, killfeedQuerySchema);
  const entries = await getS2Killfeed(limit);
  return c.json({ entries } satisfies S2KillfeedResponse);
});

export default app;
