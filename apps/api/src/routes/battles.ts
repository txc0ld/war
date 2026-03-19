import { Hono } from 'hono';
import type { QueueRequest } from '@warpath/shared';
import { z } from 'zod';
import { joinQueue, getQueueStatus } from '../services/matchmaking';
import { getBattle } from '../services/battle';
import { verifyQueueAuth } from '../middleware/auth';
import { AppError } from '../lib/errors';
import { verifyTokenOwnership } from '../services/ownership';
import { validateJson, validateParams, validateQuery } from '../middleware/validate';

const app = new Hono();
const queueRequestSchema = z.object({
  tokenId: z.coerce.number().int().nonnegative(),
  country: z.string().trim().min(1),
  issuedAt: z.string().min(1),
  message: z.string().min(1),
  signature: z.string().regex(/^0x[0-9a-fA-F]+$/, 'must be a hex signature'),
});
const queueParamsSchema = z.object({
  queueId: z.string().uuid(),
});
const queueQuerySchema = z.object({
  address: z.string().optional(),
});
const battleParamsSchema = z.object({
  battleId: z.string().uuid(),
});

// POST /api/battles/queue — join the matchmaking queue
app.post('/queue', async (c) => {
  const body = (await validateJson(c, queueRequestSchema)) as QueueRequest;

  let verified;
  try {
    verified = await verifyQueueAuth(body);
  } catch (error) {
    throw new AppError(
      401,
      'QUEUE_AUTH_INVALID',
      error instanceof Error ? error.message : 'Invalid queue authorization'
    );
  }

  const ownsToken = await verifyTokenOwnership(verified.address, body.tokenId);
  if (!ownsToken) {
    throw new AppError(
      403,
      'TOKEN_OWNERSHIP_MISMATCH',
      'Signer does not own the queued token'
    );
  }

  const result = await joinQueue(verified.address, body.tokenId, body.country);
  return c.json(result, 201);
});

// GET /api/battles/queue/:queueId — poll match status
app.get('/queue/:queueId', async (c) => {
  const { queueId } = validateParams(c, queueParamsSchema);
  const { address } = validateQuery(c, queueQuerySchema);

  try {
    const status = await getQueueStatus(queueId, address ?? '');
    return c.json(status);
  } catch (error) {
    if (error instanceof Error && error.message === 'Queue entry not found') {
      throw new AppError(404, 'QUEUE_NOT_FOUND', 'Queue entry not found');
    }

    throw error;
  }
});

// GET /api/battles/:battleId — get battle data
app.get('/:battleId', async (c) => {
  const { battleId } = validateParams(c, battleParamsSchema);
  const battle = await getBattle(battleId);

  if (!battle) {
    throw new AppError(404, 'BATTLE_NOT_FOUND', 'Battle not found');
  }

  return c.json(battle);
});

export default app;
