import { describe, expect, it } from 'vitest';
import {
  createS2QueueAuthMessage,
  createS2QueueCancelMessage,
  S2_QUEUE_AUTH_STATEMENT,
  S2_QUEUE_CANCEL_AUTH_STATEMENT,
  S2_AUTH_URI,
  S2_AUTH_VERSION,
} from '../s2Auth';

describe('createS2QueueAuthMessage', () => {
  it('builds a structured message with token ID and timestamp', () => {
    const message = createS2QueueAuthMessage({
      tokenId: 42,
      issuedAt: '2026-04-05T00:00:00.000Z',
    });

    expect(message).toBe(
      [
        S2_QUEUE_AUTH_STATEMENT,
        'Token ID: 42',
        'Issued At: 2026-04-05T00:00:00.000Z',
        `URI: ${S2_AUTH_URI}`,
        `Version: ${S2_AUTH_VERSION}`,
      ].join('\n')
    );
  });
});

describe('createS2QueueCancelMessage', () => {
  it('builds a structured message with queue ID and timestamp', () => {
    const message = createS2QueueCancelMessage({
      queueId: 'abc-123',
      issuedAt: '2026-04-05T00:00:00.000Z',
    });

    expect(message).toBe(
      [
        S2_QUEUE_CANCEL_AUTH_STATEMENT,
        'Queue ID: abc-123',
        'Issued At: 2026-04-05T00:00:00.000Z',
        `URI: ${S2_AUTH_URI}`,
        `Version: ${S2_AUTH_VERSION}`,
      ].join('\n')
    );
  });
});
