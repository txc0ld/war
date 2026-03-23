import { getAddress } from 'viem';
import { publicClient } from '../lib/contract';

const ENS_CACHE_TTL_MS = 10 * 60 * 1000;

interface EnsCacheEntry {
  expiresAt: number;
  value: string | null;
}

const ensCache = new Map<string, EnsCacheEntry>();

function readEnsCache(address: string): string | null | undefined {
  const entry = ensCache.get(address);

  if (!entry) {
    return undefined;
  }

  if (entry.expiresAt <= Date.now()) {
    ensCache.delete(address);
    return undefined;
  }

  return entry.value;
}

function writeEnsCache(address: string, value: string | null): string | null {
  ensCache.set(address, {
    value,
    expiresAt: Date.now() + ENS_CACHE_TTL_MS,
  });

  return value;
}

async function resolveEnsName(address: string): Promise<string | null> {
  const normalizedAddress = getAddress(address);
  const cachedValue = readEnsCache(normalizedAddress);

  if (cachedValue !== undefined) {
    return cachedValue;
  }

  try {
    const ensName = await publicClient.getEnsName({
      address: normalizedAddress,
    });

    return writeEnsCache(normalizedAddress, ensName?.trim() || null);
  } catch {
    return writeEnsCache(normalizedAddress, null);
  }
}

export async function getEnsNamesByAddress(
  addresses: string[]
): Promise<Map<string, string | null>> {
  const normalizedAddresses = Array.from(
    new Set(addresses.map((address) => getAddress(address)))
  );

  const entries = await Promise.all(
    normalizedAddresses.map(async (address) => [
      address,
      await resolveEnsName(address),
    ] as const)
  );

  return new Map(entries);
}
