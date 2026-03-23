import { beforeEach, describe, expect, it, vi } from 'vitest';
import { privateKeyToAccount } from 'viem/accounts';
import {
  createChatSessionMessage as createChatSessionAuthMessage,
  createProfileUpdateMessage as createProfileAuthMessage,
} from '../../../../packages/shared/src/auth';

vi.mock('../middleware/rateLimit', () => ({
  createRateLimit: () => async (_c: unknown, next: () => Promise<void>) => {
    await next();
  },
}));

import { app } from '../index';
import { createGlobalChatMessage as createChatMessage, listGlobalChatMessages } from '../services/chat';
import { issueChatSession } from '../services/chatSessions';
import { getKillfeed } from '../services/killfeed';
import { getProfile, upsertProfile } from '../services/profiles';

vi.mock('../services/chat', () => ({
  createGlobalChatMessage: vi.fn(),
  listGlobalChatMessages: vi.fn(),
}));

vi.mock('../services/chatSessions', () => ({
  issueChatSession: vi.fn(),
}));

vi.mock('../services/killfeed', () => ({
  getKillfeed: vi.fn(),
}));

vi.mock('../services/profiles', () => ({
  getProfile: vi.fn(),
  isSafeAvatarUrl: (value: string) => value.startsWith('data:image/'),
  upsertProfile: vi.fn(),
}));

const mockedCreateGlobalChatMessage = vi.mocked(createChatMessage);
const mockedListGlobalChatMessages = vi.mocked(listGlobalChatMessages);
const mockedIssueChatSession = vi.mocked(issueChatSession);
const mockedGetKillfeed = vi.mocked(getKillfeed);
const mockedGetProfile = vi.mocked(getProfile);
const mockedUpsertProfile = vi.mocked(upsertProfile);
const inlineAvatar =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9sX4XWQAAAAASUVORK5CYII=';

const account = privateKeyToAccount(
  '0x59c6995e998f97a5a0044966f094538ec5f3e8ad6d64f4f9f9f2d77c4ec0b6f1'
);

describe('social routes', () => {
  beforeEach(() => {
    mockedCreateGlobalChatMessage.mockReset();
    mockedListGlobalChatMessages.mockReset();
    mockedIssueChatSession.mockReset();
    mockedGetKillfeed.mockReset();
    mockedGetProfile.mockReset();
    mockedUpsertProfile.mockReset();

    mockedListGlobalChatMessages.mockResolvedValue([
      {
        id: 'chat-1',
        address: account.address,
        body: 'GG',
        createdAt: '2026-03-22T00:00:00.000Z',
        profile: {
          displayName: 'Operator',
          ensName: 'operator.eth',
          avatarUrl: null,
          showChatPresence: true,
        },
      },
    ]);
    mockedCreateGlobalChatMessage.mockResolvedValue({
      id: 'chat-2',
      address: account.address,
      body: 'Holding the line',
      createdAt: '2026-03-22T00:00:01.000Z',
      profile: {
        displayName: 'Operator',
        ensName: 'operator.eth',
        avatarUrl: null,
        showChatPresence: true,
      },
    });
    mockedIssueChatSession.mockResolvedValue({
      address: account.address,
      token: 'chat-session-token',
      expiresAt: '2026-03-29T00:00:00.000Z',
    });
    mockedGetKillfeed.mockResolvedValue([
      {
        battleId: 'battle-1',
        winnerAddress: account.address,
        loserAddress: '0x000000000000000000000000000000000000dead',
        winnerTokenId: 1,
        loserTokenId: 2,
        winnerGunName: 'Winner',
        loserGunName: 'Loser',
        winnerImageUrl: 'winner.png',
        loserImageUrl: 'loser.png',
        winnerProfile: {
          displayName: 'Victor',
          ensName: 'victor.eth',
          avatarUrl: null,
          showBattleResults: true,
        },
        loserProfile: {
          displayName: 'Defeated',
          ensName: null,
          avatarUrl: null,
          showBattleResults: true,
        },
        resolvedAt: '2026-03-22T00:00:00.000Z',
      },
    ]);
    mockedGetProfile.mockResolvedValue({
      address: account.address,
      displayName: 'Operator',
      ensName: 'operator.eth',
      avatarUrl: null,
      statusMessage: null,
      showBattleResults: true,
      showChatPresence: true,
      createdAt: '2026-03-22T00:00:00.000Z',
      updatedAt: '2026-03-22T00:00:00.000Z',
    });
    mockedUpsertProfile.mockResolvedValue({
      address: account.address,
      displayName: 'Operator',
      ensName: 'operator.eth',
      avatarUrl: inlineAvatar,
      statusMessage: 'Ready',
      showBattleResults: true,
      showChatPresence: true,
      createdAt: '2026-03-22T00:00:00.000Z',
      updatedAt: '2026-03-22T00:01:00.000Z',
    });
  });

  it('lists the global chat feed', async () => {
    const response = await app.request('http://localhost/api/chat?limit=25');
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      messages: [
        {
          id: 'chat-1',
          address: account.address,
          body: 'GG',
          createdAt: '2026-03-22T00:00:00.000Z',
          profile: {
            displayName: 'Operator',
            ensName: 'operator.eth',
            avatarUrl: null,
            showChatPresence: true,
          },
        },
      ],
    });
    expect(mockedListGlobalChatMessages).toHaveBeenCalledWith(25);
  });

  it('issues a valid signed chat session', async () => {
    const payload = {
      address: account.address,
      issuedAt: new Date().toISOString(),
    } as const;
    const message = createChatSessionAuthMessage(payload);
    const signature = await account.signMessage({ message });

    const response = await app.request('http://localhost/api/chat/session', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        message,
        signature,
      }),
    });

    expect(response.status).toBe(201);
    expect(mockedIssueChatSession).toHaveBeenCalledWith(account.address);
  });

  it('accepts a chat message from the provided wallet address', async () => {
    const response = await app.request('http://localhost/api/chat', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        address: account.address,
        body: 'Holding the line',
      }),
    });

    expect(response.status).toBe(201);
    expect(mockedCreateGlobalChatMessage).toHaveBeenCalledWith(
      account.address,
      'Holding the line'
    );
  });

  it('returns a wallet profile', async () => {
    const response = await app.request(
      `http://localhost/api/profiles/${account.address}`
    );

    expect(response.status).toBe(200);
    expect(mockedGetProfile).toHaveBeenCalledWith(account.address);
  });

  it('accepts a valid signed profile update', async () => {
    const payload = {
      address: account.address,
      displayName: 'Operator',
      avatarUrl: inlineAvatar,
      statusMessage: 'Ready',
      showBattleResults: true,
      showChatPresence: true,
      issuedAt: new Date().toISOString(),
    } as const;
    const message = createProfileAuthMessage(payload);
    const signature = await account.signMessage({ message });

    const response = await app.request(
      `http://localhost/api/profiles/${account.address}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          message,
          signature,
        }),
      }
    );

    expect(response.status).toBe(200);
    expect(mockedUpsertProfile).toHaveBeenCalledWith(account.address, {
      displayName: 'Operator',
      avatarUrl: inlineAvatar,
      statusMessage: 'Ready',
      showBattleResults: true,
      showChatPresence: true,
    });
  });

  it('rejects remote avatar urls in profile updates', async () => {
    const payload = {
      address: account.address,
      displayName: 'Operator',
      avatarUrl: 'https://example.com/avatar.png',
      statusMessage: 'Ready',
      showBattleResults: true,
      showChatPresence: true,
      issuedAt: new Date().toISOString(),
    } as const;
    const message = createProfileAuthMessage(payload);
    const signature = await account.signMessage({ message });

    const response = await app.request(
      `http://localhost/api/profiles/${account.address}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          message,
          signature,
        }),
      }
    );

    expect(response.status).toBe(400);
    expect(mockedUpsertProfile).not.toHaveBeenCalled();
  });

  it('lists the global killfeed', async () => {
    const response = await app.request('http://localhost/api/killfeed?limit=10');
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      entries: [
        {
          battleId: 'battle-1',
          winnerAddress: account.address,
          loserAddress: '0x000000000000000000000000000000000000dead',
          winnerTokenId: 1,
          loserTokenId: 2,
          winnerGunName: 'Winner',
          loserGunName: 'Loser',
          winnerImageUrl: 'winner.png',
          loserImageUrl: 'loser.png',
            winnerProfile: {
              displayName: 'Victor',
              ensName: 'victor.eth',
              avatarUrl: null,
              showBattleResults: true,
            },
            loserProfile: {
              displayName: 'Defeated',
              ensName: null,
              avatarUrl: null,
              showBattleResults: true,
            },
          resolvedAt: '2026-03-22T00:00:00.000Z',
        },
      ],
    });
    expect(mockedGetKillfeed).toHaveBeenCalledWith(10);
  });
});
