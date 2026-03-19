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

export const BATTLE_CONFIG = {
  MAX_HP: 100,
  MIN_TICKS: 20,
  MAX_TICKS: 40,
  STAT_FLUCTUATION: 0.15,
  STAT_SALT: '0xWARPATH',
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
] as const;
