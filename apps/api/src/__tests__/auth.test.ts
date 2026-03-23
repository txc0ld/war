import { beforeEach, describe, expect, it, vi } from 'vitest';
import { privateKeyToAccount } from 'viem/accounts';
import {
  createQueueAuthMessage,
  createQueueCancelMessage,
} from '@warpath/shared';

vi.mock('../middleware/rateLimit', () => ({
  createRateLimit: () => async (_c: unknown, next: () => Promise<void>) => {
    await next();
  },
}));

import { app } from '../index';
import {
  cancelQueue,
  getQueueStatus,
  joinQueue,
} from '../services/matchmaking';
import { verifyTokenOwnership } from '../services/ownership';

vi.mock('../services/matchmaking', () => ({
  joinQueue: vi.fn(),
  cancelQueue: vi.fn(),
  getQueueStatus: vi.fn(),
}));

vi.mock('../services/ownership', () => ({
  verifyTokenOwnership: vi.fn(),
}));

const mockedJoinQueue = vi.mocked(joinQueue);
const mockedCancelQueue = vi.mocked(cancelQueue);
const mockedGetQueueStatus = vi.mocked(getQueueStatus);
const mockedVerifyTokenOwnership = vi.mocked(verifyTokenOwnership);
const account = privateKeyToAccount(
  '0x59c6995e998f97a5a0044966f094538ec5f3e8ad6d64f4f9f9f2d77c4ec0b6f1'
);

async function postQueue(body: Record<string, unknown>): Promise<Response> {
  return app.request('http://localhost/api/battles/queue', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function postQueueCancel(
  queueId: string,
  body: Record<string, unknown>
): Promise<Response> {
  return app.request(`http://localhost/api/battles/queue/${queueId}/cancel`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function postQueueStatus(
  queueId: string,
  body: Record<string, unknown>
): Promise<Response> {
  return app.request(`http://localhost/api/battles/queue/${queueId}/status`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('queue auth route', () => {
  beforeEach(() => {
    mockedJoinQueue.mockReset();
    mockedCancelQueue.mockReset();
    mockedGetQueueStatus.mockReset();
    mockedVerifyTokenOwnership.mockReset();
    mockedJoinQueue.mockResolvedValue({
      queueId: 'queue-1',
      status: 'queued',
      statusToken: '11111111-1111-4111-8111-111111111111',
      cooldown: {
        expiresAt: null,
        remainingMs: 0,
        gunCount: 1,
      },
    });
    mockedCancelQueue.mockResolvedValue({
      queueId: 'queue-1',
      status: 'cancelled',
      cancelledAt: '2026-03-21T00:00:00.000Z',
      cooldown: {
        expiresAt: null,
        remainingMs: 0,
        gunCount: 1,
      },
    });
    mockedVerifyTokenOwnership.mockResolvedValue(true);
  });

  it('accepts a valid signed queue request', async () => {
    const issuedAt = new Date().toISOString();
    const message = createQueueAuthMessage({
      tokenId: 17,
      country: 'AU',
      issuedAt,
    });
    const signature = await account.signMessage({ message });

    const response = await postQueue({
      tokenId: 17,
      country: 'AU',
      issuedAt,
      message,
      signature,
    });

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      queueId: 'queue-1',
      status: 'queued',
      statusToken: '11111111-1111-4111-8111-111111111111',
      cooldown: {
        expiresAt: null,
        remainingMs: 0,
        gunCount: 1,
      },
    });
    expect(mockedVerifyTokenOwnership).toHaveBeenCalledWith(account.address, 17);
    expect(mockedJoinQueue).toHaveBeenCalledWith(account.address, 17, 'AU');
  });

  it('rejects an invalid signature', async () => {
    const issuedAt = new Date().toISOString();
    const message = createQueueAuthMessage({
      tokenId: 17,
      country: 'AU',
      issuedAt,
    });

    const response = await postQueue({
      tokenId: 17,
      country: 'AU',
      issuedAt,
      message,
      signature: '0xdeadbeef',
    });

    expect(response.status).toBe(401);
    expect(mockedVerifyTokenOwnership).not.toHaveBeenCalled();
    expect(mockedJoinQueue).not.toHaveBeenCalled();
  });

  it('rejects expired queue authorizations', async () => {
    const issuedAt = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const message = createQueueAuthMessage({
      tokenId: 17,
      country: 'AU',
      issuedAt,
    });
    const signature = await account.signMessage({ message });

    const response = await postQueue({
      tokenId: 17,
      country: 'AU',
      issuedAt,
      message,
      signature,
    });

    expect(response.status).toBe(401);
    expect(mockedVerifyTokenOwnership).not.toHaveBeenCalled();
    expect(mockedJoinQueue).not.toHaveBeenCalled();
  });

  it('rejects valid signatures when the signer does not own the token', async () => {
    mockedVerifyTokenOwnership.mockResolvedValue(false);

    const issuedAt = new Date().toISOString();
    const message = createQueueAuthMessage({
      tokenId: 17,
      country: 'AU',
      issuedAt,
    });
    const signature = await account.signMessage({ message });

    const response = await postQueue({
      tokenId: 17,
      country: 'AU',
      issuedAt,
      message,
      signature,
    });

    expect(response.status).toBe(403);
    expect(mockedVerifyTokenOwnership).toHaveBeenCalledWith(account.address, 17);
    expect(mockedJoinQueue).not.toHaveBeenCalled();
  });
});

describe('queue cancel auth route', () => {
  beforeEach(() => {
    mockedCancelQueue.mockReset();
    mockedCancelQueue.mockResolvedValue({
      queueId: 'queue-1',
      status: 'cancelled',
      cancelledAt: '2026-03-21T00:00:00.000Z',
      cooldown: {
        expiresAt: null,
        remainingMs: 0,
        gunCount: 1,
      },
    });
  });

  it('accepts a valid signed queue cancellation', async () => {
    const issuedAt = new Date().toISOString();
    const queueId = '7eb6fc15-8f40-4498-af4f-8c7fe7e0f0be';
    const message = createQueueCancelMessage({
      queueId,
      issuedAt,
    });
    const signature = await account.signMessage({ message });

    const response = await postQueueCancel(queueId, {
      queueId,
      issuedAt,
      message,
      signature,
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      queueId: 'queue-1',
      status: 'cancelled',
      cancelledAt: '2026-03-21T00:00:00.000Z',
      cooldown: {
        expiresAt: null,
        remainingMs: 0,
        gunCount: 1,
      },
    });
    expect(mockedCancelQueue).toHaveBeenCalledWith(queueId, account.address);
  });

  it('rejects queue id mismatches between route and signed payload', async () => {
    const routeQueueId = '7eb6fc15-8f40-4498-af4f-8c7fe7e0f0be';
    const bodyQueueId = '1f7aef61-b390-4218-8ff2-72dc9a9d9bb4';
    const issuedAt = new Date().toISOString();
    const message = createQueueCancelMessage({
      queueId: bodyQueueId,
      issuedAt,
    });
    const signature = await account.signMessage({ message });

    const response = await postQueueCancel(routeQueueId, {
      queueId: bodyQueueId,
      issuedAt,
      message,
      signature,
    });

    expect(response.status).toBe(400);
    expect(mockedCancelQueue).not.toHaveBeenCalled();
  });
});

describe('queue status route', () => {
  beforeEach(() => {
    mockedGetQueueStatus.mockReset();
    mockedGetQueueStatus.mockResolvedValue({
      status: 'waiting',
      queueId: '7eb6fc15-8f40-4498-af4f-8c7fe7e0f0be',
      expiresAt: '2026-03-21T00:10:00.000Z',
      cooldown: {
        expiresAt: null,
        remainingMs: 0,
        gunCount: 1,
      },
    });
  });

  it('accepts a queue status poll with a matching token payload', async () => {
    const queueId = '7eb6fc15-8f40-4498-af4f-8c7fe7e0f0be';
    const statusToken = '11111111-1111-4111-8111-111111111111';
    const response = await postQueueStatus(queueId, {
      queueId,
      statusToken,
    });

    expect(response.status).toBe(200);
    expect(mockedGetQueueStatus).toHaveBeenCalledWith(queueId, statusToken);
  });

  it('rejects queue id mismatches between route and payload', async () => {
    const response = await postQueueStatus(
      '7eb6fc15-8f40-4498-af4f-8c7fe7e0f0be',
      {
        queueId: '1f7aef61-b390-4218-8ff2-72dc9a9d9bb4',
        statusToken: '11111111-1111-4111-8111-111111111111',
      }
    );

    expect(response.status).toBe(400);
    expect(mockedGetQueueStatus).not.toHaveBeenCalled();
  });
});
