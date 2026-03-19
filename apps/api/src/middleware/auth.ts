import { getAddress, recoverMessageAddress } from 'viem';
import {
  QUEUE_AUTH_MAX_AGE_MS,
  QUEUE_AUTH_STATEMENT,
  QUEUE_AUTH_URI,
  QUEUE_AUTH_VERSION,
} from '@warpath/shared';
import type { QueueRequest } from '@warpath/shared';

interface VerifiedQueueAuth {
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
