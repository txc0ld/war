// packages/shared/src/s2Constants.ts

// Placeholder until Gary deploys the sniper collection contract.
// Update this address once the contract is live on mainnet.
export const DEADSHOT_CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000' as const;

export const DEADSHOT_ABI = [
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'balanceOf',
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

export const S2_SCORING = {
  ROUND_WIN: 100,
  HEADSHOT_BONUS: 25,
  MATCH_WIN_BONUS: 150,
  ROUND_LOSS: 10,
} as const;

export const S2_MATCH_CONFIG = {
  ROUNDS_TO_WIN: 3,
  MAX_ROUNDS: 5,
  ROUND_DURATION_MS: 60_000,
  PLAYER_HP: 100,
  HEADSHOT_DAMAGE: 150,
  BODY_DAMAGE: 55,
  MAGAZINE_SIZE: 5,
  RELOAD_DURATION_MS: 3500,
  BOLT_CYCLE_MS: 1500,
  TICK_RATE: 20,
  // ── Movement ──
  MOVE_SPEED: 4.5,            // metres / second when standing
  CROUCH_MOVE_SPEED: 2.0,     // metres / second when crouched
  SCOPED_MOVE_SPEED: 1.5,     // movement speed reduction while scoped
  ARENA_HALF_WIDTH: 35,       // soft world bound on the X axis (m)
  ARENA_MIN_Z: -10,           // soft world bound on the Z axis (front)
  ARENA_MAX_Z: 75,            // soft world bound on the Z axis (back)
} as const;

export const S2_QUEUE_TTL_MS = 10 * 60 * 1000;

export const S2_GAME_SERVER_SECRET_HEADER = 'X-Deadshot-Server-Secret' as const;
