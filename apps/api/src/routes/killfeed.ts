import { Hono } from 'hono';
import type { KillfeedResponse } from '@warpath/shared';
import { z } from 'zod';
import { validateQuery } from '../middleware/validate';
import { getKillfeed } from '../services/killfeed';

const app = new Hono();
const killfeedQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

app.get('/', async (c) => {
  const { limit } = validateQuery(c, killfeedQuerySchema);
  const entries = await getKillfeed(limit);
  return c.json({ entries } satisfies KillfeedResponse);
});

export default app;
