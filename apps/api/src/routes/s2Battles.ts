// apps/api/src/routes/s2Battles.ts
import { Hono } from 'hono';
import { z } from 'zod';
import type { S2QueueRequest, S2QueueCancelRequest, S2QueueStatusRequest } from '@warpath/shared';
import { joinS2Queue, getS2QueueStatus, cancelS2Queue } from '../services/s2Matchmaking';
import { verifyS2QueueAuth, verifyS2QueueCancelAuth } from '../middleware/s2Auth';
import { verifySniperOwnership } from '../services/s2Snipers';
import { AppError } from '../lib/errors';
import { validateJson, validateParams } from '../middleware/validate';

const app = new Hono();

const queueRequestSchema = z.object({
  tokenId: z.coerce.number().int().nonnegative(),
  issuedAt: z.string().min(1),
  message: z.string().min(1),
  signature: z.string().regex(/^0x[0-9a-fA-F]+$/, 'must be a hex signature'),
});

const queueParamsSchema = z.object({
  queueId: z.string().uuid(),
});

const queueCancelRequestSchema = z.object({
  queueId: z.string().uuid(),
  issuedAt: z.string().min(1),
  message: z.string().min(1),
  signature: z.string().regex(/^0x[0-9a-fA-F]+$/, 'must be a hex signature'),
});

const queueStatusRequestSchema = z.object({
  queueId: z.string().uuid(),
  statusToken: z.string().uuid(),
});

// POST /api/s2/battles/queue — join the Season 2 matchmaking queue
app.post('/queue', async (c) => {
  const body = (await validateJson(c, queueRequestSchema)) as S2QueueRequest;

  let verified;
  try {
    verified = await verifyS2QueueAuth(body);
  } catch (error) {
    throw new AppError(
      401,
      'S2_QUEUE_AUTH_INVALID',
      error instanceof Error ? error.message : 'Invalid authorization'
    );
  }

  const ownsToken = await verifySniperOwnership(verified.address, body.tokenId);
  if (!ownsToken) {
    throw new AppError(
      403,
      'S2_TOKEN_OWNERSHIP_MISMATCH',
      'Signer does not own the queued sniper'
    );
  }

  const result = await joinS2Queue(verified.address, body.tokenId);
  return c.json(result, 201);
});

// POST /api/s2/battles/queue/:queueId/cancel — cancel a waiting Season 2 queue entry
app.post('/queue/:queueId/cancel', async (c) => {
  const { queueId } = validateParams(c, queueParamsSchema);
  const body = (await validateJson(c, queueCancelRequestSchema)) as S2QueueCancelRequest;

  if (body.queueId !== queueId) {
    throw new AppError(400, 'S2_QUEUE_CANCEL_MISMATCH', 'Payload queue ID mismatch');
  }

  let verified;
  try {
    verified = await verifyS2QueueCancelAuth(body);
  } catch (error) {
    throw new AppError(
      401,
      'S2_QUEUE_CANCEL_AUTH_INVALID',
      error instanceof Error ? error.message : 'Invalid cancellation authorization'
    );
  }

  return c.json(await cancelS2Queue(queueId, verified.address));
});

// POST /api/s2/battles/queue/:queueId/status — poll Season 2 match status
app.post('/queue/:queueId/status', async (c) => {
  const { queueId } = validateParams(c, queueParamsSchema);
  const body = (await validateJson(c, queueStatusRequestSchema)) as S2QueueStatusRequest;

  if (body.queueId !== queueId) {
    throw new AppError(400, 'S2_QUEUE_STATUS_MISMATCH', 'Payload queue ID mismatch');
  }

  return c.json(await getS2QueueStatus(queueId, body.statusToken));
});

export default app;
