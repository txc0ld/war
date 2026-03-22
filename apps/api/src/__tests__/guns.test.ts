import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const readContractMock = vi.fn();
const multicallMock = vi.fn();
const fetchMock = vi.fn<typeof fetch>();
const ownershipSnapshots = new Map<string, SnapshotRow>();

type SnapshotRow = {
  address: string;
  tokenIds: number[];
  gunCount: number;
  source: string;
  syncedAt: Date;
  updatedAt: Date;
};

vi.mock('viem', async () => {
  const actual = await vi.importActual<typeof import('viem')>('viem');

  return {
    ...actual,
    createPublicClient: () => ({
      readContract: readContractMock,
      multicall: multicallMock,
    }),
    http: () => ({}) as ReturnType<typeof actual.http>,
  };
});

vi.mock('viem/chains', () => ({
  mainnet: {},
}));

vi.mock('drizzle-orm', async () => {
  const actual = await vi.importActual<typeof import('drizzle-orm')>('drizzle-orm');
  return {
    ...actual,
    eq: (_column: unknown, value: string) => value,
  };
});

vi.mock('../db/schema', () => ({
  ownershipSnapshots: {
    address: 'address',
  },
}));

vi.mock('../db/client', () => ({
  db: {
    insert: () => ({
      values: (values: SnapshotRow) => ({
        onConflictDoUpdate: async ({
          set,
        }: {
          set?: Partial<SnapshotRow>;
        }) => {
          ownershipSnapshots.set(values.address, {
            ...values,
            ...set,
          });
        },
      }),
    }),
    select: () => ({
      from: () => ({
        where: (address: string) => ({
          limit: async () => {
            const snapshot = ownershipSnapshots.get(address);
            return snapshot ? [snapshot] : [];
          },
        }),
      }),
    }),
  },
}));

describe('guns service', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    ownershipSnapshots.clear();
    process.env.RPC_URL = 'https://eth-mainnet.g.alchemy.com/v2/test-alchemy-key';
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.ALCHEMY_API_KEY;
    delete process.env.RPC_URL;
  });

  it('falls back to Alchemy ownership lookup for non-enumerable contracts', async () => {
    readContractMock
      .mockResolvedValueOnce(2n)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce('ipfs://token-11')
      .mockResolvedValueOnce('ipfs://token-42');

    fetchMock.mockImplementation(async (input) => {
      const url = String(input);

      if (url.includes('/getNFTsForOwner')) {
        expect(url).toContain('/nft/v3/test-alchemy-key/getNFTsForOwner');
        expect(url).toContain(
          'contractAddresses%5B%5D=0x08189e5fd59ceaac75bfc3ce134066f204a6f609'
        );

        return new Response(
          JSON.stringify({
            ownedNfts: [{ tokenId: '11' }, { tokenId: '0x2a' }],
          }),
          { status: 200 }
        );
      }

      if (url === 'https://ipfs.io/ipfs/token-11') {
        return new Response(
          JSON.stringify({
            name: 'Gun #11',
            image: 'ipfs://image-11',
            attributes: [{ trait_type: 'Type', value: 'Legendary' }],
          }),
          { status: 200 }
        );
      }

      if (url === 'https://ipfs.io/ipfs/token-42') {
        return new Response(
          JSON.stringify({
            name: 'Gun #42',
            image: 'https://cdn.example.com/42.png',
            attributes: [{ trait_type: 'Type', value: 'Jammy Pasty' }],
          }),
          { status: 200 }
        );
      }

      throw new Error(`Unexpected fetch URL: ${url}`);
    });

    const { getGunsForAddress } = await import('../services/guns');
    const guns = await getGunsForAddress(
      '0x000000000000000000000000000000000000dEaD'
    );

    expect(multicallMock).not.toHaveBeenCalled();
    expect(guns).toHaveLength(2);
    expect(guns[0]).toMatchObject({
      tokenId: 11,
      name: 'Lyra gatekeeper',
      image: 'https://ipfs.io/ipfs/image-11',
      traits: ['Legendary'],
      canBattle: true,
    });
    expect(guns[1]).toMatchObject({
      tokenId: 42,
      name: 'Cargo',
      image: 'https://cdn.example.com/42.png',
      traits: ['Jammy Pasty'],
      canBattle: false,
    });
    expect(
      ownershipSnapshots.get('0x000000000000000000000000000000000000dead')
    ).toBeUndefined();
  });

  it('falls back to a recent ownership snapshot when Alchemy is unavailable', async () => {
    ownershipSnapshots.set('0x000000000000000000000000000000000000dead', {
      address: '0x000000000000000000000000000000000000dead',
      tokenIds: [11, 42],
      gunCount: 2,
      source: 'alchemy',
      syncedAt: new Date(),
      updatedAt: new Date(),
    });

    readContractMock
      .mockResolvedValueOnce(2n)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce('ipfs://token-11')
      .mockResolvedValueOnce('ipfs://token-42');

    fetchMock.mockImplementation(async (input) => {
      const url = String(input);

      if (url.includes('/getNFTsForOwner')) {
        return new Response(JSON.stringify({ error: 'upstream unavailable' }), {
          status: 503,
        });
      }

      if (url === 'https://ipfs.io/ipfs/token-11') {
        return new Response(
          JSON.stringify({
            name: 'Gun #11',
            image: 'https://cdn.example.com/11.png',
            attributes: [],
          }),
          { status: 200 }
        );
      }

      if (url === 'https://ipfs.io/ipfs/token-42') {
        return new Response(
          JSON.stringify({
            name: 'Gun #42',
            image: 'https://cdn.example.com/42.png',
            attributes: [],
          }),
          { status: 200 }
        );
      }

      throw new Error(`Unexpected fetch URL: ${url}`);
    });

    const { getGunsForAddress } = await import('../services/guns');
    const guns = await getGunsForAddress(
      '0x000000000000000000000000000000000000dEaD'
    );

    const alchemyCall = fetchMock.mock.calls.find(([input]) =>
      String(input).includes('/getNFTsForOwner')
    );

    expect(alchemyCall).toBeDefined();
    expect(guns.map((gun) => gun.tokenId)).toEqual([11, 42]);
  });

  it('surfaces a 503 when neither Alchemy nor a recent snapshot is available', async () => {
    readContractMock.mockResolvedValueOnce(2n).mockResolvedValueOnce(false);

    fetchMock.mockImplementation(async (input) => {
      const url = String(input);

      if (url.includes('/getNFTsForOwner')) {
        return new Response(JSON.stringify({ error: 'upstream unavailable' }), {
          status: 503,
        });
      }

      throw new Error(`Unexpected fetch URL: ${url}`);
    });

    const { getGunsForAddress } = await import('../services/guns');

    await expect(
      getGunsForAddress('0x000000000000000000000000000000000000dEaD')
    ).rejects.toMatchObject({
      statusCode: 503,
      code: 'OWNERSHIP_INDEX_UNAVAILABLE',
    });
  });
});
