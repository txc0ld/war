# Deadshot Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Season 2 backend foundation — shared types, DB schema, sniper NFT ownership, matchmaking queue, scoring, leaderboard, killfeed, and API routes — so the game server and frontend have a complete platform layer to build on.

**Architecture:** Extend the existing monorepo. New shared types/constants in `packages/shared`. New `s2_` prefixed DB tables via Drizzle. New Season 2 services and routes in `apps/api` following existing patterns exactly (Zod validation, AppError codes, wallet-sig auth). Season 1 matchmaking disabled; leaderboard archived.

**Tech Stack:** TypeScript, Hono, Drizzle ORM, PostgreSQL, viem, Zod, Vitest

**Design spec:** `docs/superpowers/specs/2026-04-05-deadshot-season2-integration-design.md`

---

### Task 1: Season 2 Shared Types

**Files:**
- Create: `packages/shared/src/s2Types.ts`
- Modify: `packages/shared/src/index.ts`

- [ ] **Step 1: Create `s2Types.ts` with all Season 2 type definitions**

```typescript
// packages/shared/src/s2Types.ts

export interface SniperMetadata {
  tokenId: number;
  name: string;
  image: string;
  skin: string;
  scopeReticle: string;
  killEffect: string;
  tracerColor: string;
  inspectAnimation: string;
}

export interface S2PlayerStats {
  address: string;
  score: number;
  elo: number;
  wins: number;
  losses: number;
  headshotKills: number;
  totalKills: number;
  sniperCount: number;
}

export interface S2LeaderboardEntry extends S2PlayerStats {
  rank: number;
  headshotPct: number;
  winStreak: number;
  displayName: string | null;
  ensName: string | null;
}

export interface S2RoundResult {
  round: number;
  winner: 0 | 1 | null;
  killerHeadshot: boolean;
  player0Hp: number;
  player1Hp: number;
  durationMs: number;
}

export type S2BattleStatus = 'pending' | 'active' | 'resolved' | 'failed';

export interface S2BattleFighter {
  address: string;
  tokenId: number;
  name: string;
  skin: string;
  scopeReticle: string;
  killEffect: string;
  tracerColor: string;
}

interface S2BattleBase {
  id: string;
  status: S2BattleStatus;
  roomId: string | null;
  left: S2BattleFighter;
  right: S2BattleFighter;
  createdAt: string;
  resolvedAt: string | null;
}

export interface S2ResolvedBattle extends S2BattleBase {
  status: 'resolved';
  winner: 'left' | 'right';
  leftScore: number;
  rightScore: number;
  roundsWonLeft: number;
  roundsWonRight: number;
  rounds: S2RoundResult[];
}

export interface S2PendingBattle extends S2BattleBase {
  status: 'pending' | 'active';
  winner: null;
  leftScore: null;
  rightScore: null;
  roundsWonLeft: null;
  roundsWonRight: null;
  rounds: null;
}

export interface S2FailedBattle extends S2BattleBase {
  status: 'failed';
  winner: null;
  leftScore: null;
  rightScore: null;
  roundsWonLeft: null;
  roundsWonRight: null;
  rounds: null;
}

export type S2Battle = S2ResolvedBattle | S2PendingBattle | S2FailedBattle;

export interface S2QueueAuthPayload {
  tokenId: number;
  issuedAt: string;
}

export interface S2QueueRequest extends S2QueueAuthPayload {
  message: string;
  signature: `0x${string}`;
}

export interface S2QueueJoinResponse {
  queueId: string;
  status: 'queued';
  statusToken: string;
}

export interface S2QueueStatusRequest {
  queueId: string;
  statusToken: string;
}

interface S2QueueStatusBase {
  queueId: string;
}

export interface S2QueueStatusWaiting extends S2QueueStatusBase {
  status: 'waiting';
  expiresAt: string;
}

export interface S2QueueStatusExpired extends S2QueueStatusBase {
  status: 'expired';
  expiredAt: string;
}

export interface S2QueueStatusCancelled extends S2QueueStatusBase {
  status: 'cancelled';
  cancelledAt: string;
}

export interface S2QueueStatusMatched extends S2QueueStatusBase {
  status: 'matched';
  battleId: string;
  battleStatus: S2BattleStatus;
  roomId: string | null;
  gameServerUrl: string | null;
  roomToken: string | null;
  opponent: {
    address: string;
    tokenId: number;
  };
}

export type S2QueueStatus =
  | S2QueueStatusWaiting
  | S2QueueStatusExpired
  | S2QueueStatusCancelled
  | S2QueueStatusMatched;

export interface S2QueueCancelAuthPayload {
  queueId: string;
  issuedAt: string;
}

export interface S2QueueCancelRequest extends S2QueueCancelAuthPayload {
  message: string;
  signature: `0x${string}`;
}

export interface S2QueueCancelResponse {
  queueId: string;
  status: 'cancelled';
  cancelledAt: string;
}

export interface S2SnipersResponse {
  snipers: SniperMetadata[];
}

export interface S2KillfeedEntry {
  battleId: string;
  winnerAddress: string;
  loserAddress: string;
  winnerTokenId: number;
  loserTokenId: number;
  winnerSniperName: string;
  loserSniperName: string;
  winnerImageUrl: string;
  loserImageUrl: string;
  headshot: boolean;
  winnerProfile: {
    displayName: string | null;
    ensName: string | null;
    avatarUrl: string | null;
  };
  loserProfile: {
    displayName: string | null;
    ensName: string | null;
    avatarUrl: string | null;
  };
  resolvedAt: string;
}

export interface S2KillfeedResponse {
  entries: S2KillfeedEntry[];
}

export interface S2MatchResult {
  winner: 0 | 1;
  rounds: S2RoundResult[];
  leftScore: number;
  rightScore: number;
}

export interface S2GameServerMatchReport {
  battleId: string;
  secret: string;
  result: S2MatchResult;
}
```

- [ ] **Step 2: Add re-exports to `packages/shared/src/index.ts`**

Add this line at the end of `packages/shared/src/index.ts`:

```typescript
export * from './s2Types.js';
export * from './s2Constants.js';
export * from './s2Auth.js';
```

- [ ] **Step 3: Build shared package and verify it compiles**

Run: `cd /Users/txdm_/.codex/warpath && pnpm --filter @warpath/shared build`
Expected: Clean build with no errors (will fail until s2Constants.ts and s2Auth.ts exist — created in next tasks)

- [ ] **Step 4: Commit**

```bash
git add packages/shared/src/s2Types.ts packages/shared/src/index.ts
git commit -m "feat: add Season 2 (Deadshot) shared type definitions"
```

---

### Task 2: Season 2 Shared Constants

**Files:**
- Create: `packages/shared/src/s2Constants.ts`

- [ ] **Step 1: Create `s2Constants.ts` with all Season 2 config**

```typescript
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
} as const;

export const S2_QUEUE_TTL_MS = 10 * 60 * 1000;

export const S2_GAME_SERVER_SECRET_HEADER = 'X-Deadshot-Server-Secret' as const;
```

- [ ] **Step 2: Build shared package and verify**

Run: `cd /Users/txdm_/.codex/warpath && pnpm --filter @warpath/shared build`
Expected: Will still fail because s2Auth.ts doesn't exist yet. Continue to next task.

- [ ] **Step 3: Commit**

```bash
git add packages/shared/src/s2Constants.ts
git commit -m "feat: add Season 2 shared constants and scoring config"
```

---

### Task 3: Season 2 Auth Message Builders

**Files:**
- Create: `packages/shared/src/s2Auth.ts`
- Create: `packages/shared/src/__tests__/s2Auth.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// packages/shared/src/__tests__/s2Auth.test.ts
import { describe, expect, it } from 'vitest';
import {
  createS2QueueAuthMessage,
  createS2QueueCancelMessage,
  S2_QUEUE_AUTH_STATEMENT,
  S2_QUEUE_CANCEL_AUTH_STATEMENT,
  S2_AUTH_URI,
  S2_AUTH_VERSION,
} from '../s2Auth';

describe('createS2QueueAuthMessage', () => {
  it('builds a structured message with token ID and timestamp', () => {
    const message = createS2QueueAuthMessage({
      tokenId: 42,
      issuedAt: '2026-04-05T00:00:00.000Z',
    });

    expect(message).toBe(
      [
        S2_QUEUE_AUTH_STATEMENT,
        'Token ID: 42',
        'Issued At: 2026-04-05T00:00:00.000Z',
        `URI: ${S2_AUTH_URI}`,
        `Version: ${S2_AUTH_VERSION}`,
      ].join('\n')
    );
  });
});

describe('createS2QueueCancelMessage', () => {
  it('builds a structured message with queue ID and timestamp', () => {
    const message = createS2QueueCancelMessage({
      queueId: 'abc-123',
      issuedAt: '2026-04-05T00:00:00.000Z',
    });

    expect(message).toBe(
      [
        S2_QUEUE_CANCEL_AUTH_STATEMENT,
        'Queue ID: abc-123',
        'Issued At: 2026-04-05T00:00:00.000Z',
        `URI: ${S2_AUTH_URI}`,
        `Version: ${S2_AUTH_VERSION}`,
      ].join('\n')
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/txdm_/.codex/warpath/packages/shared && npx vitest run src/__tests__/s2Auth.test.ts`
Expected: FAIL — module `../s2Auth` not found

- [ ] **Step 3: Implement `s2Auth.ts`**

```typescript
// packages/shared/src/s2Auth.ts
import type { S2QueueAuthPayload, S2QueueCancelAuthPayload } from './s2Types.js';

export const S2_QUEUE_AUTH_STATEMENT = 'DEADSHOT Queue Authorization' as const;
export const S2_QUEUE_CANCEL_AUTH_STATEMENT = 'DEADSHOT Queue Cancellation' as const;
export const S2_AUTH_URI = 'https://warroom.gg' as const;
export const S2_AUTH_VERSION = '1' as const;
export const S2_QUEUE_AUTH_MAX_AGE_MS = 5 * 60 * 1000;

export function createS2QueueAuthMessage(payload: S2QueueAuthPayload): string {
  return [
    S2_QUEUE_AUTH_STATEMENT,
    `Token ID: ${payload.tokenId}`,
    `Issued At: ${payload.issuedAt}`,
    `URI: ${S2_AUTH_URI}`,
    `Version: ${S2_AUTH_VERSION}`,
  ].join('\n');
}

export function createS2QueueCancelMessage(
  payload: S2QueueCancelAuthPayload
): string {
  return [
    S2_QUEUE_CANCEL_AUTH_STATEMENT,
    `Queue ID: ${payload.queueId}`,
    `Issued At: ${payload.issuedAt}`,
    `URI: ${S2_AUTH_URI}`,
    `Version: ${S2_AUTH_VERSION}`,
  ].join('\n');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/txdm_/.codex/warpath/packages/shared && npx vitest run src/__tests__/s2Auth.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Update shared package exports and build**

Add `s2Auth` to the `exports` map in `packages/shared/package.json`:

```json
"./s2Auth": {
  "types": "./dist/s2Auth.d.ts",
  "import": "./dist/s2Auth.js",
  "require": "./dist/s2Auth.cjs"
}
```

Add `s2Auth` to the `exports` map in `packages/shared/package.json` alongside the existing entries:

```json
"./s2Types": {
  "types": "./dist/s2Types.d.ts",
  "import": "./dist/s2Types.js",
  "require": "./dist/s2Types.cjs"
},
"./s2Constants": {
  "types": "./dist/s2Constants.d.ts",
  "import": "./dist/s2Constants.js",
  "require": "./dist/s2Constants.cjs"
},
"./s2Auth": {
  "types": "./dist/s2Auth.d.ts",
  "import": "./dist/s2Auth.js",
  "require": "./dist/s2Auth.cjs"
}
```

Add the new entry files to `packages/shared/tsup.config.ts`. The entry array should become:

```typescript
entry: [
  'src/index.ts',
  'src/types.ts',
  'src/constants.ts',
  'src/auth.ts',
  'src/gunNames.ts',
  'src/stats.ts',
  'src/s2Types.ts',
  'src/s2Constants.ts',
  'src/s2Auth.ts',
],
```

Run: `cd /Users/txdm_/.codex/warpath && pnpm --filter @warpath/shared build`
Expected: Clean build with all exports

- [ ] **Step 6: Commit**

```bash
git add packages/shared/src/s2Auth.ts packages/shared/src/__tests__/s2Auth.test.ts packages/shared/package.json packages/shared/tsup.config.ts
git commit -m "feat: add Season 2 auth message builders with tests"
```

---

### Task 4: Season 2 Database Schema

**Files:**
- Modify: `apps/api/src/db/schema.ts`

- [ ] **Step 1: Add Season 2 tables to the Drizzle schema**

Append the following to `apps/api/src/db/schema.ts`:

```typescript
// ── Season 2: Deadshot ──────────────────────────────────────────────

export const s2Players = pgTable(
  's2_players',
  {
    address: text('address').primaryKey(),
    score: integer('score').notNull().default(0),
    elo: integer('elo').notNull().default(1000),
    wins: integer('wins').notNull().default(0),
    losses: integer('losses').notNull().default(0),
    headshotKills: integer('headshot_kills').notNull().default(0),
    totalKills: integer('total_kills').notNull().default(0),
    sniperCount: integer('sniper_count').notNull().default(0),
    winStreak: integer('win_streak').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [index('idx_s2_leaderboard').on(table.score)]
);

export const s2Queue = pgTable(
  's2_queue',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    address: text('address').notNull(),
    tokenId: integer('token_id').notNull(),
    statusToken: text('status_token').notNull(),
    status: text('status').notNull().default('waiting'),
    battleId: uuid('battle_id'),
    expiresAt: timestamp('expires_at').notNull(),
    matchedAt: timestamp('matched_at'),
    cancelledAt: timestamp('cancelled_at'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    index('idx_s2_queue_waiting').on(table.status),
    index('idx_s2_queue_active_lookup').on(
      table.address,
      table.status,
      table.expiresAt
    ),
    uniqueIndex('s2_queue_status_token_unique').on(table.statusToken),
  ]
);

export const s2Battles = pgTable(
  's2_battles',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    leftAddress: text('left_address')
      .notNull()
      .references(() => s2Players.address),
    leftToken: integer('left_token').notNull(),
    rightAddress: text('right_address')
      .notNull()
      .references(() => s2Players.address),
    rightToken: integer('right_token').notNull(),
    status: text('status').notNull().default('pending'),
    winner: text('winner'),
    leftScore: integer('left_score'),
    rightScore: integer('right_score'),
    roundsWonLeft: integer('rounds_won_left'),
    roundsWonRight: integer('rounds_won_right'),
    roundsJson: jsonb('rounds_json'),
    roomId: text('room_id'),
    roomTokenLeft: text('room_token_left'),
    roomTokenRight: text('room_token_right'),
    createdAt: timestamp('created_at').defaultNow(),
    resolvedAt: timestamp('resolved_at'),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    index('idx_s2_battles_status').on(table.status),
    index('idx_s2_battles_resolved').on(table.resolvedAt),
  ]
);

export const s2Snipers = pgTable('s2_snipers', {
  tokenId: integer('token_id').primaryKey(),
  name: text('name'),
  image: text('image'),
  skin: text('skin'),
  scopeReticle: text('scope_reticle'),
  killEffect: text('kill_effect'),
  tracerColor: text('tracer_color'),
  inspectAnim: text('inspect_anim'),
  owner: text('owner'),
  cachedAt: timestamp('cached_at').defaultNow(),
});
```

- [ ] **Step 2: Generate Drizzle migration**

Run: `cd /Users/txdm_/.codex/warpath/apps/api && npx drizzle-kit generate --config drizzle.config.ts`
Expected: New migration file in `apps/api/drizzle/` creating the four `s2_*` tables

- [ ] **Step 3: Verify migration SQL looks correct**

Read the generated migration file. It should contain `CREATE TABLE s2_players`, `CREATE TABLE s2_queue`, `CREATE TABLE s2_battles`, `CREATE TABLE s2_snipers`, plus all indexes.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/db/schema.ts apps/api/drizzle/
git commit -m "feat: add Season 2 database schema (s2_players, s2_battles, s2_queue, s2_snipers)"
```

---

### Task 5: Season 2 Sniper Ownership & Metadata Service

**Files:**
- Create: `apps/api/src/services/s2Snipers.ts`
- Create: `apps/api/src/__tests__/s2Snipers.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// apps/api/src/__tests__/s2Snipers.test.ts
import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock the DB and contract clients before importing the service
vi.mock('../db/client', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    onConflictDoUpdate: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../lib/contract', () => ({
  publicClient: {
    readContract: vi.fn(),
  },
}));

import { parseSniperMetadata } from '../services/s2Snipers';

describe('parseSniperMetadata', () => {
  it('extracts cosmetic attributes from NFT metadata JSON', () => {
    const raw = {
      name: 'Arctic Hunter',
      image: 'ipfs://Qm.../arctic.png',
      attributes: [
        { trait_type: 'skin', value: 'Arctic Camo' },
        { trait_type: 'scope_reticle', value: 'Mil-dot' },
        { trait_type: 'kill_effect', value: 'Ember Burst' },
        { trait_type: 'tracer_color', value: '#FF4444' },
        { trait_type: 'inspect_animation', value: 'Spin' },
      ],
    };

    const result = parseSniperMetadata(42, raw);

    expect(result).toEqual({
      tokenId: 42,
      name: 'Arctic Hunter',
      image: 'https://ipfs.io/ipfs/Qm.../arctic.png',
      skin: 'Arctic Camo',
      scopeReticle: 'Mil-dot',
      killEffect: 'Ember Burst',
      tracerColor: '#FF4444',
      inspectAnimation: 'Spin',
    });
  });

  it('uses defaults for missing attributes', () => {
    const raw = {
      name: 'Basic Sniper',
      image: 'https://example.com/sniper.png',
      attributes: [],
    };

    const result = parseSniperMetadata(1, raw);

    expect(result.skin).toBe('default');
    expect(result.scopeReticle).toBe('crosshair');
    expect(result.killEffect).toBe('default');
    expect(result.tracerColor).toBe('#FFFFFF');
    expect(result.inspectAnimation).toBe('default');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/txdm_/.codex/warpath && pnpm --filter @warpath/shared build && cd apps/api && npx vitest run src/__tests__/s2Snipers.test.ts`
Expected: FAIL — module `../services/s2Snipers` not found

- [ ] **Step 3: Implement `s2Snipers.ts`**

```typescript
// apps/api/src/services/s2Snipers.ts
import { eq } from 'drizzle-orm';
import { createPublicClient, getAddress, http } from 'viem';
import { mainnet } from 'viem/chains';
import { DEADSHOT_ABI, DEADSHOT_CONTRACT_ADDRESS } from '@warpath/shared';
import type { SniperMetadata } from '@warpath/shared';
import { db } from '../db/client';
import { s2Snipers } from '../db/schema';
import { AppError } from '../lib/errors';

const rpcUrl = process.env['RPC_URL'] ?? undefined;

const client = createPublicClient({
  chain: mainnet,
  transport: http(rpcUrl),
});

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
  const tokenIds = await getOwnedSniperTokenIds(address);
  return Promise.all(tokenIds.map((id) => getSniperMetadata(id)));
}

export async function verifySniperOwnership(
  address: `0x${string}`,
  tokenId: number
): Promise<boolean> {
  try {
    const owner = await client.readContract({
      address: DEADSHOT_CONTRACT_ADDRESS,
      abi: DEADSHOT_ABI,
      functionName: 'ownerOf',
      args: [BigInt(tokenId)],
    });

    return getAddress(owner) === getAddress(address);
  } catch {
    return false;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/txdm_/.codex/warpath && pnpm --filter @warpath/shared build && cd apps/api && npx vitest run src/__tests__/s2Snipers.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/services/s2Snipers.ts apps/api/src/__tests__/s2Snipers.test.ts
git commit -m "feat: add Season 2 sniper ownership and metadata service"
```

---

### Task 6: Season 2 Player Service

**Files:**
- Create: `apps/api/src/services/s2Players.ts`

- [ ] **Step 1: Implement `s2Players.ts`**

```typescript
// apps/api/src/services/s2Players.ts
import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { s2Players } from '../db/schema';
import { getOwnedSniperTokenIds } from './s2Snipers';

export async function ensureS2Player(address: string): Promise<void> {
  await db.insert(s2Players).values({ address }).onConflictDoNothing();
}

export async function syncS2PlayerSniperCount(
  address: `0x${string}`
): Promise<number> {
  const tokenIds = await getOwnedSniperTokenIds(address);
  const sniperCount = tokenIds.length;

  await ensureS2Player(address);
  await db
    .update(s2Players)
    .set({ sniperCount, updatedAt: new Date() })
    .where(eq(s2Players.address, address));

  return sniperCount;
}

export async function getS2Player(
  address: string
): Promise<typeof s2Players.$inferSelect | null> {
  const [player] = await db
    .select()
    .from(s2Players)
    .where(eq(s2Players.address, address))
    .limit(1);

  return player ?? null;
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/services/s2Players.ts
git commit -m "feat: add Season 2 player service"
```

---

### Task 7: Season 2 Auth Middleware

**Files:**
- Create: `apps/api/src/middleware/s2Auth.ts`
- Create: `apps/api/src/__tests__/s2Auth.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// apps/api/src/__tests__/s2Auth.test.ts
import { describe, expect, it, vi } from 'vitest';

vi.mock('viem', async () => {
  const actual = await vi.importActual<typeof import('viem')>('viem');
  return {
    ...actual,
    recoverMessageAddress: vi.fn(),
    getAddress: actual.getAddress,
  };
});

import { recoverMessageAddress } from 'viem';
import { createS2QueueAuthMessage } from '@warpath/shared';
import { verifyS2QueueAuth } from '../middleware/s2Auth';

const mockedRecover = vi.mocked(recoverMessageAddress);

describe('verifyS2QueueAuth', () => {
  it('recovers address from valid signed queue request', async () => {
    const payload = { tokenId: 42, issuedAt: new Date().toISOString() };
    const message = createS2QueueAuthMessage(payload);
    const signature = '0xdeadbeef' as `0x${string}`;

    mockedRecover.mockResolvedValue('0x1234567890abcdef1234567890abcdef12345678');

    const result = await verifyS2QueueAuth({
      ...payload,
      message,
      signature,
    });

    expect(result.address).toBe('0x1234567890AbcdEF1234567890aBcdef12345678');
  });

  it('rejects expired messages', async () => {
    const staleDate = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const payload = { tokenId: 42, issuedAt: staleDate };
    const message = createS2QueueAuthMessage(payload);

    await expect(
      verifyS2QueueAuth({ ...payload, message, signature: '0xabc' as `0x${string}` })
    ).rejects.toThrow('expired');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/txdm_/.codex/warpath && pnpm --filter @warpath/shared build && cd apps/api && npx vitest run src/__tests__/s2Auth.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement `s2Auth.ts`**

```typescript
// apps/api/src/middleware/s2Auth.ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/txdm_/.codex/warpath && pnpm --filter @warpath/shared build && cd apps/api && npx vitest run src/__tests__/s2Auth.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/middleware/s2Auth.ts apps/api/src/__tests__/s2Auth.test.ts
git commit -m "feat: add Season 2 wallet signature auth middleware"
```

---

### Task 8: Season 2 Matchmaking Service

**Files:**
- Create: `apps/api/src/services/s2Matchmaking.ts`

- [ ] **Step 1: Implement `s2Matchmaking.ts`**

This follows the Season 1 matchmaking pattern but is simpler — no drand commitment, no cooldowns. When matched, it creates a battle row with status `pending` and generates room tokens for the game server.

```typescript
// apps/api/src/services/s2Matchmaking.ts
import { randomUUID } from 'node:crypto';
import { and, eq, isNull, lt, ne, sql } from 'drizzle-orm';
import type {
  S2QueueCancelResponse,
  S2QueueJoinResponse,
  S2QueueStatus,
  S2BattleStatus,
} from '@warpath/shared';
import { S2_QUEUE_TTL_MS } from '@warpath/shared';
import { db } from '../db/client';
import { s2Battles, s2Players, s2Queue } from '../db/schema';
import { AppError } from '../lib/errors';
import { ensureS2Player, syncS2PlayerSniperCount } from './s2Players';

const GAME_SERVER_URL = process.env['S2_GAME_SERVER_URL'] ?? null;

export async function joinS2Queue(
  address: string,
  tokenId: number
): Promise<S2QueueJoinResponse> {
  await ensureS2Player(address);
  await syncS2PlayerSniperCount(address as `0x${string}`);
  await expireStaleS2QueueEntries();

  const [activeEntry] = await db
    .select({ id: s2Queue.id })
    .from(s2Queue)
    .where(
      and(
        eq(s2Queue.address, address),
        eq(s2Queue.status, 'waiting'),
        isNull(s2Queue.battleId),
        sql`${s2Queue.expiresAt} > now()`
      )
    )
    .limit(1);

  if (activeEntry) {
    throw new AppError(
      409,
      'S2_QUEUE_ALREADY_ACTIVE',
      'Wallet already has an active Season 2 queue entry'
    );
  }

  const now = new Date();
  const statusToken = randomUUID();
  const [entry] = await db
    .insert(s2Queue)
    .values({
      address,
      tokenId,
      statusToken,
      status: 'waiting',
      expiresAt: new Date(now.getTime() + S2_QUEUE_TTL_MS),
      updatedAt: now,
    })
    .returning({ id: s2Queue.id, statusToken: s2Queue.statusToken });

  if (!entry) {
    throw new Error('Failed to create Season 2 queue entry');
  }

  await tryS2Match(entry.id, address);

  return {
    queueId: entry.id,
    status: 'queued',
    statusToken: entry.statusToken,
  };
}

async function tryS2Match(queueId: string, address: string): Promise<void> {
  await db.transaction(async (tx) => {
    const [currentEntry] = await tx
      .select()
      .from(s2Queue)
      .where(eq(s2Queue.id, queueId))
      .for('update')
      .limit(1);

    if (
      !currentEntry ||
      currentEntry.status !== 'waiting' ||
      currentEntry.battleId !== null ||
      currentEntry.expiresAt.getTime() <= Date.now()
    ) {
      return;
    }

    const [opponent] = await tx
      .select()
      .from(s2Queue)
      .where(
        and(
          eq(s2Queue.status, 'waiting'),
          isNull(s2Queue.battleId),
          ne(s2Queue.id, queueId),
          ne(s2Queue.address, address),
          sql`${s2Queue.expiresAt} > now()`
        )
      )
      .orderBy(s2Queue.createdAt)
      .for('update', { skipLocked: true })
      .limit(1);

    if (!opponent) {
      return;
    }

    const roomId = randomUUID();
    const roomTokenLeft = randomUUID();
    const roomTokenRight = randomUUID();

    const [battle] = await tx
      .insert(s2Battles)
      .values({
        leftAddress: currentEntry.address,
        leftToken: currentEntry.tokenId,
        rightAddress: opponent.address,
        rightToken: opponent.tokenId,
        status: 'pending',
        roomId,
        roomTokenLeft,
        roomTokenRight,
        updatedAt: new Date(),
      })
      .returning({ id: s2Battles.id });

    if (!battle) {
      throw new Error('Failed to create Season 2 battle');
    }

    const [currentUpdated] = await tx
      .update(s2Queue)
      .set({
        status: 'matched',
        battleId: battle.id,
        matchedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(s2Queue.id, currentEntry.id),
          eq(s2Queue.status, 'waiting'),
          isNull(s2Queue.battleId)
        )
      )
      .returning({ id: s2Queue.id });

    const [opponentUpdated] = await tx
      .update(s2Queue)
      .set({
        status: 'matched',
        battleId: battle.id,
        matchedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(s2Queue.id, opponent.id),
          eq(s2Queue.status, 'waiting'),
          isNull(s2Queue.battleId)
        )
      )
      .returning({ id: s2Queue.id });

    if (!currentUpdated || !opponentUpdated) {
      throw new Error('Season 2 queue resolution race detected');
    }
  });
}

export async function getS2QueueStatus(
  queueId: string,
  statusToken: string
): Promise<S2QueueStatus> {
  await expireStaleS2QueueEntries();

  const [entry] = await db
    .select()
    .from(s2Queue)
    .where(eq(s2Queue.id, queueId))
    .limit(1);

  if (!entry) {
    throw new AppError(404, 'S2_QUEUE_NOT_FOUND', 'Queue entry not found');
  }

  if (entry.statusToken !== statusToken) {
    throw new AppError(
      401,
      'S2_QUEUE_STATUS_TOKEN_INVALID',
      'Queue status token is invalid'
    );
  }

  if (entry.status === 'waiting') {
    await tryS2Match(queueId, entry.address);
  }

  const [refreshed] = await db
    .select()
    .from(s2Queue)
    .where(eq(s2Queue.id, queueId))
    .limit(1);

  if (!refreshed) {
    throw new AppError(404, 'S2_QUEUE_NOT_FOUND', 'Queue entry not found');
  }

  if (refreshed.status === 'cancelled') {
    return {
      status: 'cancelled',
      queueId: refreshed.id,
      cancelledAt:
        refreshed.cancelledAt?.toISOString() ?? new Date().toISOString(),
    };
  }

  if (refreshed.status === 'expired') {
    return {
      status: 'expired',
      queueId: refreshed.id,
      expiredAt:
        refreshed.updatedAt?.toISOString() ??
        refreshed.expiresAt.toISOString(),
    };
  }

  if (refreshed.status === 'waiting') {
    return {
      status: 'waiting',
      queueId: refreshed.id,
      expiresAt: refreshed.expiresAt.toISOString(),
    };
  }

  // Status is 'matched'
  const [battle] = await db
    .select()
    .from(s2Battles)
    .where(eq(s2Battles.id, refreshed.battleId!))
    .limit(1);

  const [opponentEntry] = await db
    .select()
    .from(s2Queue)
    .where(
      and(
        eq(s2Queue.battleId, refreshed.battleId!),
        ne(s2Queue.id, queueId)
      )
    )
    .limit(1);

  const isLeft = battle?.leftAddress === refreshed.address;
  const roomToken = isLeft
    ? battle?.roomTokenLeft
    : battle?.roomTokenRight;

  return {
    status: 'matched',
    queueId: refreshed.id,
    battleId: refreshed.battleId!,
    battleStatus: (battle?.status ?? 'pending') as S2BattleStatus,
    roomId: battle?.roomId ?? null,
    gameServerUrl: GAME_SERVER_URL,
    roomToken: roomToken ?? null,
    opponent: {
      address: opponentEntry?.address ?? '',
      tokenId: opponentEntry?.tokenId ?? 0,
    },
  };
}

export async function cancelS2Queue(
  queueId: string,
  address: string
): Promise<S2QueueCancelResponse> {
  await expireStaleS2QueueEntries();

  const [entry] = await db
    .select()
    .from(s2Queue)
    .where(eq(s2Queue.id, queueId))
    .limit(1);

  if (!entry) {
    throw new AppError(404, 'S2_QUEUE_NOT_FOUND', 'Queue entry not found');
  }

  if (entry.address.toLowerCase() !== address.toLowerCase()) {
    throw new AppError(
      403,
      'S2_QUEUE_ADDRESS_MISMATCH',
      'Queue entry does not belong to caller'
    );
  }

  if (
    entry.status !== 'waiting' ||
    entry.battleId !== null ||
    entry.expiresAt.getTime() <= Date.now()
  ) {
    throw new AppError(
      409,
      'S2_QUEUE_NOT_CANCELLABLE',
      'Queue entry is no longer cancellable'
    );
  }

  const [cancelled] = await db
    .update(s2Queue)
    .set({
      status: 'cancelled',
      cancelledAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(s2Queue.id, queueId),
        eq(s2Queue.status, 'waiting'),
        isNull(s2Queue.battleId),
        sql`${s2Queue.expiresAt} > now()`
      )
    )
    .returning({ id: s2Queue.id, cancelledAt: s2Queue.cancelledAt });

  if (!cancelled) {
    throw new AppError(
      409,
      'S2_QUEUE_NOT_CANCELLABLE',
      'Queue entry is no longer cancellable'
    );
  }

  return {
    queueId: cancelled.id,
    status: 'cancelled',
    cancelledAt:
      cancelled.cancelledAt?.toISOString() ?? new Date().toISOString(),
  };
}

async function expireStaleS2QueueEntries(): Promise<void> {
  await db
    .update(s2Queue)
    .set({ status: 'expired', updatedAt: new Date() })
    .where(
      and(
        eq(s2Queue.status, 'waiting'),
        isNull(s2Queue.battleId),
        lt(s2Queue.expiresAt, new Date())
      )
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/services/s2Matchmaking.ts
git commit -m "feat: add Season 2 matchmaking queue service"
```

---

### Task 9: Season 2 Scoring Service

**Files:**
- Create: `apps/api/src/services/s2Scoring.ts`
- Create: `apps/api/src/__tests__/s2Scoring.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// apps/api/src/__tests__/s2Scoring.test.ts
import { describe, expect, it } from 'vitest';
import { calculateMatchScores } from '../services/s2Scoring';

describe('calculateMatchScores', () => {
  it('awards round wins, match win bonus, and headshot bonus to winner', () => {
    const result = {
      winner: 0 as const,
      rounds: [
        { round: 1, winner: 0, killerHeadshot: true, player0Hp: 100, player1Hp: 0, durationMs: 15000 },
        { round: 2, winner: 1, killerHeadshot: false, player0Hp: 0, player1Hp: 45, durationMs: 30000 },
        { round: 3, winner: 0, killerHeadshot: false, player0Hp: 45, player1Hp: 0, durationMs: 25000 },
        { round: 4, winner: 0, killerHeadshot: true, player0Hp: 100, player1Hp: 0, durationMs: 10000 },
      ],
      leftScore: 0,
      rightScore: 0,
    };

    const scores = calculateMatchScores(result);

    // Player 0 (winner): 3 round wins (300) + 2 headshots (50) + match win (150) + 1 round loss (10) = 510
    // Wait, player 0 won rounds 1,3,4 and lost round 2
    // Round wins: 3 * 100 = 300
    // Headshot kills: 2 * 25 = 50
    // Match win bonus: 150
    // Round losses: 1 * 10 = 10
    // Total: 510
    expect(scores.player0Score).toBe(510);

    // Player 1 (loser): 1 round win (100) + 0 headshots + 0 match bonus + 3 round losses (30) = 130
    expect(scores.player1Score).toBe(130);
  });

  it('gives participation points for round losses', () => {
    const result = {
      winner: 0 as const,
      rounds: [
        { round: 1, winner: 0, killerHeadshot: false, player0Hp: 45, player1Hp: 0, durationMs: 40000 },
        { round: 2, winner: 0, killerHeadshot: false, player0Hp: 45, player1Hp: 0, durationMs: 35000 },
        { round: 3, winner: 0, killerHeadshot: false, player0Hp: 100, player1Hp: 0, durationMs: 20000 },
      ],
      leftScore: 0,
      rightScore: 0,
    };

    const scores = calculateMatchScores(result);

    // Player 1 (loser): 0 round wins + 3 round losses (30) = 30
    expect(scores.player1Score).toBe(30);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/txdm_/.codex/warpath && pnpm --filter @warpath/shared build && cd apps/api && npx vitest run src/__tests__/s2Scoring.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement `s2Scoring.ts`**

```typescript
// apps/api/src/services/s2Scoring.ts
import { eq, sql } from 'drizzle-orm';
import { S2_SCORING } from '@warpath/shared';
import type { S2MatchResult, S2RoundResult } from '@warpath/shared';
import { db } from '../db/client';
import { s2Battles, s2Players } from '../db/schema';

interface MatchScores {
  player0Score: number;
  player1Score: number;
  player0Headshots: number;
  player1Headshots: number;
  player0Kills: number;
  player1Kills: number;
}

export function calculateMatchScores(result: S2MatchResult): MatchScores {
  let player0Score = 0;
  let player1Score = 0;
  let player0Headshots = 0;
  let player1Headshots = 0;
  let player0Kills = 0;
  let player1Kills = 0;

  for (const round of result.rounds) {
    if (round.winner === 0) {
      player0Score += S2_SCORING.ROUND_WIN;
      player1Score += S2_SCORING.ROUND_LOSS;
      player0Kills++;
      if (round.killerHeadshot) {
        player0Score += S2_SCORING.HEADSHOT_BONUS;
        player0Headshots++;
      }
    } else if (round.winner === 1) {
      player1Score += S2_SCORING.ROUND_WIN;
      player0Score += S2_SCORING.ROUND_LOSS;
      player1Kills++;
      if (round.killerHeadshot) {
        player1Score += S2_SCORING.HEADSHOT_BONUS;
        player1Headshots++;
      }
    }
    // Draws (winner === null) award no points to either player
  }

  if (result.winner === 0) {
    player0Score += S2_SCORING.MATCH_WIN_BONUS;
  } else {
    player1Score += S2_SCORING.MATCH_WIN_BONUS;
  }

  return {
    player0Score,
    player1Score,
    player0Headshots,
    player1Headshots,
    player0Kills,
    player1Kills,
  };
}

export async function applyS2MatchResult(
  battleId: string,
  result: S2MatchResult
): Promise<void> {
  const [battle] = await db
    .select()
    .from(s2Battles)
    .where(eq(s2Battles.id, battleId))
    .limit(1);

  if (!battle || battle.status === 'resolved') {
    return;
  }

  const scores = calculateMatchScores(result);
  const winnerSide = result.winner === 0 ? 'left' : 'right';
  const winnerAddress =
    result.winner === 0 ? battle.leftAddress : battle.rightAddress;
  const loserAddress =
    result.winner === 0 ? battle.rightAddress : battle.leftAddress;

  const roundsWon0 = result.rounds.filter((r) => r.winner === 0).length;
  const roundsWon1 = result.rounds.filter((r) => r.winner === 1).length;

  await db.transaction(async (tx) => {
    await tx
      .update(s2Battles)
      .set({
        status: 'resolved',
        winner: winnerSide,
        leftScore: scores.player0Score,
        rightScore: scores.player1Score,
        roundsWonLeft: roundsWon0,
        roundsWonRight: roundsWon1,
        roundsJson: result.rounds as unknown as Record<string, unknown>,
        resolvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(s2Battles.id, battleId));

    // Update left player (player 0)
    await tx
      .update(s2Players)
      .set({
        score: sql`${s2Players.score} + ${scores.player0Score}`,
        wins: result.winner === 0
          ? sql`${s2Players.wins} + 1`
          : s2Players.wins,
        losses: result.winner === 1
          ? sql`${s2Players.losses} + 1`
          : s2Players.losses,
        headshotKills: sql`${s2Players.headshotKills} + ${scores.player0Headshots}`,
        totalKills: sql`${s2Players.totalKills} + ${scores.player0Kills}`,
        winStreak: result.winner === 0
          ? sql`${s2Players.winStreak} + 1`
          : sql`0`,
        updatedAt: new Date(),
      })
      .where(eq(s2Players.address, battle.leftAddress));

    // Update right player (player 1)
    await tx
      .update(s2Players)
      .set({
        score: sql`${s2Players.score} + ${scores.player1Score}`,
        wins: result.winner === 1
          ? sql`${s2Players.wins} + 1`
          : s2Players.wins,
        losses: result.winner === 0
          ? sql`${s2Players.losses} + 1`
          : s2Players.losses,
        headshotKills: sql`${s2Players.headshotKills} + ${scores.player1Headshots}`,
        totalKills: sql`${s2Players.totalKills} + ${scores.player1Kills}`,
        winStreak: result.winner === 1
          ? sql`${s2Players.winStreak} + 1`
          : sql`0`,
        updatedAt: new Date(),
      })
      .where(eq(s2Players.address, battle.rightAddress));
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/txdm_/.codex/warpath && pnpm --filter @warpath/shared build && cd apps/api && npx vitest run src/__tests__/s2Scoring.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/services/s2Scoring.ts apps/api/src/__tests__/s2Scoring.test.ts
git commit -m "feat: add Season 2 scoring service with match result application"
```

---

### Task 10: Season 2 Leaderboard Service

**Files:**
- Create: `apps/api/src/services/s2Leaderboard.ts`

- [ ] **Step 1: Implement `s2Leaderboard.ts`**

```typescript
// apps/api/src/services/s2Leaderboard.ts
import { desc, gt, or, sql } from 'drizzle-orm';
import { db } from '../db/client';
import { s2Players } from '../db/schema';
import { getProfilesByAddress } from './profiles';
import type { S2LeaderboardEntry } from '@warpath/shared';

interface S2LeaderboardResponse {
  entries: S2LeaderboardEntry[];
  total: number;
}

export async function getS2Leaderboard(
  limit = 50,
  offset = 0
): Promise<S2LeaderboardResponse> {
  const hasCombatRecord = or(gt(s2Players.wins, 0), gt(s2Players.losses, 0));

  const rows = await db
    .select()
    .from(s2Players)
    .where(hasCombatRecord)
    .orderBy(desc(s2Players.score))
    .limit(limit)
    .offset(offset);

  const profilesByAddress = await getProfilesByAddress(
    rows.map((row) => row.address)
  );

  const entries: S2LeaderboardEntry[] = rows.map((row, i) => {
    const profile = profilesByAddress.get(row.address);
    const totalShots = row.totalKills;
    const headshotPct =
      totalShots > 0
        ? Number(((row.headshotKills / totalShots) * 100).toFixed(1))
        : 0;

    return {
      rank: offset + i + 1,
      address: row.address,
      score: row.score,
      elo: row.elo,
      wins: row.wins,
      losses: row.losses,
      headshotKills: row.headshotKills,
      totalKills: row.totalKills,
      sniperCount: row.sniperCount,
      headshotPct,
      winStreak: row.winStreak,
      displayName: profile?.displayName ?? null,
      ensName: profile?.ensName ?? null,
    };
  });

  const totals = await db
    .select({ count: sql<number>`count(*)` })
    .from(s2Players)
    .where(hasCombatRecord);
  const total = Number(totals[0]?.count ?? 0);

  return { entries, total };
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/services/s2Leaderboard.ts
git commit -m "feat: add Season 2 leaderboard service"
```

---

### Task 11: Season 2 Killfeed Service

**Files:**
- Create: `apps/api/src/services/s2Killfeed.ts`

- [ ] **Step 1: Implement `s2Killfeed.ts`**

```typescript
// apps/api/src/services/s2Killfeed.ts
import { desc, eq } from 'drizzle-orm';
import type { S2KillfeedEntry, S2RoundResult } from '@warpath/shared';
import { db } from '../db/client';
import { s2Battles } from '../db/schema';
import { getSniperMetadata } from './s2Snipers';
import { getProfilesByAddress } from './profiles';

export async function getS2Killfeed(
  limit = 25
): Promise<S2KillfeedEntry[]> {
  const rows = await db
    .select()
    .from(s2Battles)
    .where(eq(s2Battles.status, 'resolved'))
    .orderBy(desc(s2Battles.resolvedAt))
    .limit(limit);

  const profileMap = await getProfilesByAddress(
    rows.flatMap((row) => [row.leftAddress, row.rightAddress])
  );

  return Promise.all(
    rows
      .filter((row) => row.winner !== null)
      .map(async (row) => {
        const winnerIsLeft = row.winner === 'left';
        const winnerAddress = winnerIsLeft
          ? row.leftAddress
          : row.rightAddress;
        const loserAddress = winnerIsLeft
          ? row.rightAddress
          : row.leftAddress;
        const winnerTokenId = winnerIsLeft
          ? row.leftToken
          : row.rightToken;
        const loserTokenId = winnerIsLeft
          ? row.rightToken
          : row.leftToken;

        const [winnerSniper, loserSniper] = await Promise.all([
          getSniperMetadata(winnerTokenId),
          getSniperMetadata(loserTokenId),
        ]);

        const rounds = (row.roundsJson ?? []) as S2RoundResult[];
        const lastRound = rounds.at(-1);
        const headshot = lastRound?.killerHeadshot ?? false;

        const winnerProfile = profileMap.get(winnerAddress);
        const loserProfile = profileMap.get(loserAddress);

        return {
          battleId: row.id,
          winnerAddress,
          loserAddress,
          winnerTokenId,
          loserTokenId,
          winnerSniperName: winnerSniper.name,
          loserSniperName: loserSniper.name,
          winnerImageUrl: winnerSniper.image,
          loserImageUrl: loserSniper.image,
          headshot,
          winnerProfile: {
            displayName: winnerProfile?.displayName ?? null,
            ensName: winnerProfile?.ensName ?? null,
            avatarUrl: winnerProfile?.avatarUrl ?? null,
          },
          loserProfile: {
            displayName: loserProfile?.displayName ?? null,
            ensName: loserProfile?.ensName ?? null,
            avatarUrl: loserProfile?.avatarUrl ?? null,
          },
          resolvedAt:
            row.resolvedAt?.toISOString() ?? new Date().toISOString(),
        } satisfies S2KillfeedEntry;
      })
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/services/s2Killfeed.ts
git commit -m "feat: add Season 2 killfeed service"
```

---

### Task 12: Season 2 API Routes

**Files:**
- Create: `apps/api/src/routes/s2Battles.ts`
- Create: `apps/api/src/routes/s2Leaderboard.ts`
- Create: `apps/api/src/routes/s2Snipers.ts`
- Create: `apps/api/src/routes/s2Killfeed.ts`
- Create: `apps/api/src/routes/s2Results.ts`
- Modify: `apps/api/src/index.ts`

- [ ] **Step 1: Create `s2Battles.ts` — queue routes**

```typescript
// apps/api/src/routes/s2Battles.ts
import { Hono } from 'hono';
import { z } from 'zod';
import type { S2QueueRequest, S2QueueCancelRequest, S2QueueStatusRequest } from '@warpath/shared';
import { joinS2Queue, getS2QueueStatus, cancelS2Queue } from '../services/s2Matchmaking';
import { verifyS2QueueAuth, verifyS2QueueCancelAuth } from '../middleware/s2Auth';
import { verifySniperOwnership } from '../services/s2Snipers';
import { AppError } from '../lib/errors';
import { validateJson, validateParams } from '../middleware/validate';

const app = new Hono();

const queueRequestSchema = z.object({
  tokenId: z.coerce.number().int().nonnegative(),
  issuedAt: z.string().min(1),
  message: z.string().min(1),
  signature: z.string().regex(/^0x[0-9a-fA-F]+$/, 'must be a hex signature'),
});

const queueParamsSchema = z.object({
  queueId: z.string().uuid(),
});

const queueCancelRequestSchema = z.object({
  queueId: z.string().uuid(),
  issuedAt: z.string().min(1),
  message: z.string().min(1),
  signature: z.string().regex(/^0x[0-9a-fA-F]+$/, 'must be a hex signature'),
});

const queueStatusRequestSchema = z.object({
  queueId: z.string().uuid(),
  statusToken: z.string().uuid(),
});

app.post('/queue', async (c) => {
  const body = (await validateJson(c, queueRequestSchema)) as S2QueueRequest;

  let verified;
  try {
    verified = await verifyS2QueueAuth(body);
  } catch (error) {
    throw new AppError(
      401,
      'S2_QUEUE_AUTH_INVALID',
      error instanceof Error ? error.message : 'Invalid authorization'
    );
  }

  const ownsToken = await verifySniperOwnership(verified.address, body.tokenId);
  if (!ownsToken) {
    throw new AppError(
      403,
      'S2_TOKEN_OWNERSHIP_MISMATCH',
      'Signer does not own the queued sniper'
    );
  }

  const result = await joinS2Queue(verified.address, body.tokenId);
  return c.json(result, 201);
});

app.post('/queue/:queueId/cancel', async (c) => {
  const { queueId } = validateParams(c, queueParamsSchema);
  const body = (await validateJson(c, queueCancelRequestSchema)) as S2QueueCancelRequest;

  if (body.queueId !== queueId) {
    throw new AppError(400, 'S2_QUEUE_CANCEL_MISMATCH', 'Payload queue ID mismatch');
  }

  let verified;
  try {
    verified = await verifyS2QueueCancelAuth(body);
  } catch (error) {
    throw new AppError(
      401,
      'S2_QUEUE_CANCEL_AUTH_INVALID',
      error instanceof Error ? error.message : 'Invalid cancellation authorization'
    );
  }

  return c.json(await cancelS2Queue(queueId, verified.address));
});

app.post('/queue/:queueId/status', async (c) => {
  const { queueId } = validateParams(c, queueParamsSchema);
  const body = (await validateJson(c, queueStatusRequestSchema)) as S2QueueStatusRequest;

  if (body.queueId !== queueId) {
    throw new AppError(400, 'S2_QUEUE_STATUS_MISMATCH', 'Payload queue ID mismatch');
  }

  return c.json(await getS2QueueStatus(queueId, body.statusToken));
});

export default app;
```

- [ ] **Step 2: Create `s2Leaderboard.ts`**

```typescript
// apps/api/src/routes/s2Leaderboard.ts
import { Hono } from 'hono';
import { z } from 'zod';
import { isAddress } from 'viem';
import { getS2Leaderboard } from '../services/s2Leaderboard';
import { getS2Player } from '../services/s2Players';
import { getProfile } from '../services/profiles';
import { validateParams, validateQuery } from '../middleware/validate';

const app = new Hono();

const leaderboardQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

const playerParamsSchema = z.object({
  address: z.string().refine((value) => isAddress(value), 'must be a valid address'),
});

app.get('/', async (c) => {
  const { limit, offset } = validateQuery(c, leaderboardQuerySchema);
  return c.json(await getS2Leaderboard(limit, offset));
});

app.get('/:address', async (c) => {
  const { address } = validateParams(c, playerParamsSchema);
  const player = await getS2Player(address);

  if (!player) {
    return c.json({
      address,
      score: 0,
      elo: 1000,
      wins: 0,
      losses: 0,
      headshotKills: 0,
      totalKills: 0,
      sniperCount: 0,
      headshotPct: 0,
      winStreak: 0,
      displayName: null,
      ensName: null,
    });
  }

  const profile = await getProfile(player.address);
  const headshotPct =
    player.totalKills > 0
      ? Number(((player.headshotKills / player.totalKills) * 100).toFixed(1))
      : 0;

  return c.json({
    address: player.address,
    score: player.score,
    elo: player.elo,
    wins: player.wins,
    losses: player.losses,
    headshotKills: player.headshotKills,
    totalKills: player.totalKills,
    sniperCount: player.sniperCount,
    headshotPct,
    winStreak: player.winStreak,
    displayName: profile.displayName,
    ensName: profile.ensName,
  });
});

export default app;
```

- [ ] **Step 3: Create `s2Snipers.ts` route**

```typescript
// apps/api/src/routes/s2Snipers.ts
import { Hono } from 'hono';
import { z } from 'zod';
import { isAddress } from 'viem';
import type { S2SnipersResponse } from '@warpath/shared';
import { validateParams } from '../middleware/validate';
import { getSnipersForAddress } from '../services/s2Snipers';

const app = new Hono();

const sniperParamsSchema = z.object({
  address: z.string().refine((value) => isAddress(value), 'must be a valid address'),
});

app.get('/:address', async (c) => {
  const { address } = validateParams(c, sniperParamsSchema);
  const snipers = await getSnipersForAddress(address as `0x${string}`);
  return c.json({ snipers } satisfies S2SnipersResponse);
});

export default app;
```

- [ ] **Step 4: Create `s2Killfeed.ts` route**

```typescript
// apps/api/src/routes/s2Killfeed.ts
import { Hono } from 'hono';
import { z } from 'zod';
import type { S2KillfeedResponse } from '@warpath/shared';
import { validateQuery } from '../middleware/validate';
import { getS2Killfeed } from '../services/s2Killfeed';

const app = new Hono();

const killfeedQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

app.get('/', async (c) => {
  const { limit } = validateQuery(c, killfeedQuerySchema);
  const entries = await getS2Killfeed(limit);
  return c.json({ entries } satisfies S2KillfeedResponse);
});

export default app;
```

- [ ] **Step 5: Create `s2Results.ts` — game server result submission endpoint**

```typescript
// apps/api/src/routes/s2Results.ts
import { Hono } from 'hono';
import { z } from 'zod';
import { S2_GAME_SERVER_SECRET_HEADER } from '@warpath/shared';
import { AppError } from '../lib/errors';
import { validateJson } from '../middleware/validate';
import { applyS2MatchResult } from '../services/s2Scoring';

const app = new Hono();

const SERVER_SECRET = process.env['S2_GAME_SERVER_SECRET'] ?? '';

const roundResultSchema = z.object({
  round: z.number().int().min(1),
  winner: z.union([z.literal(0), z.literal(1), z.null()]),
  killerHeadshot: z.boolean(),
  player0Hp: z.number().int().min(0),
  player1Hp: z.number().int().min(0),
  durationMs: z.number().int().min(0),
});

const matchResultSchema = z.object({
  battleId: z.string().uuid(),
  secret: z.string().min(1),
  result: z.object({
    winner: z.union([z.literal(0), z.literal(1)]),
    rounds: z.array(roundResultSchema).min(1).max(5),
    leftScore: z.number().int().min(0),
    rightScore: z.number().int().min(0),
  }),
});

app.post('/', async (c) => {
  if (!SERVER_SECRET) {
    throw new AppError(503, 'S2_RESULTS_UNAVAILABLE', 'Result submission not configured');
  }

  const headerSecret = c.req.header(S2_GAME_SERVER_SECRET_HEADER);
  const body = await validateJson(c, matchResultSchema);

  if (body.secret !== SERVER_SECRET && headerSecret !== SERVER_SECRET) {
    throw new AppError(401, 'S2_RESULTS_UNAUTHORIZED', 'Invalid server secret');
  }

  await applyS2MatchResult(body.battleId, body.result);

  return c.json({ status: 'accepted', battleId: body.battleId });
});

export default app;
```

- [ ] **Step 6: Wire all Season 2 routes into `apps/api/src/index.ts`**

Add these imports at the top of `apps/api/src/index.ts` alongside the existing route imports:

```typescript
import s2BattlesRouter from './routes/s2Battles';
import s2LeaderboardRouter from './routes/s2Leaderboard';
import s2SnipersRouter from './routes/s2Snipers';
import s2KillfeedRouter from './routes/s2Killfeed';
import s2ResultsRouter from './routes/s2Results';
```

Add these route mounts after the existing Season 1 routes (after `app.route('/api/notifications', notificationsRouter);`):

```typescript
// Season 2: Deadshot
app.route('/api/s2/battles', s2BattlesRouter);
app.route('/api/s2/leaderboard', s2LeaderboardRouter);
app.route('/api/s2/snipers', s2SnipersRouter);
app.route('/api/s2/killfeed', s2KillfeedRouter);
app.route('/api/s2/results', s2ResultsRouter);
```

Add rate limiting for Season 2 routes (before the route mounts):

```typescript
app.use(
  '/api/s2/battles/*',
  createRateLimit({
    scope: 's2_battles',
    max: 30,
    windowMs: 60_000,
    code: 'S2_BATTLES_RATE_LIMITED',
    message: 'Too many Season 2 battle requests',
  })
);
app.use(
  '/api/s2/leaderboard/*',
  createRateLimit({
    scope: 's2_leaderboard',
    max: 30,
    windowMs: 60_000,
    code: 'S2_LEADERBOARD_RATE_LIMITED',
    message: 'Too many Season 2 leaderboard requests',
  })
);
app.use(
  '/api/s2/snipers/*',
  createRateLimit({
    scope: 's2_snipers',
    max: 20,
    windowMs: 60_000,
    code: 'S2_SNIPERS_RATE_LIMITED',
    message: 'Too many sniper requests',
  })
);
app.use(
  '/api/s2/killfeed',
  createRateLimit({
    scope: 's2_killfeed',
    max: 60,
    windowMs: 60_000,
    code: 'S2_KILLFEED_RATE_LIMITED',
    message: 'Too many Season 2 killfeed requests',
  })
);
app.use(
  '/api/s2/results',
  createRateLimit({
    scope: 's2_results',
    max: 60,
    windowMs: 60_000,
    code: 'S2_RESULTS_RATE_LIMITED',
    message: 'Too many result submissions',
  })
);
```

- [ ] **Step 7: Typecheck the API package**

Run: `cd /Users/txdm_/.codex/warpath && pnpm --filter @warpath/shared build && pnpm --filter @warpath/api exec tsc --noEmit -p tsconfig.json`
Expected: No errors

- [ ] **Step 8: Commit**

```bash
git add apps/api/src/routes/s2Battles.ts apps/api/src/routes/s2Leaderboard.ts apps/api/src/routes/s2Snipers.ts apps/api/src/routes/s2Killfeed.ts apps/api/src/routes/s2Results.ts apps/api/src/index.ts
git commit -m "feat: add Season 2 API routes (queue, leaderboard, snipers, killfeed, results)"
```

---

### Task 13: Season 1 Sunset

**Files:**
- Modify: `packages/shared/src/season.ts`
- Modify: `apps/api/src/services/matchmaking.ts`

- [ ] **Step 1: Add Season 2 timing to `season.ts`**

Add at the end of `packages/shared/src/season.ts`:

```typescript
export type ActiveSeason = 1 | 2;

export function getActiveSeason(nowMs: number): ActiveSeason {
  // Season 1 is over. Season 2 is live.
  // If Season 2 needs its own start/end gating, add it here.
  return nowMs >= SEASON_ONE_END_MS ? 2 : 1;
}
```

- [ ] **Step 2: Disable Season 1 matchmaking**

In `apps/api/src/services/matchmaking.ts`, change the season check at the top of `joinQueue()`:

Replace:
```typescript
  if (!isSeasonOneLive(Date.now())) {
    throw new AppError(
      409,
      'SEASON_NOT_STARTED',
      `Matchmaking unlocks at ${new Date(SEASON_ONE_START_MS).toISOString()}`
    );
  }
```

With:
```typescript
  throw new AppError(
    410,
    'SEASON_ONE_ENDED',
    'Season 1 matchmaking has ended. Queue for Season 2 at /api/s2/battles/queue'
  );
```

- [ ] **Step 3: Build shared package and run all tests**

Run: `cd /Users/txdm_/.codex/warpath && pnpm --filter @warpath/shared build && pnpm test`
Expected: All tests pass (some Season 1 matchmaking tests may need updating if they test the `joinQueue` path)

- [ ] **Step 4: Commit**

```bash
git add packages/shared/src/season.ts apps/api/src/services/matchmaking.ts
git commit -m "feat: sunset Season 1 matchmaking, add active season resolver"
```

---

### Task 14: Environment Variable Documentation

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Add Season 2 env vars to `.env.example`**

Append to `.env.example`:

```env
# Season 2: Deadshot
S2_GAME_SERVER_URL=ws://localhost:3002
S2_GAME_SERVER_SECRET=change-me-to-a-long-random-secret
```

- [ ] **Step 2: Commit**

```bash
git add .env.example
git commit -m "chore: add Season 2 environment variables to .env.example"
```

---

### Task 15: Full Typecheck and Test Pass

**Files:** None (verification only)

- [ ] **Step 1: Build all packages**

Run: `cd /Users/txdm_/.codex/warpath && pnpm build`
Expected: Clean build across all packages

- [ ] **Step 2: Run full typecheck**

Run: `cd /Users/txdm_/.codex/warpath && pnpm typecheck`
Expected: No type errors

- [ ] **Step 3: Run all tests**

Run: `cd /Users/txdm_/.codex/warpath && pnpm test`
Expected: All tests pass

- [ ] **Step 4: Fix any issues found and commit**

If any tests fail or type errors are found, fix them and commit:

```bash
git add -A
git commit -m "fix: resolve typecheck and test issues from Season 2 foundation"
```
