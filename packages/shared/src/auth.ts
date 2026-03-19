import type { QueueAuthPayload } from './types.js';

export const QUEUE_AUTH_STATEMENT = 'WAR PATH Queue Authorization' as const;
export const QUEUE_AUTH_URI = 'https://warpath.gg' as const;
export const QUEUE_AUTH_VERSION = '1' as const;
export const QUEUE_AUTH_MAX_AGE_MS = 5 * 60 * 1000;

export function createQueueAuthMessage(payload: QueueAuthPayload): string {
  return [
    QUEUE_AUTH_STATEMENT,
    `Token ID: ${payload.tokenId}`,
    `Country: ${payload.country}`,
    `Issued At: ${payload.issuedAt}`,
    `URI: ${QUEUE_AUTH_URI}`,
    `Version: ${QUEUE_AUTH_VERSION}`,
  ].join('\n');
}
