import { beforeEach, describe, expect, it, vi } from 'vitest';
import { privateKeyToAccount } from 'viem/accounts';
import { createQueueAuthMessage } from '@warpath/shared';
import { app } from '../index';
import { joinQueue } from '../services/matchmaking';
import { verifyTokenOwnership } from '../services/ownership';

vi.mock('../services/matchmaking', () => ({
  joinQueue: vi.fn(),
  getQueueStatus: vi.fn(),
}));

vi.mock('../services/ownership', () => ({
  verifyTokenOwnership: vi.fn(),
}));

const mockedJoinQueue = vi.mocked(joinQueue);
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

describe('queue auth route', () => {
  beforeEach(() => {
    mockedJoinQueue.mockReset();
    mockedVerifyTokenOwnership.mockReset();
    mockedJoinQueue.mockResolvedValue({ queueId: 'queue-1', status: 'queued' });
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
