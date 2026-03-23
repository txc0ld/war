import type {
  ChatMessagePayload,
  ChatSessionPayload,
  ProfileUpdatePayload,
  QueueAuthPayload,
  QueueCancelAuthPayload,
} from './types.js';

export const QUEUE_AUTH_STATEMENT = 'WAR ROOM Queue Authorization' as const;
export const QUEUE_CANCEL_AUTH_STATEMENT = 'WAR ROOM Queue Cancellation' as const;
export const PROFILE_UPDATE_AUTH_STATEMENT = 'WAR ROOM Profile Update' as const;
export const GLOBAL_CHAT_AUTH_STATEMENT = 'WAR ROOM Global Chat' as const;
export const CHAT_SESSION_AUTH_STATEMENT = 'WAR ROOM Chat Session' as const;
export const QUEUE_AUTH_URI = 'https://warroom.gg' as const;
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

export function createQueueCancelMessage(
  payload: QueueCancelAuthPayload
): string {
  return [
    QUEUE_CANCEL_AUTH_STATEMENT,
    `Queue ID: ${payload.queueId}`,
    `Issued At: ${payload.issuedAt}`,
    `URI: ${QUEUE_AUTH_URI}`,
    `Version: ${QUEUE_AUTH_VERSION}`,
  ].join('\n');
}

function serializeOptionalField(value: string | null): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : '-';
}

export function createProfileUpdateMessage(
  payload: ProfileUpdatePayload
): string {
  return [
    PROFILE_UPDATE_AUTH_STATEMENT,
    `Address: ${payload.address}`,
    `Display Name: ${serializeOptionalField(payload.displayName)}`,
    `Avatar URL: ${serializeOptionalField(payload.avatarUrl)}`,
    `Status Message: ${serializeOptionalField(payload.statusMessage)}`,
    `Show Battle Results: ${payload.showBattleResults ? 'true' : 'false'}`,
    `Show Chat Presence: ${payload.showChatPresence ? 'true' : 'false'}`,
    `Issued At: ${payload.issuedAt}`,
    `URI: ${QUEUE_AUTH_URI}`,
    `Version: ${QUEUE_AUTH_VERSION}`,
  ].join('\n');
}

export function createGlobalChatMessage(payload: ChatMessagePayload): string {
  return [
    GLOBAL_CHAT_AUTH_STATEMENT,
    `Body: ${payload.body}`,
    `Issued At: ${payload.issuedAt}`,
    `URI: ${QUEUE_AUTH_URI}`,
    `Version: ${QUEUE_AUTH_VERSION}`,
  ].join('\n');
}

export function createChatSessionMessage(
  payload: ChatSessionPayload
): string {
  return [
    CHAT_SESSION_AUTH_STATEMENT,
    `Address: ${payload.address}`,
    `Issued At: ${payload.issuedAt}`,
    `URI: ${QUEUE_AUTH_URI}`,
    `Version: ${QUEUE_AUTH_VERSION}`,
  ].join('\n');
}
