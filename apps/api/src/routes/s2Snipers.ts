// apps/api/src/routes/s2Snipers.ts
import { Hono } from 'hono';
import { z } from 'zod';
import { isAddress } from 'viem';
import type { S2SnipersResponse } from '@warpath/shared';
import { validateParams } from '../middleware/validate';
import { getSnipersForAddress } from '../services/s2Snipers';

const app = new Hono();

const sniperParamsSchema = z.object({
  address: z.string().refine((value) => isAddress(value), 'must be a valid address'),
});

// GET /api/s2/snipers/:address — get snipers owned by address
app.get('/:address', async (c) => {
  const { address } = validateParams(c, sniperParamsSchema);
  const snipers = await getSnipersForAddress(address as `0x${string}`);
  return c.json({ snipers } satisfies S2SnipersResponse);
});

export default app;
