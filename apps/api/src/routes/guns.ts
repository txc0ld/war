import { Hono } from 'hono';
import { z } from 'zod';
import type { GunsResponse } from '@warpath/shared';
import { isAddress } from 'viem';
import { validateParams } from '../middleware/validate';
import { getGunsForAddress } from '../services/guns';
import { getWalletCooldownState } from '../services/players';

const app = new Hono();
const gunParamsSchema = z.object({
  address: z.string().refine((value) => isAddress(value), 'must be a valid address'),
});

// GET /api/guns/:address — cached metadata proxy
app.get('/:address', async (c) => {
  const { address } = validateParams(c, gunParamsSchema);
  const guns = await getGunsForAddress(address as `0x${string}`);
  const cooldown = await getWalletCooldownState(address);

  const response: GunsResponse = {
    guns,
    cooldown: {
      expiresAt: cooldown.expiresAt?.toISOString() ?? null,
      remainingMs: cooldown.remainingMs,
      gunCount: cooldown.gunCount,
    },
  };

  return c.json(response);
});

export default app;
