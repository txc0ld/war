import type { S2QueueAuthPayload, S2QueueCancelAuthPayload } from './s2Types.js';

export const S2_QUEUE_AUTH_STATEMENT = 'DEADSHOT Queue Authorization' as const;
export const S2_QUEUE_CANCEL_AUTH_STATEMENT = 'DEADSHOT Queue Cancellation' as const;
export const S2_AUTH_URI = 'https://warroom.gg' as const;
export const S2_AUTH_VERSION = '1' as const;
export const S2_QUEUE_AUTH_MAX_AGE_MS = 5 * 60 * 1000;

export function createS2QueueAuthMessage(payload: S2QueueAuthPayload): string {
  return [
    S2_QUEUE_AUTH_STATEMENT,
    `Token ID: ${payload.tokenId}`,
    `Issued At: ${payload.issuedAt}`,
    `URI: ${S2_AUTH_URI}`,
    `Version: ${S2_AUTH_VERSION}`,
  ].join('\n');
}

export function createS2QueueCancelMessage(
  payload: S2QueueCancelAuthPayload
): string {
  return [
    S2_QUEUE_CANCEL_AUTH_STATEMENT,
    `Queue ID: ${payload.queueId}`,
    `Issued At: ${payload.issuedAt}`,
    `URI: ${S2_AUTH_URI}`,
    `Version: ${S2_AUTH_VERSION}`,
  ].join('\n');
}
