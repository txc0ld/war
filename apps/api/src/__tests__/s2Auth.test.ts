import { describe, expect, it, vi } from 'vitest';

vi.mock('viem', async () => {
  const actual = await vi.importActual<typeof import('viem')>('viem');
  return {
    ...actual,
    recoverMessageAddress: vi.fn(),
    getAddress: actual.getAddress,
  };
});

import { recoverMessageAddress } from 'viem';
import { createS2QueueAuthMessage } from '@warpath/shared';
import { verifyS2QueueAuth } from '../middleware/s2Auth';

const mockedRecover = vi.mocked(recoverMessageAddress);

describe('verifyS2QueueAuth', () => {
  it('recovers address from valid signed queue request', async () => {
    const payload = { tokenId: 42, issuedAt: new Date().toISOString() };
    const message = createS2QueueAuthMessage(payload);
    const signature = '0xdeadbeef' as `0x${string}`;

    mockedRecover.mockResolvedValue('0x1234567890abcdef1234567890abcdef12345678');

    const result = await verifyS2QueueAuth({
      ...payload,
      message,
      signature,
    });

    expect(result.address).toBe('0x1234567890AbcdEF1234567890aBcdef12345678');
  });

  it('rejects expired messages', async () => {
    const staleDate = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const payload = { tokenId: 42, issuedAt: staleDate };
    const message = createS2QueueAuthMessage(payload);

    await expect(
      verifyS2QueueAuth({ ...payload, message, signature: '0xabc' as `0x${string}` })
    ).rejects.toThrow('expired');
  });
});
