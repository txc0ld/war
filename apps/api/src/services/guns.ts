import { eq } from 'drizzle-orm';
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import {
  GN_ABI,
  GN_CONTRACT_ADDRESS,
  getStatsForToken,
  resolveGunName,
} from '@warpath/shared';
import type { GunMetadata } from '@warpath/shared';
import { db } from '../db/client';
import { ownershipSnapshots } from '../db/schema';
import { AppError } from '../lib/errors';

const rpcUrl = process.env['RPC_URL'] ?? undefined;

const client = createPublicClient({
  chain: mainnet,
  transport: http(rpcUrl),
});

const ADDRESS_CACHE_TTL_MS = 60_000;
const TOKEN_CACHE_TTL_MS = 10 * 60_000;
const OWNERSHIP_SNAPSHOT_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const METADATA_CONCURRENCY = 5;

interface TokenMetadataResponse {
  name?: string;
  image?: string;
  attributes?: Array<{ trait_type?: string; value?: string }>;
}

interface AlchemyOwnedNft {
  tokenId?: string;
  id?: {
    tokenId?: string;
  };
}

interface AlchemyOwnedNftsResponse {
  ownedNfts?: AlchemyOwnedNft[];
  pageKey?: string;
}

interface CacheEntry<T> {
  expiresAt: number;
  value: T;
}

const addressCache = new Map<string, CacheEntry<GunMetadata[]>>();
const tokenCache = new Map<number, CacheEntry<GunMetadata>>();

function getAlchemyNftApiBaseUrl(): string | null {
  const explicitApiKey = process.env['ALCHEMY_API_KEY']?.trim();
  if (explicitApiKey) {
    return `https://eth-mainnet.g.alchemy.com/nft/v3/${explicitApiKey}`;
  }

  if (!rpcUrl) {
    return null;
  }

  try {
    const parsed = new URL(rpcUrl);
    if (!parsed.hostname.includes('alchemy.com')) {
      return null;
    }

    const segments = parsed.pathname.split('/').filter(Boolean);
    const v2Index = segments.findIndex((segment) => segment === 'v2');
    const apiKey =
      v2Index >= 0 ? segments[v2Index + 1] : segments.at(-1);

    if (!apiKey) {
      return null;
    }

    return `${parsed.protocol}//${parsed.host}/nft/v3/${apiKey}`;
  } catch {
    return null;
  }
}

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

function parseTokenId(value: string | undefined): number | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = value.startsWith('0x') ? BigInt(value) : BigInt(value);
    if (parsed > BigInt(Number.MAX_SAFE_INTEGER)) {
      return null;
    }

    return Number(parsed);
  } catch {
    return null;
  }
}

async function getOwnedTokenIdsViaAlchemy(
  address: `0x${string}`,
  expectedCount: number
): Promise<number[]> {
  const baseUrl = getAlchemyNftApiBaseUrl();
  if (!baseUrl) {
    throw new Error('Alchemy NFT API is not configured for non-enumerable ownership lookups');
  }

  const tokenIds: number[] = [];
  let pageKey: string | undefined;

  do {
    const url = new URL(`${baseUrl}/getNFTsForOwner`);
    url.searchParams.set('owner', address);
    url.searchParams.append('contractAddresses[]', GN_CONTRACT_ADDRESS);
    url.searchParams.set('withMetadata', 'false');

    if (pageKey) {
      url.searchParams.set('pageKey', pageKey);
    }

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Alchemy ownership lookup failed with ${response.status}`);
    }

    const payload = (await response.json()) as AlchemyOwnedNftsResponse;
    const pageTokenIds =
      payload.ownedNfts
        ?.map((nft) => parseTokenId(nft.tokenId ?? nft.id?.tokenId))
        .filter((tokenId): tokenId is number => tokenId !== null) ?? [];

    tokenIds.push(...pageTokenIds);
    pageKey = payload.pageKey ?? undefined;
  } while (pageKey && tokenIds.length < expectedCount);

  return Array.from(new Set(tokenIds)).slice(0, expectedCount);
}

function normalizeOwnerAddress(address: string): string {
  return address.toLowerCase();
}

function sanitizeTokenIds(tokenIds: number[], expectedCount: number): number[] {
  const uniqueTokenIds = Array.from(new Set(tokenIds)).sort((a, b) => a - b);

  if (uniqueTokenIds.length !== expectedCount) {
    throw new Error(
      `Ownership index returned ${uniqueTokenIds.length} token(s), expected ${expectedCount}`
    );
  }

  return uniqueTokenIds;
}

async function getOwnedTokenIdsFromSnapshot(
  address: string,
  expectedCount: number
): Promise<number[] | null> {
  const normalizedAddress = normalizeOwnerAddress(address);
  const [snapshot] = await db
    .select()
    .from(ownershipSnapshots)
    .where(eq(ownershipSnapshots.address, normalizedAddress))
    .limit(1);

  if (!snapshot) {
    return null;
  }

  if (snapshot.gunCount !== expectedCount) {
    return null;
  }

  if (
    Date.now() - snapshot.syncedAt.getTime() >
    OWNERSHIP_SNAPSHOT_MAX_AGE_MS
  ) {
    return null;
  }

  const tokenIds = Array.isArray(snapshot.tokenIds)
    ? snapshot.tokenIds
        .map((value) =>
          typeof value === 'number'
            ? value
            : typeof value === 'string'
              ? parseTokenId(value)
              : null
        )
        .filter((tokenId): tokenId is number => tokenId !== null)
    : [];

  return sanitizeTokenIds(tokenIds, expectedCount);
}

async function supportsOwnerEnumeration(): Promise<boolean | null> {
  try {
    const supported = await client.readContract({
      address: GN_CONTRACT_ADDRESS,
      abi: [
        {
          inputs: [{ name: 'interfaceId', type: 'bytes4' }],
          name: 'supportsInterface',
          outputs: [{ name: '', type: 'bool' }],
          stateMutability: 'view',
          type: 'function',
        },
      ] as const,
      functionName: 'supportsInterface',
      args: ['0x780e9d63'],
    });

    return Boolean(supported);
  } catch {
    return null;
  }
}

async function getOwnedTokenIdsViaEnumeration(
  address: `0x${string}`,
  count: number
): Promise<number[]> {
  const tokenIdResults = await client.multicall({
    contracts: Array.from({ length: count }, (_, index) => ({
      address: GN_CONTRACT_ADDRESS,
      abi: GN_ABI,
      functionName: 'tokenOfOwnerByIndex' as const,
      args: [address, BigInt(index)] as const,
    })),
    allowFailure: true,
  });

  if (tokenIdResults.some((result) => result.status !== 'success')) {
    throw new Error('Owner enumeration is not available for this contract');
  }

  return sanitizeTokenIds(
    tokenIdResults.map((result) => Number(result.result)),
    count
  );
}

async function getOwnedTokenIds(
  address: `0x${string}`,
  count: number
): Promise<number[]> {
  const enumerationSupport = await supportsOwnerEnumeration();

  if (enumerationSupport === false) {
    try {
      return sanitizeTokenIds(await getOwnedTokenIdsViaAlchemy(address, count), count);
    } catch {
      const snapshotTokenIds = await getOwnedTokenIdsFromSnapshot(address, count);
      if (snapshotTokenIds) {
        return snapshotTokenIds;
      }

      throw new AppError(
        503,
        'OWNERSHIP_INDEX_UNAVAILABLE',
        'Gun ownership index is temporarily unavailable',
        false
      );
    }
  }

  try {
    return await getOwnedTokenIdsViaEnumeration(address, count);
  } catch {
    try {
      return sanitizeTokenIds(await getOwnedTokenIdsViaAlchemy(address, count), count);
    } catch {
      const snapshotTokenIds = await getOwnedTokenIdsFromSnapshot(address, count);
      if (snapshotTokenIds) {
        return snapshotTokenIds;
      }

      throw new AppError(
        503,
        'OWNERSHIP_INDEX_UNAVAILABLE',
        'Gun ownership index is temporarily unavailable',
        false
      );
    }
  }
}

async function fetchTokenMetadata(tokenId: number): Promise<GunMetadata> {
  const cached = getCachedValue(tokenCache, tokenId);
  if (cached) {
    return cached;
  }

  let name = resolveGunName(tokenId);
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

      name = resolveGunName(tokenId, metadata.name);
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

  const tokenIds = await getOwnedTokenIds(address, count);

  const guns = await mapWithConcurrency(
    tokenIds,
    METADATA_CONCURRENCY,
    (tokenId) => fetchTokenMetadata(tokenId)
  );

  return setCachedValue(addressCache, normalizedAddress, guns, ADDRESS_CACHE_TTL_MS);
}

export async function getGunCountForAddress(
  address: `0x${string}`
): Promise<number> {
  const normalizedAddress = address.toLowerCase();
  const cached = getCachedValue(addressCache, normalizedAddress);
  if (cached) {
    return cached.length;
  }

  const balance = await client.readContract({
    address: GN_CONTRACT_ADDRESS,
    abi: GN_ABI,
    functionName: 'balanceOf',
    args: [address],
  });

  return Number(balance);
}

export async function getGunMetadataByTokenId(
  tokenId: number
): Promise<GunMetadata> {
  return fetchTokenMetadata(tokenId);
}
