import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import {
  GN_ABI,
  GN_CONTRACT_ADDRESS,
  getStatsForToken,
} from '@warpath/shared';
import type { GunMetadata } from '@warpath/shared';

const rpcUrl = process.env['RPC_URL'] ?? undefined;

const client = createPublicClient({
  chain: mainnet,
  transport: http(rpcUrl),
});

const ADDRESS_CACHE_TTL_MS = 60_000;
const TOKEN_CACHE_TTL_MS = 10 * 60_000;
const METADATA_CONCURRENCY = 5;

interface TokenMetadataResponse {
  name?: string;
  image?: string;
  attributes?: Array<{ trait_type?: string; value?: string }>;
}

interface CacheEntry<T> {
  expiresAt: number;
  value: T;
}

const addressCache = new Map<string, CacheEntry<GunMetadata[]>>();
const tokenCache = new Map<number, CacheEntry<GunMetadata>>();

function getCachedValue<T>(
  cache: Map<string | number, CacheEntry<T>>,
  key: string | number
): T | null {
  const entry = cache.get(key);

  if (!entry) {
    return null;
  }

  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }

  return entry.value;
}

function setCachedValue<T>(
  cache: Map<string | number, CacheEntry<T>>,
  key: string | number,
  value: T,
  ttlMs: number
): T {
  cache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });

  return value;
}

function normalizeIpfsUrl(value: string): string {
  return value.startsWith('ipfs://')
    ? value.replace('ipfs://', 'https://ipfs.io/ipfs/')
    : value;
}

async function fetchTokenMetadata(tokenId: number): Promise<GunMetadata> {
  const cached = getCachedValue(tokenCache, tokenId);
  if (cached) {
    return cached;
  }

  let name = `Gun #${tokenId}`;
  let image = '';
  let traits: string[] = [];

  try {
    const uri = await client.readContract({
      address: GN_CONTRACT_ADDRESS,
      abi: GN_ABI,
      functionName: 'tokenURI',
      args: [BigInt(tokenId)],
    });

    const response = await fetch(normalizeIpfsUrl(uri as string));
    if (response.ok) {
      const metadata = (await response.json()) as TokenMetadataResponse;

      name = metadata.name ?? name;
      image = metadata.image ? normalizeIpfsUrl(metadata.image) : '';
      traits =
        metadata.attributes
          ?.map((attribute) => attribute.value)
          .filter((value): value is string => Boolean(value)) ?? [];
    }
  } catch {
    // Fall back to deterministic local defaults when metadata is unavailable.
  }

  const gunMetadata: GunMetadata = {
    tokenId,
    name,
    image,
    stats: getStatsForToken(tokenId),
    traits,
    canBattle: !traits.includes('Jammy Pasty'),
  };

  return setCachedValue(tokenCache, tokenId, gunMetadata, TOKEN_CACHE_TTL_MS);
}

async function mapWithConcurrency<T, R>(
  values: T[],
  limit: number,
  mapper: (value: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(values.length);

  for (let start = 0; start < values.length; start += limit) {
    const chunk = values.slice(start, start + limit);
    const chunkResults = await Promise.all(
      chunk.map((value, offset) => mapper(value, start + offset))
    );

    chunkResults.forEach((result, offset) => {
      results[start + offset] = result;
    });
  }

  return results;
}

export async function getGunsForAddress(
  address: `0x${string}`
): Promise<GunMetadata[]> {
  const normalizedAddress = address.toLowerCase();
  const cached = getCachedValue(addressCache, normalizedAddress);
  if (cached) {
    return cached;
  }

  const balance = await client.readContract({
    address: GN_CONTRACT_ADDRESS,
    abi: GN_ABI,
    functionName: 'balanceOf',
    args: [address],
  });

  const count = Number(balance);
  if (count === 0) {
    return setCachedValue(addressCache, normalizedAddress, [], ADDRESS_CACHE_TTL_MS);
  }

  const tokenIdResults = await client.multicall({
    contracts: Array.from({ length: count }, (_, index) => ({
      address: GN_CONTRACT_ADDRESS,
      abi: GN_ABI,
      functionName: 'tokenOfOwnerByIndex' as const,
      args: [address, BigInt(index)] as const,
    })),
    allowFailure: true,
  });

  const tokenIds = tokenIdResults
    .filter((result) => result.status === 'success')
    .map((result) => Number(result.result));

  const guns = await mapWithConcurrency(
    tokenIds,
    METADATA_CONCURRENCY,
    (tokenId) => fetchTokenMetadata(tokenId)
  );

  return setCachedValue(addressCache, normalizedAddress, guns, ADDRESS_CACHE_TTL_MS);
}

export async function getGunMetadataByTokenId(
  tokenId: number
): Promise<GunMetadata> {
  return fetchTokenMetadata(tokenId);
}
