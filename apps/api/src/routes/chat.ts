import { Hono } from 'hono';
import type {
  ChatCreateRequest,
  ChatMessagesResponse,
  ChatSessionRequest,
} from '@warpath/shared';
import { z } from 'zod';
import { AppError } from '../lib/errors';
import { verifyChatSessionAuth } from '../middleware/auth';
import { validateJson, validateQuery } from '../middleware/validate';
import { createGlobalChatMessage, listGlobalChatMessages } from '../services/chat';
import { issueChatSession } from '../services/chatSessions';

const app = new Hono();
const chatQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
const chatCreateSchema = z.object({
  address: z.string().min(1),
  body: z.string().trim().min(1).max(280),
});
const chatSessionSchema = z.object({
  address: z.string().min(1),
  issuedAt: z.string().min(1),
  message: z.string().min(1),
  signature: z.string().regex(/^0x[0-9a-fA-F]+$/, 'must be a hex signature'),
});

app.get('/', async (c) => {
  const { limit } = validateQuery(c, chatQuerySchema);
  const messages = await listGlobalChatMessages(limit);
  return c.json({ messages } satisfies ChatMessagesResponse);
});

app.post('/session', async (c) => {
  const body = (await validateJson(c, chatSessionSchema)) as ChatSessionRequest;

  let verified;
  try {
    verified = await verifyChatSessionAuth(body);
  } catch (error) {
    throw new AppError(
      401,
      'CHAT_SESSION_AUTH_INVALID',
      error instanceof Error ? error.message : 'Invalid chat session authorization'
    );
  }

  return c.json(await issueChatSession(verified.address), 201);
});

app.post('/', async (c) => {
  const body = (await validateJson(c, chatCreateSchema)) as ChatCreateRequest;
  return c.json(await createGlobalChatMessage(body.address, body.body), 201);
});

export default app;
