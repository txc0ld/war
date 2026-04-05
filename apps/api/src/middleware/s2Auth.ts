import { getAddress, recoverMessageAddress } from 'viem';
import {
  S2_QUEUE_AUTH_STATEMENT,
  S2_QUEUE_CANCEL_AUTH_STATEMENT,
  S2_AUTH_URI,
  S2_AUTH_VERSION,
  S2_QUEUE_AUTH_MAX_AGE_MS,
} from '@warpath/shared';
import type { S2QueueRequest, S2QueueCancelRequest } from '@warpath/shared';

interface VerifiedAuth {
  address: `0x${string}`;
}

function parseS2QueueMessage(message: string): {
  tokenId: number;
  issuedAt: string;
} {
  const lines = message.split('\n');
  const [statement, tokenLine, issuedAtLine, uriLine, versionLine] = lines;

  if (
    statement !== S2_QUEUE_AUTH_STATEMENT ||
    !tokenLine?.startsWith('Token ID: ') ||
    !issuedAtLine?.startsWith('Issued At: ') ||
    uriLine !== `URI: ${S2_AUTH_URI}` ||
    versionLine !== `Version: ${S2_AUTH_VERSION}`
  ) {
    throw new Error('Invalid Season 2 queue authorization message');
  }

  const tokenId = Number(tokenLine.slice('Token ID: '.length));
  const issuedAt = issuedAtLine.slice('Issued At: '.length);

  if (!Number.isInteger(tokenId) || tokenId < 0) {
    throw new Error('Invalid Season 2 queue authorization payload');
  }

  return { tokenId, issuedAt };
}

export async function verifyS2QueueAuth(
  request: S2QueueRequest
): Promise<VerifiedAuth> {
  const parsed = parseS2QueueMessage(request.message);

  if (
    parsed.tokenId !== request.tokenId ||
    parsed.issuedAt !== request.issuedAt
  ) {
    throw new Error('Season 2 queue authorization payload mismatch');
  }

  const issuedAt = Date.parse(parsed.issuedAt);
  if (Number.isNaN(issuedAt)) {
    throw new Error('Invalid Season 2 queue authorization timestamp');
  }

  if (Math.abs(Date.now() - issuedAt) > S2_QUEUE_AUTH_MAX_AGE_MS) {
    throw new Error('Season 2 queue authorization expired');
  }

  let address: `0x${string}`;
  try {
    address = await recoverMessageAddress({
      message: request.message,
      signature: request.signature,
    });
  } catch {
    throw new Error('Invalid Season 2 queue authorization signature');
  }

  return { address: getAddress(address) };
}

function parseS2QueueCancelMessage(message: string): {
  queueId: string;
  issuedAt: string;
} {
  const lines = message.split('\n');
  const [statement, queueLine, issuedAtLine, uriLine, versionLine] = lines;

  if (
    statement !== S2_QUEUE_CANCEL_AUTH_STATEMENT ||
    !queueLine?.startsWith('Queue ID: ') ||
    !issuedAtLine?.startsWith('Issued At: ') ||
    uriLine !== `URI: ${S2_AUTH_URI}` ||
    versionLine !== `Version: ${S2_AUTH_VERSION}`
  ) {
    throw new Error('Invalid Season 2 queue cancellation message');
  }

  return {
    queueId: queueLine.slice('Queue ID: '.length),
    issuedAt: issuedAtLine.slice('Issued At: '.length),
  };
}

export async function verifyS2QueueCancelAuth(
  request: S2QueueCancelRequest
): Promise<VerifiedAuth> {
  const parsed = parseS2QueueCancelMessage(request.message);

  if (
    parsed.queueId !== request.queueId ||
    parsed.issuedAt !== request.issuedAt
  ) {
    throw new Error('Season 2 queue cancellation payload mismatch');
  }

  const issuedAt = Date.parse(parsed.issuedAt);
  if (Number.isNaN(issuedAt)) {
    throw new Error('Invalid Season 2 queue cancellation timestamp');
  }

  if (Math.abs(Date.now() - issuedAt) > S2_QUEUE_AUTH_MAX_AGE_MS) {
    throw new Error('Season 2 queue cancellation authorization expired');
  }

  let address: `0x${string}`;
  try {
    address = await recoverMessageAddress({
      message: request.message,
      signature: request.signature,
    });
  } catch {
    throw new Error('Invalid Season 2 queue cancellation signature');
  }

  return { address: getAddress(address) };
}
