export const GN_CONTRACT_ADDRESS = '0x08189e5fd59ceaac75bfc3ce134066f204a6f609' as const;

export const CHAIN_IDS = {
  MAINNET: 1,
  BASE: 8453,
} as const;

export const POINTS = {
  WIN: 100,
  LOSS: -100,
  THREE_GUN_MULTIPLIER: 1.10,
} as const;

export const BATTLE_ENGINE_VERSION = 'v3-drand-rng-only' as const;

export const DRAND_QUICKNET = {
  chainHash:
    '52db9ba70e0cc0f6eaf7803dd07447a1f5477735fd3f661792ba94600c84e971',
  publicKey:
    '83cf0f2896adee7eb8b5f01fcad3912212c437e0073e911fb90022d3e760183c8c4b450b6a0a6c3ac6a5776a2d1064510d1fec758c921cc22b0e17e63aaf4bcb5ed66304de9cf809bd274ca73bab4af5a6e9c76a4bc09e76eae8991ef5ece45a',
  genesisTime: 1692803367,
  periodSeconds: 3,
  relays: [
    'https://api.drand.sh',
    'https://drand.cloudflare.com',
    'https://api.drand.secureweb3.com:6875',
  ],
} as const;

export const BATTLE_CONFIG = {
  MAX_HP: 100,
  MIN_TICKS: 20,
  MAX_TICKS: 40,
  STAT_FLUCTUATION: 0.15,
  STAT_SALT: '0xWARPATH',
  BASE_WIN_CHANCE: 0.5,
  ARSENAL_WIN_CHANCE_BONUS: 0.05,
  ATTACK_DODGE_CHANCE: 0.12,
  ATTACK_CRIT_CHANCE: 0.08,
  ATTACK_DAMAGE_MIN: 6,
  ATTACK_DAMAGE_MAX: 16,
  FUTURE_DRAND_OFFSET_SECONDS: 5,
  RESOLUTION_STALE_MS: 30_000,
} as const;

export const GN_ABI = [
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'index', type: 'uint256' },
    ],
    name: 'tokenOfOwnerByIndex',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'ownerOf',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'tokenURI',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'interfaceId', type: 'bytes4' }],
    name: 'supportsInterface',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;
