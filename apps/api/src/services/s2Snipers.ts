import { getAddress } from 'viem';
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import { DEADSHOT_ABI, DEADSHOT_CONTRACT_ADDRESS } from '@warpath/shared';
import type { SniperMetadata } from '@warpath/shared';
import { AppError } from '../lib/errors';

const rpcUrl = process.env['RPC_URL'] ?? undefined;

const client = createPublicClient({
  chain: mainnet,
  transport: http(rpcUrl),
});

// ── Dev mock snipers ────────────────────────────────────────────────────────
// When S2_DEV_MOCK_SNIPERS=true, every wallet "owns" the mock set below.
// Two snipers — one cyan, one red — so testers can pick distinct loadouts.
// Safe to enable in production only when the site is gated (e.g. password gate),
// since it lets ANY signer queue with these token ids.
const DEV_MOCK_ENABLED = process.env['S2_DEV_MOCK_SNIPERS'] === 'true';

const MOCK_SNIPERS: SniperMetadata[] = [
  {
    tokenId: 1,
    name: 'Operator Alpha',
    image: '',
    skin: 'desert',
    scopeReticle: 'crosshair',
    killEffect: 'default',
    tracerColor: '#00f0ff',
    inspectAnimation: 'default',
  },
  {
    tokenId: 2,
    name: 'Operator Bravo',
    image: '',
    skin: 'arctic',
    scopeReticle: 'mil-dot',
    killEffect: 'default',
    tracerColor: '#ff3333',
    inspectAnimation: 'default',
  },
];
const MOCK_TOKEN_IDS = new Set(MOCK_SNIPERS.map((s) => s.tokenId));

interface RawNftMetadata {
  name?: string;
  image?: string;
  attributes?: Array<{ trait_type?: string; value?: string }>;
}

interface AlchemyOwnedNft {
  tokenId?: string;
  id?: { tokenId?: string };
}

interface AlchemyOwnedNftsResponse {
  ownedNfts?: AlchemyOwnedNft[];
  pageKey?: string;
}

function normalizeIpfsUrl(value: string): string {
  return value.startsWith('ipfs://')
    ? value.replace('ipfs://', 'https://ipfs.io/ipfs/')
    : value;
}

function getAttribute(
  attributes: Array<{ trait_type?: string; value?: string }>,
  traitType: string,
  fallback: string
): string {
  const attr = attributes.find((a) => a.trait_type === traitType);
  return attr?.value ?? fallback;
}

export function parseSniperMetadata(
  tokenId: number,
  raw: RawNftMetadata
): SniperMetadata {
  const attributes = raw.attributes ?? [];

  return {
    tokenId,
    name: raw.name ?? `Sniper #${tokenId}`,
    image: raw.image ? normalizeIpfsUrl(raw.image) : '',
    skin: getAttribute(attributes, 'skin', 'default'),
    scopeReticle: getAttribute(attributes, 'scope_reticle', 'crosshair'),
    killEffect: getAttribute(attributes, 'kill_effect', 'default'),
    tracerColor: getAttribute(attributes, 'tracer_color', '#FFFFFF'),
    inspectAnimation: getAttribute(attributes, 'inspect_animation', 'default'),
  };
}

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
    const apiKey = v2Index >= 0 ? segments[v2Index + 1] : segments.at(-1);

    return apiKey
      ? `${parsed.protocol}//${parsed.host}/nft/v3/${apiKey}`
      : null;
  } catch {
    return null;
  }
}

function parseTokenId(value: string | undefined): number | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = BigInt(value);
    return parsed <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(parsed) : null;
  } catch {
    return null;
  }
}

export async function getOwnedSniperTokenIds(
  address: `0x${string}`
): Promise<number[]> {
  const baseUrl = getAlchemyNftApiBaseUrl();
  if (!baseUrl) {
    throw new AppError(
      503,
      'SNIPER_INDEX_UNAVAILABLE',
      'Sniper ownership index is not configured'
    );
  }

  const tokenIds: number[] = [];
  let pageKey: string | undefined;

  do {
    const url = new URL(`${baseUrl}/getNFTsForOwner`);
    url.searchParams.set('owner', address);
    url.searchParams.append('contractAddresses[]', DEADSHOT_CONTRACT_ADDRESS);
    url.searchParams.set('withMetadata', 'false');

    if (pageKey) {
      url.searchParams.set('pageKey', pageKey);
    }

    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new AppError(
        503,
        'SNIPER_INDEX_UNAVAILABLE',
        `Alchemy ownership lookup failed with ${response.status}`
      );
    }

    const payload = (await response.json()) as AlchemyOwnedNftsResponse;
    const pageTokenIds =
      payload.ownedNfts
        ?.map((nft) => parseTokenId(nft.tokenId ?? nft.id?.tokenId))
        .filter((id): id is number => id !== null) ?? [];

    tokenIds.push(...pageTokenIds);
    pageKey = payload.pageKey ?? undefined;
  } while (pageKey);

  return Array.from(new Set(tokenIds));
}

async function fetchSniperMetadata(tokenId: number): Promise<SniperMetadata> {
  try {
    const uri = await client.readContract({
      address: DEADSHOT_CONTRACT_ADDRESS,
      abi: DEADSHOT_ABI,
      functionName: 'tokenURI',
      args: [BigInt(tokenId)],
    });

    const response = await fetch(normalizeIpfsUrl(uri as string));
    if (response.ok) {
      const raw = (await response.json()) as RawNftMetadata;
      return parseSniperMetadata(tokenId, raw);
    }
  } catch {
    // Fall through to defaults
  }

  return parseSniperMetadata(tokenId, {});
}

const SNIPER_CACHE_TTL_MS = 10 * 60 * 1000;

interface CacheEntry {
  expiresAt: number;
  value: SniperMetadata;
}

const sniperCache = new Map<number, CacheEntry>();

export async function getSniperMetadata(
  tokenId: number
): Promise<SniperMetadata> {
  const cached = sniperCache.get(tokenId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const metadata = await fetchSniperMetadata(tokenId);

  sniperCache.set(tokenId, {
    expiresAt: Date.now() + SNIPER_CACHE_TTL_MS,
    value: metadata,
  });

  return metadata;
}

export async function getSnipersForAddress(
  address: `0x${string}`
): Promise<SniperMetadata[]> {
  if (DEV_MOCK_ENABLED) {
    return MOCK_SNIPERS;
  }
  const tokenIds = await getOwnedSniperTokenIds(address);
  return Promise.all(tokenIds.map((id) => getSniperMetadata(id)));
}

export async function verifySniperOwnership(
  address: `0x${string}`,
  tokenId: number
): Promise<boolean> {
  if (DEV_MOCK_ENABLED) {
    return MOCK_TOKEN_IDS.has(tokenId);
  }
  try {
    const owner = await client.readContract({
      address: DEADSHOT_CONTRACT_ADDRESS,
      abi: DEADSHOT_ABI,
      functionName: 'ownerOf',
      args: [BigInt(tokenId)],
    });

    return getAddress(owner as string) === getAddress(address);
  } catch {
    return false;
  }
}
