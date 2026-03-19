import { Hono } from 'hono';
import { z } from 'zod';
import { isAddress } from 'viem';
import { validateParams } from '../middleware/validate';
import { getGunsForAddress } from '../services/guns';

const app = new Hono();
const gunParamsSchema = z.object({
  address: z.string().refine((value) => isAddress(value), 'must be a valid address'),
});

// GET /api/guns/:address — cached metadata proxy
app.get('/:address', async (c) => {
  const { address } = validateParams(c, gunParamsSchema);
  const guns = await getGunsForAddress(address as `0x${string}`);

  return c.json({ guns });
});

export default app;
