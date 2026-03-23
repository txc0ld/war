import { createHash, randomBytes } from 'node:crypto';
import { and, eq, gt } from 'drizzle-orm';
import { getAddress } from 'viem';
import type { ChatSessionResponse } from '@warpath/shared';
import { db } from '../db/client';
import { chatSessions } from '../db/schema';
import { AppError } from '../lib/errors';

const CHAT_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function issueChatSession(
  address: string
): Promise<ChatSessionResponse> {
  const normalizedAddress = getAddress(address);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + CHAT_SESSION_TTL_MS);
  const token = randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);

  await db.insert(chatSessions).values({
    address: normalizedAddress,
    tokenHash,
    expiresAt,
    lastUsedAt: now,
    createdAt: now,
    updatedAt: now,
  });

  return {
    address: normalizedAddress,
    token,
    expiresAt: expiresAt.toISOString(),
  };
}

export async function verifyChatSessionToken(token: string): Promise<string> {
  const normalizedToken = token.trim();
  if (!normalizedToken) {
    throw new AppError(401, 'CHAT_SESSION_MISSING', 'Missing chat session token');
  }

  const tokenHash = hashToken(normalizedToken);
  const now = new Date();
  const [session] = await db
    .select()
    .from(chatSessions)
    .where(
      and(
        eq(chatSessions.tokenHash, tokenHash),
        gt(chatSessions.expiresAt, now)
      )
    )
    .limit(1);

  if (!session) {
    throw new AppError(401, 'CHAT_SESSION_INVALID', 'Chat session expired');
  }

  await db
    .update(chatSessions)
    .set({
      lastUsedAt: now,
      updatedAt: now,
    })
    .where(eq(chatSessions.id, session.id));

  return getAddress(session.address);
}
