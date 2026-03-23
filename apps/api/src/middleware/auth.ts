import { getAddress, recoverMessageAddress } from 'viem';
import {
  CHAT_SESSION_AUTH_STATEMENT,
  GLOBAL_CHAT_AUTH_STATEMENT,
  PROFILE_UPDATE_AUTH_STATEMENT,
  QUEUE_AUTH_MAX_AGE_MS,
  QUEUE_CANCEL_AUTH_STATEMENT,
  QUEUE_AUTH_STATEMENT,
  QUEUE_AUTH_URI,
  QUEUE_AUTH_VERSION,
} from '@warpath/shared';
import type {
  ChatMessageRequest,
  ChatSessionRequest,
  ProfileUpdateRequest,
  QueueRequest,
  QueueCancelRequest,
} from '@warpath/shared';

interface VerifiedQueueAuth {
  address: `0x${string}`;
}

interface VerifiedCancelAuth {
  address: `0x${string}`;
}

interface VerifiedProfileAuth {
  address: `0x${string}`;
}

interface VerifiedChatAuth {
  address: `0x${string}`;
}

interface VerifiedChatSessionAuth {
  address: `0x${string}`;
}

function parseQueueMessage(message: string): {
  tokenId: number;
  country: string;
  issuedAt: string;
} {
  const lines = message.split('\n');
  const [statement, tokenLine, countryLine, issuedAtLine, uriLine, versionLine] =
    lines;

  if (
    statement !== QUEUE_AUTH_STATEMENT ||
    !tokenLine?.startsWith('Token ID: ') ||
    !countryLine?.startsWith('Country: ') ||
    !issuedAtLine?.startsWith('Issued At: ') ||
    uriLine !== `URI: ${QUEUE_AUTH_URI}` ||
    versionLine !== `Version: ${QUEUE_AUTH_VERSION}`
  ) {
    throw new Error('Invalid queue authorization message');
  }

  const tokenId = Number(tokenLine.slice('Token ID: '.length));
  const country = countryLine.slice('Country: '.length);
  const issuedAt = issuedAtLine.slice('Issued At: '.length);

  if (!Number.isInteger(tokenId) || tokenId < 0 || country.length === 0) {
    throw new Error('Invalid queue authorization payload');
  }

  return { tokenId, country, issuedAt };
}

export async function verifyQueueAuth(
  request: QueueRequest
): Promise<VerifiedQueueAuth> {
  const parsed = parseQueueMessage(request.message);

  if (
    parsed.tokenId !== request.tokenId ||
    parsed.country !== request.country ||
    parsed.issuedAt !== request.issuedAt
  ) {
    throw new Error('Queue authorization payload mismatch');
  }

  const issuedAt = Date.parse(parsed.issuedAt);
  if (Number.isNaN(issuedAt)) {
    throw new Error('Invalid queue authorization timestamp');
  }

  const now = Date.now();
  if (Math.abs(now - issuedAt) > QUEUE_AUTH_MAX_AGE_MS) {
    throw new Error('Queue authorization expired');
  }

  let address: `0x${string}`;
  try {
    address = await recoverMessageAddress({
      message: request.message,
      signature: request.signature,
    });
  } catch {
    throw new Error('Invalid queue authorization signature');
  }

  return { address: getAddress(address) };
}

function parseCancelMessage(message: string): {
  queueId: string;
  issuedAt: string;
} {
  const lines = message.split('\n');
  const [statement, queueLine, issuedAtLine, uriLine, versionLine] = lines;

  if (
    statement !== QUEUE_CANCEL_AUTH_STATEMENT ||
    !queueLine?.startsWith('Queue ID: ') ||
    !issuedAtLine?.startsWith('Issued At: ') ||
    uriLine !== `URI: ${QUEUE_AUTH_URI}` ||
    versionLine !== `Version: ${QUEUE_AUTH_VERSION}`
  ) {
    throw new Error('Invalid queue cancellation authorization message');
  }

  const queueId = queueLine.slice('Queue ID: '.length);
  const issuedAt = issuedAtLine.slice('Issued At: '.length);

  if (!queueId) {
    throw new Error('Invalid queue cancellation payload');
  }

  return { queueId, issuedAt };
}

export async function verifyQueueCancelAuth(
  request: QueueCancelRequest
): Promise<VerifiedCancelAuth> {
  const parsed = parseCancelMessage(request.message);

  if (
    parsed.queueId !== request.queueId ||
    parsed.issuedAt !== request.issuedAt
  ) {
    throw new Error('Queue cancellation payload mismatch');
  }

  const issuedAt = Date.parse(parsed.issuedAt);
  if (Number.isNaN(issuedAt)) {
    throw new Error('Invalid queue cancellation timestamp');
  }

  const now = Date.now();
  if (Math.abs(now - issuedAt) > QUEUE_AUTH_MAX_AGE_MS) {
    throw new Error('Queue cancellation authorization expired');
  }

  let address: `0x${string}`;
  try {
    address = await recoverMessageAddress({
      message: request.message,
      signature: request.signature,
    });
  } catch {
    throw new Error('Invalid queue cancellation signature');
  }

  return { address: getAddress(address) };
}

function parseBooleanField(value: string): boolean {
  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  throw new Error('Invalid boolean authorization payload');
}

function deserializeOptionalField(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === '-' ? null : trimmed;
}

function parseProfileMessage(message: string): {
  address: string;
  displayName: string | null;
  avatarUrl: string | null;
  statusMessage: string | null;
  showBattleResults: boolean;
  showChatPresence: boolean;
  issuedAt: string;
} {
  const lines = message.split('\n');
  const [
    statement,
    addressLine,
    displayNameLine,
    avatarLine,
    statusLine,
    battleResultsLine,
    chatPresenceLine,
    issuedAtLine,
    uriLine,
    versionLine,
  ] = lines;

  if (
    statement !== PROFILE_UPDATE_AUTH_STATEMENT ||
    !addressLine?.startsWith('Address: ') ||
    !displayNameLine?.startsWith('Display Name: ') ||
    !avatarLine?.startsWith('Avatar URL: ') ||
    !statusLine?.startsWith('Status Message: ') ||
    !battleResultsLine?.startsWith('Show Battle Results: ') ||
    !chatPresenceLine?.startsWith('Show Chat Presence: ') ||
    !issuedAtLine?.startsWith('Issued At: ') ||
    uriLine !== `URI: ${QUEUE_AUTH_URI}` ||
    versionLine !== `Version: ${QUEUE_AUTH_VERSION}`
  ) {
    throw new Error('Invalid profile authorization message');
  }

  return {
    address: addressLine.slice('Address: '.length),
    displayName: deserializeOptionalField(
      displayNameLine.slice('Display Name: '.length)
    ),
    avatarUrl: deserializeOptionalField(avatarLine.slice('Avatar URL: '.length)),
    statusMessage: deserializeOptionalField(
      statusLine.slice('Status Message: '.length)
    ),
    showBattleResults: parseBooleanField(
      battleResultsLine.slice('Show Battle Results: '.length)
    ),
    showChatPresence: parseBooleanField(
      chatPresenceLine.slice('Show Chat Presence: '.length)
    ),
    issuedAt: issuedAtLine.slice('Issued At: '.length),
  };
}

export async function verifyProfileUpdateAuth(
  request: ProfileUpdateRequest
): Promise<VerifiedProfileAuth> {
  const parsed = parseProfileMessage(request.message);

  if (
    parsed.address !== request.address ||
    parsed.displayName !== request.displayName ||
    parsed.avatarUrl !== request.avatarUrl ||
    parsed.statusMessage !== request.statusMessage ||
    parsed.showBattleResults !== request.showBattleResults ||
    parsed.showChatPresence !== request.showChatPresence ||
    parsed.issuedAt !== request.issuedAt
  ) {
    throw new Error('Profile authorization payload mismatch');
  }

  const issuedAt = Date.parse(parsed.issuedAt);
  if (Number.isNaN(issuedAt)) {
    throw new Error('Invalid profile authorization timestamp');
  }

  const now = Date.now();
  if (Math.abs(now - issuedAt) > QUEUE_AUTH_MAX_AGE_MS) {
    throw new Error('Profile authorization expired');
  }

  let address: `0x${string}`;
  try {
    address = await recoverMessageAddress({
      message: request.message,
      signature: request.signature,
    });
  } catch {
    throw new Error('Invalid profile authorization signature');
  }

  return { address: getAddress(address) };
}

function parseGlobalChatMessage(message: string): {
  body: string;
  issuedAt: string;
} {
  const lines = message.split('\n');
  const [statement, bodyLine, issuedAtLine, uriLine, versionLine] = lines;

  if (
    statement !== GLOBAL_CHAT_AUTH_STATEMENT ||
    !bodyLine?.startsWith('Body: ') ||
    !issuedAtLine?.startsWith('Issued At: ') ||
    uriLine !== `URI: ${QUEUE_AUTH_URI}` ||
    versionLine !== `Version: ${QUEUE_AUTH_VERSION}`
  ) {
    throw new Error('Invalid global chat authorization message');
  }

  const body = bodyLine.slice('Body: '.length);
  const issuedAt = issuedAtLine.slice('Issued At: '.length);

  if (!body.trim()) {
    throw new Error('Invalid global chat payload');
  }

  return { body, issuedAt };
}

export async function verifyGlobalChatAuth(
  request: ChatMessageRequest
): Promise<VerifiedChatAuth> {
  const parsed = parseGlobalChatMessage(request.message);

  if (parsed.body !== request.body || parsed.issuedAt !== request.issuedAt) {
    throw new Error('Global chat payload mismatch');
  }

  const issuedAt = Date.parse(parsed.issuedAt);
  if (Number.isNaN(issuedAt)) {
    throw new Error('Invalid global chat timestamp');
  }

  const now = Date.now();
  if (Math.abs(now - issuedAt) > QUEUE_AUTH_MAX_AGE_MS) {
    throw new Error('Global chat authorization expired');
  }

  let address: `0x${string}`;
  try {
    address = await recoverMessageAddress({
      message: request.message,
      signature: request.signature,
    });
  } catch {
    throw new Error('Invalid global chat signature');
  }

  return { address: getAddress(address) };
}

function parseChatSessionMessage(message: string): {
  address: string;
  issuedAt: string;
} {
  const lines = message.split('\n');
  const [statement, addressLine, issuedAtLine, uriLine, versionLine] = lines;

  if (
    statement !== CHAT_SESSION_AUTH_STATEMENT ||
    !addressLine?.startsWith('Address: ') ||
    !issuedAtLine?.startsWith('Issued At: ') ||
    uriLine !== `URI: ${QUEUE_AUTH_URI}` ||
    versionLine !== `Version: ${QUEUE_AUTH_VERSION}`
  ) {
    throw new Error('Invalid chat session authorization message');
  }

  return {
    address: addressLine.slice('Address: '.length),
    issuedAt: issuedAtLine.slice('Issued At: '.length),
  };
}

export async function verifyChatSessionAuth(
  request: ChatSessionRequest
): Promise<VerifiedChatSessionAuth> {
  const parsed = parseChatSessionMessage(request.message);

  if (
    parsed.address !== request.address ||
    parsed.issuedAt !== request.issuedAt
  ) {
    throw new Error('Chat session authorization payload mismatch');
  }

  const issuedAt = Date.parse(parsed.issuedAt);
  if (Number.isNaN(issuedAt)) {
    throw new Error('Invalid chat session authorization timestamp');
  }

  const now = Date.now();
  if (Math.abs(now - issuedAt) > QUEUE_AUTH_MAX_AGE_MS) {
    throw new Error('Chat session authorization expired');
  }

  let address: `0x${string}`;
  try {
    address = await recoverMessageAddress({
      message: request.message,
      signature: request.signature,
    });
  } catch {
    throw new Error('Invalid chat session authorization signature');
  }

  const normalizedAddress = getAddress(address);
  if (normalizedAddress !== getAddress(request.address)) {
    throw new Error('Chat session signer mismatch');
  }

  return { address: normalizedAddress };
}
