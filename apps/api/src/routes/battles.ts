import { Hono } from 'hono';
import type {
  QueueCancelRequest,
  QueueRequest,
  QueueStatusRequest,
} from '@warpath/shared';
import { z } from 'zod';
import {
  cancelQueue,
  getQueueStatus,
  joinQueue,
} from '../services/matchmaking';
import { getBattle, getBattleProof, getBattleReplay } from '../services/battle';
import { verifyQueueAuth, verifyQueueCancelAuth } from '../middleware/auth';
import { AppError } from '../lib/errors';
import { verifyTokenOwnership } from '../services/ownership';
import { validateJson, validateParams } from '../middleware/validate';

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

// POST /api/battles/queue/:queueId/cancel — cancel a waiting queue entry
app.post('/queue/:queueId/cancel', async (c) => {
  const { queueId } = validateParams(c, queueParamsSchema);
  const body = (await validateJson(
    c,
    queueCancelRequestSchema
  )) as QueueCancelRequest;

  if (body.queueId !== queueId) {
    throw new AppError(
      400,
      'QUEUE_CANCEL_MISMATCH',
      'Queue cancellation payload does not match the route queue id'
    );
  }

  let verified;
  try {
    verified = await verifyQueueCancelAuth(body);
  } catch (error) {
    throw new AppError(
      401,
      'QUEUE_CANCEL_AUTH_INVALID',
      error instanceof Error
        ? error.message
        : 'Invalid queue cancellation authorization'
    );
  }

  return c.json(await cancelQueue(queueId, verified.address));
});

// POST /api/battles/queue/:queueId/status — poll match status
app.post('/queue/:queueId/status', async (c) => {
  const { queueId } = validateParams(c, queueParamsSchema);
  const body = (await validateJson(
    c,
    queueStatusRequestSchema
  )) as QueueStatusRequest;

  if (body.queueId !== queueId) {
    throw new AppError(
      400,
      'QUEUE_STATUS_MISMATCH',
      'Queue status payload does not match the route queue id'
    );
  }

  try {
    const status = await getQueueStatus(queueId, body.statusToken);
    return c.json(status);
  } catch (error) {
    if (error instanceof Error && error.message === 'Queue entry not found') {
      throw new AppError(404, 'QUEUE_NOT_FOUND', 'Queue entry not found');
    }

    throw error;
  }
});

// GET /api/battles/:battleId — get battle data
app.get('/:battleId/proof', async (c) => {
  const { battleId } = validateParams(c, battleParamsSchema);
  const battle = await getBattle(battleId);

  if (!battle) {
    throw new AppError(404, 'BATTLE_NOT_FOUND', 'Battle not found');
  }

  if (battle.status !== 'resolved') {
    throw new AppError(
      409,
      'BATTLE_PROOF_UNAVAILABLE',
      'Battle proof is not available yet'
    );
  }

  const proof = await getBattleProof(battleId);

  if (!proof) {
    throw new AppError(
      409,
      'BATTLE_PROOF_UNAVAILABLE',
      'Battle proof is not available yet'
    );
  }

  return c.json(proof);
});

// GET /api/battles/:battleId/replay — get replay payload
app.get('/:battleId/replay', async (c) => {
  const { battleId } = validateParams(c, battleParamsSchema);
  return c.json(await getBattleReplay(battleId));
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
