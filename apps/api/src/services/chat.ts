import { desc } from 'drizzle-orm';
import type { ChatMessageEntry } from '@warpath/shared';
import { getAddress } from 'viem';
import { db } from '../db/client';
import { chatMessages } from '../db/schema';
import { AppError } from '../lib/errors';
import { getProfilesByAddress } from './profiles';

const MAX_CHAT_BODY_LENGTH = 280;

export async function listGlobalChatMessages(
  limit = 50
): Promise<ChatMessageEntry[]> {
  const rows = await db
    .select()
    .from(chatMessages)
    .orderBy(desc(chatMessages.createdAt))
    .limit(limit);

  const profileMap = await getProfilesByAddress(rows.map((row) => row.address));

  return rows.map((row) => {
    const normalizedAddress = getAddress(row.address);
    const profile = profileMap.get(normalizedAddress);

    return {
      id: row.id,
      address: normalizedAddress,
      body: row.body,
      createdAt: row.createdAt.toISOString(),
      profile: {
        displayName: profile?.displayName ?? null,
        ensName: profile?.ensName ?? null,
        avatarUrl: profile?.avatarUrl ?? null,
        showChatPresence: profile?.showChatPresence ?? true,
      },
    };
  });
}

export async function createGlobalChatMessage(
  address: string,
  body: string
): Promise<ChatMessageEntry> {
  const normalizedAddress = getAddress(address);
  const normalizedBody = body.trim();

  if (!normalizedBody) {
    throw new AppError(400, 'CHAT_BODY_REQUIRED', 'Chat message cannot be empty');
  }

  if (normalizedBody.length > MAX_CHAT_BODY_LENGTH) {
    throw new AppError(
      400,
      'CHAT_BODY_TOO_LONG',
      `Chat message must be ${MAX_CHAT_BODY_LENGTH} characters or fewer`
    );
  }

  const [message] = await db
    .insert(chatMessages)
    .values({
      address: normalizedAddress,
      body: normalizedBody,
      createdAt: new Date(),
    })
    .returning();

  if (!message) {
    throw new AppError(500, 'CHAT_MESSAGE_CREATE_FAILED', 'Failed to create chat message');
  }

  const profileMap = await getProfilesByAddress([normalizedAddress]);
  const profile = profileMap.get(normalizedAddress);

  return {
    id: message.id,
    address: normalizedAddress,
    body: message.body,
    createdAt: message.createdAt.toISOString(),
    profile: {
      displayName: profile?.displayName ?? null,
      ensName: profile?.ensName ?? null,
      avatarUrl: profile?.avatarUrl ?? null,
      showChatPresence: profile?.showChatPresence ?? true,
    },
  };
}
