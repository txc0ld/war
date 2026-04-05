# Deadshot Game Server Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the real-time WebSocket game server for Season 2 Deadshot sniper duels — server-authoritative hit detection, round/match lifecycle, and result reporting back to the API.

**Architecture:** New `apps/game-server` package in the monorepo. Bun native WebSocket server. Per-room state machine with 20Hz tick loop. Pure game logic (player state, hit detection, round management) is fully testable without infrastructure. Thin infrastructure layer for DB auth and API result reporting. Communicates with the existing API via `POST /api/s2/results` for scoring.

**Tech Stack:** Bun, TypeScript, pg (raw SQL for auth), Vitest

**Design spec:** `docs/superpowers/specs/2026-04-05-deadshot-season2-integration-design.md` §2 (Game Server), §6 (Client-Server Communication)

**Depends on:** Plan 1 (Deadshot Foundation) — shared types, DB schema, API routes all exist.

---

### Task 1: Shared Game Protocol Types

**Files:**
- Create: `packages/shared/src/s2GameTypes.ts`
- Modify: `packages/shared/src/index.ts`
- Modify: `packages/shared/tsup.config.ts`
- Modify: `packages/shared/package.json`

- [ ] **Step 1: Create `s2GameTypes.ts`**

```typescript
// packages/shared/src/s2GameTypes.ts

// ── 3D math primitive ──────────────────────────────────────────────

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

// ── Per-tick client input ──────────────────────────────────────────

export interface ClientInput {
  aimYaw: number;
  aimPitch: number;
  fire: boolean;
  scope: boolean;
  scopeZoom: 1 | 2;
  crouch: boolean;
  reload: boolean;
  timestamp: number;
}

// ── Player state snapshot (broadcast each tick) ────────────────────

export interface PlayerState {
  aimYaw: number;
  aimPitch: number;
  stance: 'standing' | 'crouched';
  scoped: boolean;
  hp: number;
  ammo: number;
  reloading: boolean;
  alive: boolean;
}

// ── Spawn angles sent with round_start ─────────────────────────────

export interface SpawnAngles {
  yaw: number;
  pitch: number;
}

// ── Events emitted during a tick ──────────────────────────────────

export type GameEvent =
  | { type: 'hit'; target: 0 | 1; zone: 'head' | 'body'; damage: number }
  | { type: 'kill'; killer: 0 | 1; victim: 0 | 1; headshot: boolean }
  | {
      type: 'round_start';
      round: number;
      positions: [SpawnAngles, SpawnAngles];
    }
  | { type: 'round_end'; winner: 0 | 1 | null; score: [number, number] }
  | { type: 'match_end'; winner: 0 | 1; finalScore: [number, number] };

// ── Full game state broadcast each tick ───────────────────────────

export interface GameState {
  tick: number;
  roundNumber: number;
  roundTimer: number;
  players: [PlayerState, PlayerState];
  events: GameEvent[];
}

// ── Client → Server messages ──────────────────────────────────────

export type ClientMessage =
  | { type: 'auth'; roomId: string; roomToken: string }
  | { type: 'input'; input: ClientInput }
  | { type: 'ping' };

// ── Server → Client messages ──────────────────────────────────────

export type ServerMessage =
  | {
      type: 'auth_ok';
      playerIndex: 0 | 1;
      battleId: string;
      opponentAddress: string;
      opponentTokenId: number;
    }
  | { type: 'auth_error'; reason: string }
  | { type: 'waiting'; message: string }
  | { type: 'countdown'; seconds: number; round: number }
  | { type: 'state'; state: GameState }
  | { type: 'match_result'; winner: 0 | 1; finalScore: [number, number] }
  | { type: 'error'; code: string; message: string }
  | { type: 'pong' };

// ── Spawn position in world space ─────────────────────────────────

export interface SpawnPosition {
  x: number;
  y: number;
  z: number;
  facingYaw: number;
}

export interface SpawnPair {
  player0: SpawnPosition;
  player1: SpawnPosition;
}

// ── Hit detection result ──────────────────────────────────────────

export type HitResult =
  | { hit: false }
  | { hit: true; zone: 'head' | 'body'; damage: number };

// ── Hitbox geometry constants ─────────────────────────────────────

export const HITBOX = {
  STANDING_EYE_Y: 1.65,
  STANDING_BODY_MIN_Y: 0.0,
  STANDING_BODY_MAX_Y: 1.5,
  STANDING_HEAD_CENTER_Y: 1.65,
  STANDING_HEAD_RADIUS: 0.13,

  CROUCHED_EYE_Y: 1.1,
  CROUCHED_BODY_MIN_Y: 0.0,
  CROUCHED_BODY_MAX_Y: 1.0,
  CROUCHED_HEAD_CENTER_Y: 1.1,
  CROUCHED_HEAD_RADIUS: 0.13,

  BODY_HALF_WIDTH: 0.25,
  BODY_HALF_DEPTH: 0.15,
} as const;
```

- [ ] **Step 2: Add exports to shared package**

Add to the end of `packages/shared/src/index.ts`:

```typescript
export * from './s2GameTypes.js';
```

Add `'src/s2GameTypes.ts'` to the `entry` array in `packages/shared/tsup.config.ts`:

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
  'src/s2GameTypes.ts',
],
```

Add to `packages/shared/package.json` exports:

```json
"./s2GameTypes": {
  "types": "./dist/s2GameTypes.d.ts",
  "import": "./dist/s2GameTypes.js",
  "require": "./dist/s2GameTypes.cjs"
}
```

- [ ] **Step 3: Build and verify**

Run: `cd /Users/txdm_/.codex/warpath && pnpm --filter @warpath/shared build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add packages/shared/src/s2GameTypes.ts packages/shared/src/index.ts packages/shared/tsup.config.ts packages/shared/package.json
git commit -m "feat: add shared game protocol types for Deadshot game server"
```

---

### Task 2: Game Server Package Scaffold

**Files:**
- Create: `apps/game-server/package.json`
- Create: `apps/game-server/tsconfig.json`
- Create: `apps/game-server/vitest.config.ts`
- Create: `apps/game-server/src/index.ts`
- Modify: `/Users/txdm_/.codex/warpath/package.json` (root)

- [ ] **Step 1: Create `apps/game-server/package.json`**

```json
{
  "name": "@warpath/game-server",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "bun --watch src/index.ts",
    "build": "bun build src/index.ts --outdir dist --target bun",
    "start": "bun dist/index.js",
    "test": "pnpm --filter @warpath/shared build && vitest run"
  },
  "dependencies": {
    "@warpath/shared": "workspace:*",
    "pg": "^8.13.0"
  },
  "devDependencies": {
    "@types/pg": "^8.11.0",
    "typescript": "^5.5.0",
    "vitest": "^2.1.9"
  }
}
```

- [ ] **Step 2: Create `apps/game-server/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "baseUrl": ".",
    "paths": {
      "@warpath/shared": ["../../packages/shared/src/index.ts"],
      "@warpath/shared/*": ["../../packages/shared/src/*"]
    }
  },
  "include": ["src", "../../packages/shared/src"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create `apps/game-server/vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/__tests__/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@warpath/shared': '../../packages/shared/src/index.ts',
    },
  },
});
```

- [ ] **Step 4: Create placeholder `apps/game-server/src/index.ts`**

```typescript
const PORT = Number(process.env['PORT'] ?? 3002);

console.log(`Deadshot game server starting on port ${PORT}`);

// Full implementation in Task 11
export {};
```

- [ ] **Step 5: Add root dev script**

In the root `package.json`, add to `scripts`:

```json
"dev:game": "pnpm --filter @warpath/game-server dev"
```

- [ ] **Step 6: Install dependencies**

Run: `cd /Users/txdm_/.codex/warpath && pnpm install`

- [ ] **Step 7: Verify typecheck**

Run: `cd /Users/txdm_/.codex/warpath && pnpm --filter @warpath/shared build && pnpm --filter @warpath/game-server exec tsc --noEmit -p tsconfig.json`
Expected: No errors

- [ ] **Step 8: Commit**

```bash
git add apps/game-server/package.json apps/game-server/tsconfig.json apps/game-server/vitest.config.ts apps/game-server/src/index.ts package.json pnpm-lock.yaml
git commit -m "feat: scaffold game-server package in monorepo"
```

---

### Task 3: WebSocket Protocol

**Files:**
- Create: `apps/game-server/src/protocol.ts`
- Create: `apps/game-server/src/__tests__/protocol.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// apps/game-server/src/__tests__/protocol.test.ts
import { describe, expect, it } from 'vitest';
import {
  parseClientMessage,
  serializeServerMessage,
} from '../protocol';
import type { ClientMessage, ServerMessage } from '@warpath/shared';

describe('parseClientMessage', () => {
  it('parses a valid auth message', () => {
    const raw = JSON.stringify({
      type: 'auth',
      roomId: 'room-1',
      roomToken: 'token-abc',
    });
    const result = parseClientMessage(raw);
    expect(result).toEqual({
      type: 'auth',
      roomId: 'room-1',
      roomToken: 'token-abc',
    });
  });

  it('parses a valid input message', () => {
    const raw = JSON.stringify({
      type: 'input',
      input: {
        aimYaw: 0.1,
        aimPitch: -0.05,
        fire: true,
        scope: false,
        scopeZoom: 1,
        crouch: false,
        reload: false,
        timestamp: 1000,
      },
    });
    const result = parseClientMessage(raw);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('input');
  });

  it('parses a ping message', () => {
    const raw = JSON.stringify({ type: 'ping' });
    const result = parseClientMessage(raw);
    expect(result).toEqual({ type: 'ping' });
  });

  it('returns null for invalid JSON', () => {
    expect(parseClientMessage('not json')).toBeNull();
  });

  it('returns null for unknown message type', () => {
    expect(parseClientMessage(JSON.stringify({ type: 'unknown' }))).toBeNull();
  });
});

describe('serializeServerMessage', () => {
  it('serializes an auth_ok message', () => {
    const msg: ServerMessage = {
      type: 'auth_ok',
      playerIndex: 0,
      battleId: 'battle-1',
      opponentAddress: '0xabc',
      opponentTokenId: 42,
    };
    const result = serializeServerMessage(msg);
    expect(JSON.parse(result)).toEqual(msg);
  });

  it('serializes a state message', () => {
    const msg: ServerMessage = {
      type: 'state',
      state: {
        tick: 1,
        roundNumber: 1,
        roundTimer: 59000,
        players: [
          {
            aimYaw: 0,
            aimPitch: 0,
            stance: 'standing',
            scoped: false,
            hp: 100,
            ammo: 5,
            reloading: false,
            alive: true,
          },
          {
            aimYaw: 0,
            aimPitch: 0,
            stance: 'standing',
            scoped: false,
            hp: 100,
            ammo: 5,
            reloading: false,
            alive: true,
          },
        ],
        events: [],
      },
    };
    const result = serializeServerMessage(msg);
    expect(JSON.parse(result)).toEqual(msg);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/txdm_/.codex/warpath && pnpm --filter @warpath/shared build && cd apps/game-server && npx vitest run src/__tests__/protocol.test.ts`
Expected: FAIL — module `../protocol` not found

- [ ] **Step 3: Implement `protocol.ts`**

```typescript
// apps/game-server/src/protocol.ts
import type { ClientMessage, ServerMessage } from '@warpath/shared';

export function parseClientMessage(raw: string): ClientMessage | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (typeof parsed !== 'object' || parsed === null || !('type' in parsed)) {
    return null;
  }

  const obj = parsed as Record<string, unknown>;

  switch (obj['type']) {
    case 'auth': {
      if (
        typeof obj['roomId'] === 'string' &&
        typeof obj['roomToken'] === 'string'
      ) {
        return {
          type: 'auth',
          roomId: obj['roomId'],
          roomToken: obj['roomToken'],
        };
      }
      return null;
    }

    case 'input': {
      const input = obj['input'];
      if (typeof input === 'object' && input !== null) {
        const inp = input as Record<string, unknown>;
        if (
          typeof inp['aimYaw'] === 'number' &&
          typeof inp['aimPitch'] === 'number' &&
          typeof inp['fire'] === 'boolean' &&
          typeof inp['scope'] === 'boolean' &&
          (inp['scopeZoom'] === 1 || inp['scopeZoom'] === 2) &&
          typeof inp['crouch'] === 'boolean' &&
          typeof inp['reload'] === 'boolean' &&
          typeof inp['timestamp'] === 'number'
        ) {
          return {
            type: 'input',
            input: {
              aimYaw: inp['aimYaw'],
              aimPitch: inp['aimPitch'],
              fire: inp['fire'],
              scope: inp['scope'],
              scopeZoom: inp['scopeZoom'],
              crouch: inp['crouch'],
              reload: inp['reload'],
              timestamp: inp['timestamp'],
            },
          };
        }
      }
      return null;
    }

    case 'ping':
      return { type: 'ping' };

    default:
      return null;
  }
}

export function serializeServerMessage(msg: ServerMessage): string {
  return JSON.stringify(msg);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/txdm_/.codex/warpath && pnpm --filter @warpath/shared build && cd apps/game-server && npx vitest run src/__tests__/protocol.test.ts`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add apps/game-server/src/protocol.ts apps/game-server/src/__tests__/protocol.test.ts
git commit -m "feat: add WebSocket message protocol for game server"
```

---

### Task 4: Player State

**Files:**
- Create: `apps/game-server/src/playerState.ts`
- Create: `apps/game-server/src/__tests__/playerState.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// apps/game-server/src/__tests__/playerState.test.ts
import { describe, expect, it } from 'vitest';
import { MutablePlayerState } from '../playerState';
import { S2_MATCH_CONFIG } from '@warpath/shared';
import type { ClientInput } from '@warpath/shared';

const defaultInput: ClientInput = {
  aimYaw: 0,
  aimPitch: 0,
  fire: false,
  scope: false,
  scopeZoom: 1,
  crouch: false,
  reload: false,
  timestamp: 0,
};

describe('MutablePlayerState', () => {
  it('initializes with full HP and ammo', () => {
    const player = new MutablePlayerState();
    const snap = player.snapshot();
    expect(snap.hp).toBe(S2_MATCH_CONFIG.PLAYER_HP);
    expect(snap.ammo).toBe(S2_MATCH_CONFIG.MAGAZINE_SIZE);
    expect(snap.alive).toBe(true);
    expect(snap.stance).toBe('standing');
    expect(snap.reloading).toBe(false);
  });

  it('applies aim and stance from input', () => {
    const player = new MutablePlayerState();
    player.applyInput(
      { ...defaultInput, aimYaw: 0.5, aimPitch: -0.2, crouch: true },
      100
    );
    const snap = player.snapshot();
    expect(snap.aimYaw).toBe(0.5);
    expect(snap.aimPitch).toBe(-0.2);
    expect(snap.stance).toBe('crouched');
  });

  it('can fire when ammo available and bolt cycle elapsed', () => {
    const player = new MutablePlayerState();
    expect(player.canFire(0)).toBe(true);
    player.fire(0);
    expect(player.snapshot().ammo).toBe(S2_MATCH_CONFIG.MAGAZINE_SIZE - 1);
    // Cannot fire again immediately (bolt cycle)
    expect(player.canFire(100)).toBe(false);
    // Can fire after bolt cycle
    expect(player.canFire(S2_MATCH_CONFIG.BOLT_CYCLE_MS)).toBe(true);
  });

  it('cannot fire with zero ammo', () => {
    const player = new MutablePlayerState();
    for (let i = 0; i < S2_MATCH_CONFIG.MAGAZINE_SIZE; i++) {
      player.fire(i * S2_MATCH_CONFIG.BOLT_CYCLE_MS);
    }
    expect(player.snapshot().ammo).toBe(0);
    expect(player.canFire(100_000)).toBe(false);
  });

  it('reloads ammo after reload duration', () => {
    const player = new MutablePlayerState();
    // Empty one round
    player.fire(0);
    expect(player.snapshot().ammo).toBe(S2_MATCH_CONFIG.MAGAZINE_SIZE - 1);

    player.startReload(100);
    expect(player.snapshot().reloading).toBe(true);
    expect(player.canFire(100)).toBe(false);

    // Not done yet
    player.updateReload(100 + S2_MATCH_CONFIG.RELOAD_DURATION_MS - 1);
    expect(player.snapshot().reloading).toBe(true);

    // Done
    player.updateReload(100 + S2_MATCH_CONFIG.RELOAD_DURATION_MS);
    expect(player.snapshot().reloading).toBe(false);
    expect(player.snapshot().ammo).toBe(S2_MATCH_CONFIG.MAGAZINE_SIZE);
  });

  it('takes damage and dies at zero HP', () => {
    const player = new MutablePlayerState();
    player.takeDamage(55);
    expect(player.snapshot().hp).toBe(45);
    expect(player.snapshot().alive).toBe(true);

    player.takeDamage(55);
    expect(player.snapshot().hp).toBe(0);
    expect(player.snapshot().alive).toBe(false);
  });

  it('resets all state for a new round', () => {
    const player = new MutablePlayerState();
    player.takeDamage(50);
    player.fire(0);
    player.applyInput({ ...defaultInput, crouch: true }, 100);

    player.reset();
    const snap = player.snapshot();
    expect(snap.hp).toBe(S2_MATCH_CONFIG.PLAYER_HP);
    expect(snap.ammo).toBe(S2_MATCH_CONFIG.MAGAZINE_SIZE);
    expect(snap.alive).toBe(true);
    expect(snap.stance).toBe('standing');
    expect(snap.reloading).toBe(false);
  });

  it('does not start reload when magazine is full', () => {
    const player = new MutablePlayerState();
    player.startReload(0);
    expect(player.snapshot().reloading).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/txdm_/.codex/warpath && pnpm --filter @warpath/shared build && cd apps/game-server && npx vitest run src/__tests__/playerState.test.ts`
Expected: FAIL — module `../playerState` not found

- [ ] **Step 3: Implement `playerState.ts`**

```typescript
// apps/game-server/src/playerState.ts
import { S2_MATCH_CONFIG } from '@warpath/shared';
import type { ClientInput, PlayerState } from '@warpath/shared';

export class MutablePlayerState {
  aimYaw = 0;
  aimPitch = 0;
  stance: 'standing' | 'crouched' = 'standing';
  scoped = false;
  scopeZoom: 1 | 2 = 1;
  hp = S2_MATCH_CONFIG.PLAYER_HP;
  ammo = S2_MATCH_CONFIG.MAGAZINE_SIZE;
  reloading = false;
  alive = true;

  private lastFireMs = -Infinity;
  private reloadStartMs = -Infinity;

  applyInput(input: ClientInput, _nowMs: number): void {
    this.aimYaw = input.aimYaw;
    this.aimPitch = input.aimPitch;
    this.stance = input.crouch ? 'crouched' : 'standing';
    this.scoped = input.scope;
    this.scopeZoom = input.scopeZoom;
  }

  canFire(nowMs: number): boolean {
    return (
      this.alive &&
      !this.reloading &&
      this.ammo > 0 &&
      nowMs - this.lastFireMs >= S2_MATCH_CONFIG.BOLT_CYCLE_MS
    );
  }

  fire(nowMs: number): void {
    this.ammo--;
    this.lastFireMs = nowMs;
  }

  startReload(nowMs: number): void {
    if (this.ammo >= S2_MATCH_CONFIG.MAGAZINE_SIZE) {
      return;
    }
    this.reloading = true;
    this.reloadStartMs = nowMs;
  }

  updateReload(nowMs: number): void {
    if (
      this.reloading &&
      nowMs - this.reloadStartMs >= S2_MATCH_CONFIG.RELOAD_DURATION_MS
    ) {
      this.reloading = false;
      this.ammo = S2_MATCH_CONFIG.MAGAZINE_SIZE;
    }
  }

  takeDamage(amount: number): void {
    this.hp = Math.max(0, this.hp - amount);
    if (this.hp <= 0) {
      this.alive = false;
    }
  }

  snapshot(): PlayerState {
    return {
      aimYaw: this.aimYaw,
      aimPitch: this.aimPitch,
      stance: this.stance,
      scoped: this.scoped,
      hp: this.hp,
      ammo: this.ammo,
      reloading: this.reloading,
      alive: this.alive,
    };
  }

  reset(): void {
    this.hp = S2_MATCH_CONFIG.PLAYER_HP;
    this.ammo = S2_MATCH_CONFIG.MAGAZINE_SIZE;
    this.reloading = false;
    this.alive = true;
    this.lastFireMs = -Infinity;
    this.reloadStartMs = -Infinity;
    this.aimYaw = 0;
    this.aimPitch = 0;
    this.stance = 'standing';
    this.scoped = false;
    this.scopeZoom = 1;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/txdm_/.codex/warpath && pnpm --filter @warpath/shared build && cd apps/game-server && npx vitest run src/__tests__/playerState.test.ts`
Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
git add apps/game-server/src/playerState.ts apps/game-server/src/__tests__/playerState.test.ts
git commit -m "feat: add mutable player state with fire, reload, damage mechanics"
```

---

### Task 5: Hit Detection

**Files:**
- Create: `apps/game-server/src/hitDetection.ts`
- Create: `apps/game-server/src/__tests__/hitDetection.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// apps/game-server/src/__tests__/hitDetection.test.ts
import { describe, expect, it } from 'vitest';
import { checkHit, aimToDirection } from '../hitDetection';
import type { Vec3 } from '@warpath/shared';

describe('aimToDirection', () => {
  it('facing +Z with zero aim gives forward vector', () => {
    const dir = aimToDirection(0, 0, 0);
    expect(dir.x).toBeCloseTo(0, 5);
    expect(dir.y).toBeCloseTo(0, 5);
    expect(dir.z).toBeCloseTo(1, 5);
  });

  it('facing +Z with 90° yaw gives +X vector', () => {
    const dir = aimToDirection(0, Math.PI / 2, 0);
    expect(dir.x).toBeCloseTo(1, 5);
    expect(dir.y).toBeCloseTo(0, 5);
    expect(dir.z).toBeCloseTo(0, 5);
  });

  it('facing +Z with positive pitch aims upward', () => {
    const dir = aimToDirection(0, 0, Math.PI / 4);
    expect(dir.y).toBeGreaterThan(0);
    expect(dir.z).toBeGreaterThan(0);
  });
});

describe('checkHit', () => {
  // Player 0 at origin facing +Z, Player 1 at (0, 0, 50) facing -Z
  const shooter: Vec3 = { x: 0, y: 0, z: 0 };
  const target: Vec3 = { x: 0, y: 0, z: 50 };
  const shooterFacing = 0; // facing +Z

  it('headshot when aiming directly at standing head', () => {
    // Target head center is at y=1.65, 50m away
    // From shooter eye at y=1.65, pitch=0 aims level → hits target at y=1.65
    const result = checkHit(
      shooter,
      shooterFacing,
      'standing',
      0,
      0,
      target,
      'standing'
    );
    expect(result.hit).toBe(true);
    if (result.hit) {
      expect(result.zone).toBe('head');
    }
  });

  it('body shot when aiming at torso', () => {
    // Aim slightly down to hit body (y~1.0 at 50m)
    // pitch = atan2(1.0 - 1.65, 50) ≈ -0.013
    const pitch = Math.atan2(1.0 - 1.65, 50);
    const result = checkHit(
      shooter,
      shooterFacing,
      'standing',
      0,
      pitch,
      target,
      'standing'
    );
    expect(result.hit).toBe(true);
    if (result.hit) {
      expect(result.zone).toBe('body');
    }
  });

  it('miss when aiming completely off target', () => {
    // Aim 45 degrees to the right — misses at 50m distance
    const result = checkHit(
      shooter,
      shooterFacing,
      'standing',
      Math.PI / 4,
      0,
      target,
      'standing'
    );
    expect(result.hit).toBe(false);
  });

  it('crouched target has lower head position', () => {
    // Aim level (pitch=0) from standing eye (1.65) at crouched target
    // Crouched head center is at 1.1 — level aim at 1.65 overshoots
    const result = checkHit(
      shooter,
      shooterFacing,
      'standing',
      0,
      0,
      target,
      'crouched'
    );
    // At 50m, the ray at y=1.65 is above the crouched head (1.1 + 0.13 = 1.23)
    expect(result.hit).toBe(false);
  });

  it('crouched target can be hit with adjusted aim', () => {
    // Aim down to hit crouched head at y=1.1
    const pitch = Math.atan2(1.1 - 1.65, 50);
    const result = checkHit(
      shooter,
      shooterFacing,
      'standing',
      0,
      pitch,
      target,
      'crouched'
    );
    expect(result.hit).toBe(true);
    if (result.hit) {
      expect(result.zone).toBe('head');
    }
  });

  it('crouched shooter has lower eye position', () => {
    // Crouched shooter eye at y=1.1, aim level, target standing head at y=1.65
    // Ray goes from 1.1 to 1.1 at target — hits body (1.1 is in body range 0-1.5)
    const result = checkHit(
      shooter,
      shooterFacing,
      'crouched',
      0,
      0,
      target,
      'standing'
    );
    expect(result.hit).toBe(true);
    if (result.hit) {
      expect(result.zone).toBe('body');
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/txdm_/.codex/warpath && pnpm --filter @warpath/shared build && cd apps/game-server && npx vitest run src/__tests__/hitDetection.test.ts`
Expected: FAIL — module `../hitDetection` not found

- [ ] **Step 3: Implement `hitDetection.ts`**

```typescript
// apps/game-server/src/hitDetection.ts
import { HITBOX, S2_MATCH_CONFIG } from '@warpath/shared';
import type { Vec3, HitResult } from '@warpath/shared';

export function aimToDirection(
  facingYaw: number,
  aimYaw: number,
  aimPitch: number
): Vec3 {
  const totalYaw = facingYaw + aimYaw;
  return {
    x: Math.sin(totalYaw) * Math.cos(aimPitch),
    y: Math.sin(aimPitch),
    z: Math.cos(totalYaw) * Math.cos(aimPitch),
  };
}

function raySphereIntersect(
  origin: Vec3,
  dir: Vec3,
  center: Vec3,
  radius: number
): boolean {
  const ocX = origin.x - center.x;
  const ocY = origin.y - center.y;
  const ocZ = origin.z - center.z;
  const a = dir.x * dir.x + dir.y * dir.y + dir.z * dir.z;
  const b = 2 * (ocX * dir.x + ocY * dir.y + ocZ * dir.z);
  const c = ocX * ocX + ocY * ocY + ocZ * ocZ - radius * radius;
  const discriminant = b * b - 4 * a * c;

  if (discriminant < 0) return false;

  const sqrtD = Math.sqrt(discriminant);
  const t1 = (-b - sqrtD) / (2 * a);
  const t2 = (-b + sqrtD) / (2 * a);

  return t1 > 0 || t2 > 0;
}

function rayAABBIntersect(
  origin: Vec3,
  dir: Vec3,
  min: Vec3,
  max: Vec3
): boolean {
  let tMin = -Infinity;
  let tMax = Infinity;

  for (const axis of ['x', 'y', 'z'] as const) {
    if (Math.abs(dir[axis]) < 1e-8) {
      if (origin[axis] < min[axis] || origin[axis] > max[axis]) {
        return false;
      }
    } else {
      const t1 = (min[axis] - origin[axis]) / dir[axis];
      const t2 = (max[axis] - origin[axis]) / dir[axis];
      const tNear = Math.min(t1, t2);
      const tFar = Math.max(t1, t2);
      tMin = Math.max(tMin, tNear);
      tMax = Math.min(tMax, tFar);
      if (tMin > tMax || tMax < 0) {
        return false;
      }
    }
  }

  return tMin > 0 || tMax > 0;
}

export function checkHit(
  shooterPos: Vec3,
  shooterFacingYaw: number,
  shooterStance: 'standing' | 'crouched',
  aimYaw: number,
  aimPitch: number,
  targetPos: Vec3,
  targetStance: 'standing' | 'crouched'
): HitResult {
  const shooterEyeY =
    shooterStance === 'crouched'
      ? HITBOX.CROUCHED_EYE_Y
      : HITBOX.STANDING_EYE_Y;

  const origin: Vec3 = {
    x: shooterPos.x,
    y: shooterPos.y + shooterEyeY,
    z: shooterPos.z,
  };

  const dir = aimToDirection(shooterFacingYaw, aimYaw, aimPitch);

  // Check head (sphere) — priority
  const headCenterY =
    targetStance === 'crouched'
      ? HITBOX.CROUCHED_HEAD_CENTER_Y
      : HITBOX.STANDING_HEAD_CENTER_Y;
  const headRadius =
    targetStance === 'crouched'
      ? HITBOX.CROUCHED_HEAD_RADIUS
      : HITBOX.STANDING_HEAD_RADIUS;

  const headCenter: Vec3 = {
    x: targetPos.x,
    y: targetPos.y + headCenterY,
    z: targetPos.z,
  };

  if (raySphereIntersect(origin, dir, headCenter, headRadius)) {
    return {
      hit: true,
      zone: 'head',
      damage: S2_MATCH_CONFIG.HEADSHOT_DAMAGE,
    };
  }

  // Check body (AABB)
  const bodyTop =
    targetStance === 'crouched'
      ? HITBOX.CROUCHED_BODY_MAX_Y
      : HITBOX.STANDING_BODY_MAX_Y;

  const bodyMin: Vec3 = {
    x: targetPos.x - HITBOX.BODY_HALF_WIDTH,
    y: targetPos.y + HITBOX.STANDING_BODY_MIN_Y,
    z: targetPos.z - HITBOX.BODY_HALF_DEPTH,
  };
  const bodyMax: Vec3 = {
    x: targetPos.x + HITBOX.BODY_HALF_WIDTH,
    y: targetPos.y + bodyTop,
    z: targetPos.z + HITBOX.BODY_HALF_DEPTH,
  };

  if (rayAABBIntersect(origin, dir, bodyMin, bodyMax)) {
    return {
      hit: true,
      zone: 'body',
      damage: S2_MATCH_CONFIG.BODY_DAMAGE,
    };
  }

  return { hit: false };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/txdm_/.codex/warpath && pnpm --filter @warpath/shared build && cd apps/game-server && npx vitest run src/__tests__/hitDetection.test.ts`
Expected: PASS (9 tests)

- [ ] **Step 5: Commit**

```bash
git add apps/game-server/src/hitDetection.ts apps/game-server/src/__tests__/hitDetection.test.ts
git commit -m "feat: add server-authoritative hit detection with ray-sphere and ray-AABB"
```

---

### Task 6: Spawn Positions & Round Manager

**Files:**
- Create: `apps/game-server/src/positions.ts`
- Create: `apps/game-server/src/roundManager.ts`
- Create: `apps/game-server/src/__tests__/roundManager.test.ts`

- [ ] **Step 1: Create `positions.ts`**

```typescript
// apps/game-server/src/positions.ts
import type { SpawnPair } from '@warpath/shared';

export const ARENA_SPAWN_PAIRS: SpawnPair[] = [
  {
    player0: { x: -2, y: 0, z: 0, facingYaw: 0 },
    player1: { x: 2, y: 0, z: 50, facingYaw: Math.PI },
  },
  {
    player0: { x: 3, y: 0, z: 0, facingYaw: -0.06 },
    player1: { x: -3, y: 0, z: 50, facingYaw: Math.PI + 0.06 },
  },
  {
    player0: { x: 0, y: 0, z: 2, facingYaw: 0.03 },
    player1: { x: 0, y: 0, z: 48, facingYaw: Math.PI - 0.03 },
  },
  {
    player0: { x: -4, y: 0, z: 1, facingYaw: 0.08 },
    player1: { x: 4, y: 0, z: 49, facingYaw: Math.PI - 0.08 },
  },
  {
    player0: { x: 1, y: 0, z: 0, facingYaw: -0.02 },
    player1: { x: -1, y: 0, z: 50, facingYaw: Math.PI + 0.02 },
  },
];
```

- [ ] **Step 2: Write the failing test for round manager**

```typescript
// apps/game-server/src/__tests__/roundManager.test.ts
import { describe, expect, it } from 'vitest';
import { RoundManager } from '../roundManager';
import { S2_MATCH_CONFIG } from '@warpath/shared';

describe('RoundManager', () => {
  it('starts at round 1 in countdown phase', () => {
    const rm = new RoundManager();
    expect(rm.roundNumber).toBe(1);
    expect(rm.phase).toBe('countdown');
    expect(rm.score).toEqual([0, 0]);
  });

  it('transitions from countdown to active', () => {
    const rm = new RoundManager();
    rm.startRound();
    expect(rm.phase).toBe('active');
    expect(rm.timerMs).toBe(S2_MATCH_CONFIG.ROUND_DURATION_MS);
  });

  it('decrements timer on tick', () => {
    const rm = new RoundManager();
    rm.startRound();
    rm.tick(1000);
    expect(rm.timerMs).toBe(S2_MATCH_CONFIG.ROUND_DURATION_MS - 1000);
  });

  it('records a round win when player is killed', () => {
    const rm = new RoundManager();
    rm.startRound();
    const events = rm.onPlayerKilled(0, 1, true);
    expect(rm.phase).toBe('round_over');
    expect(rm.score).toEqual([1, 0]);
    expect(events.some((e) => e.type === 'round_end')).toBe(true);
    const roundEnd = events.find((e) => e.type === 'round_end');
    expect(roundEnd).toBeDefined();
    if (roundEnd?.type === 'round_end') {
      expect(roundEnd.winner).toBe(0);
      expect(roundEnd.score).toEqual([1, 0]);
    }
  });

  it('awards round to higher HP on timeout', () => {
    const rm = new RoundManager();
    rm.startRound();
    const events = rm.onTimerExpired(80, 45);
    expect(rm.phase).toBe('round_over');
    expect(rm.score).toEqual([1, 0]);
    const roundEnd = events.find((e) => e.type === 'round_end');
    if (roundEnd?.type === 'round_end') {
      expect(roundEnd.winner).toBe(0);
    }
  });

  it('declares a draw when HP is tied on timeout', () => {
    const rm = new RoundManager();
    rm.startRound();
    const events = rm.onTimerExpired(50, 50);
    expect(rm.phase).toBe('round_over');
    expect(rm.score).toEqual([0, 0]);
    const roundEnd = events.find((e) => e.type === 'round_end');
    if (roundEnd?.type === 'round_end') {
      expect(roundEnd.winner).toBeNull();
    }
  });

  it('detects match win when a player reaches ROUNDS_TO_WIN', () => {
    const rm = new RoundManager();

    // Win 3 rounds for player 0
    for (let i = 0; i < S2_MATCH_CONFIG.ROUNDS_TO_WIN; i++) {
      rm.startRound();
      rm.onPlayerKilled(0, 1, false);
      if (i < S2_MATCH_CONFIG.ROUNDS_TO_WIN - 1) {
        rm.advanceRound();
      }
    }

    expect(rm.isMatchOver()).toBe(true);
    expect(rm.matchWinner).toBe(0);
  });

  it('plays up to MAX_ROUNDS when no player reaches ROUNDS_TO_WIN', () => {
    const rm = new RoundManager();

    // Alternate wins: 0, 1, 0, 1, 0 → player 0 wins 3-2
    for (let i = 0; i < S2_MATCH_CONFIG.MAX_ROUNDS; i++) {
      rm.startRound();
      const winner = i % 2 === 0 ? 0 : 1;
      const loser = winner === 0 ? 1 : 0;
      rm.onPlayerKilled(winner as 0 | 1, loser as 0 | 1, false);
      if (!rm.isMatchOver()) {
        rm.advanceRound();
      }
    }

    expect(rm.isMatchOver()).toBe(true);
    expect(rm.matchWinner).toBe(0);
    expect(rm.score).toEqual([3, 2]);
  });

  it('builds match result from round history', () => {
    const rm = new RoundManager();

    rm.startRound();
    rm.onPlayerKilled(0, 1, true);
    rm.advanceRound();

    rm.startRound();
    rm.onPlayerKilled(0, 1, false);
    rm.advanceRound();

    rm.startRound();
    rm.onPlayerKilled(0, 1, true);

    expect(rm.isMatchOver()).toBe(true);
    const result = rm.getMatchResult();
    expect(result).not.toBeNull();
    expect(result!.winner).toBe(0);
    expect(result!.rounds).toHaveLength(3);
    expect(result!.rounds[0]!.killerHeadshot).toBe(true);
    expect(result!.rounds[1]!.killerHeadshot).toBe(false);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd /Users/txdm_/.codex/warpath && pnpm --filter @warpath/shared build && cd apps/game-server && npx vitest run src/__tests__/roundManager.test.ts`
Expected: FAIL — module `../roundManager` not found

- [ ] **Step 4: Implement `roundManager.ts`**

```typescript
// apps/game-server/src/roundManager.ts
import { S2_MATCH_CONFIG } from '@warpath/shared';
import type {
  GameEvent,
  S2MatchResult,
  S2RoundResult,
  SpawnPair,
} from '@warpath/shared';
import { ARENA_SPAWN_PAIRS } from './positions';

type RoundPhase = 'countdown' | 'active' | 'round_over' | 'match_over';

export class RoundManager {
  roundNumber = 1;
  phase: RoundPhase = 'countdown';
  timerMs = 0;
  score: [number, number] = [0, 0];
  matchWinner: 0 | 1 | null = null;

  private roundResults: S2RoundResult[] = [];
  private roundStartMs = 0;
  private currentRoundHeadshot = false;
  private currentRoundKiller: 0 | 1 | null = null;
  private spawnIndex = 0;

  getCurrentSpawn(): SpawnPair {
    return ARENA_SPAWN_PAIRS[
      this.spawnIndex % ARENA_SPAWN_PAIRS.length
    ]!;
  }

  startRound(): GameEvent {
    this.phase = 'active';
    this.timerMs = S2_MATCH_CONFIG.ROUND_DURATION_MS;
    this.roundStartMs = Date.now();
    this.currentRoundHeadshot = false;
    this.currentRoundKiller = null;

    const spawn = this.getCurrentSpawn();

    return {
      type: 'round_start',
      round: this.roundNumber,
      positions: [
        { yaw: 0, pitch: 0 },
        { yaw: 0, pitch: 0 },
      ],
    };
  }

  tick(deltaMs: number): void {
    if (this.phase === 'active') {
      this.timerMs = Math.max(0, this.timerMs - deltaMs);
    }
  }

  onPlayerKilled(
    killer: 0 | 1,
    _victim: 0 | 1,
    headshot: boolean
  ): GameEvent[] {
    if (this.phase !== 'active') return [];

    this.currentRoundKiller = killer;
    this.currentRoundHeadshot = headshot;

    return this.endRound(killer);
  }

  onTimerExpired(player0Hp: number, player1Hp: number): GameEvent[] {
    if (this.phase !== 'active') return [];

    let winner: 0 | 1 | null = null;
    if (player0Hp > player1Hp) {
      winner = 0;
    } else if (player1Hp > player0Hp) {
      winner = 1;
    }
    // Tied HP = draw (winner stays null)

    return this.endRound(winner);
  }

  private endRound(winner: 0 | 1 | null): GameEvent[] {
    this.phase = 'round_over';

    if (winner !== null) {
      this.score[winner]++;
    }

    const durationMs = S2_MATCH_CONFIG.ROUND_DURATION_MS - this.timerMs;

    this.roundResults.push({
      round: this.roundNumber,
      winner,
      killerHeadshot: this.currentRoundHeadshot,
      player0Hp: 0, // Caller sets actual HP
      player1Hp: 0, // Caller sets actual HP
      durationMs,
    });

    const events: GameEvent[] = [
      {
        type: 'round_end',
        winner,
        score: [this.score[0], this.score[1]],
      },
    ];

    if (this.isMatchOver()) {
      this.phase = 'match_over';
      this.matchWinner =
        this.score[0] > this.score[1] ? 0 : 1;

      events.push({
        type: 'match_end',
        winner: this.matchWinner,
        finalScore: [this.score[0], this.score[1]],
      });
    }

    return events;
  }

  advanceRound(): void {
    this.roundNumber++;
    this.spawnIndex++;
    this.phase = 'countdown';
  }

  isMatchOver(): boolean {
    return (
      this.score[0] >= S2_MATCH_CONFIG.ROUNDS_TO_WIN ||
      this.score[1] >= S2_MATCH_CONFIG.ROUNDS_TO_WIN ||
      this.roundNumber >= S2_MATCH_CONFIG.MAX_ROUNDS
    );
  }

  getMatchResult(): S2MatchResult | null {
    if (!this.isMatchOver()) return null;

    const winner: 0 | 1 =
      this.score[0] > this.score[1] ? 0 : 1;

    return {
      winner,
      rounds: this.roundResults,
      leftScore: 0,
      rightScore: 0,
    };
  }

  /** Update the last round result with actual HP values. */
  setRoundHp(player0Hp: number, player1Hp: number): void {
    const last = this.roundResults[this.roundResults.length - 1];
    if (last) {
      last.player0Hp = player0Hp;
      last.player1Hp = player1Hp;
    }
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd /Users/txdm_/.codex/warpath && pnpm --filter @warpath/shared build && cd apps/game-server && npx vitest run src/__tests__/roundManager.test.ts`
Expected: PASS (9 tests)

- [ ] **Step 6: Commit**

```bash
git add apps/game-server/src/positions.ts apps/game-server/src/roundManager.ts apps/game-server/src/__tests__/roundManager.test.ts
git commit -m "feat: add spawn positions and round/match lifecycle manager"
```

---

### Task 7: Game Room (Core Game Loop)

**Files:**
- Create: `apps/game-server/src/gameRoom.ts`
- Create: `apps/game-server/src/__tests__/gameRoom.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// apps/game-server/src/__tests__/gameRoom.test.ts
import { describe, expect, it } from 'vitest';
import { GameRoom } from '../gameRoom';
import { S2_MATCH_CONFIG } from '@warpath/shared';
import type { ClientInput } from '@warpath/shared';

const noInput: ClientInput = {
  aimYaw: 0,
  aimPitch: 0,
  fire: false,
  scope: false,
  scopeZoom: 1,
  crouch: false,
  reload: false,
  timestamp: 0,
};

describe('GameRoom', () => {
  it('initializes in countdown phase at round 1', () => {
    const room = new GameRoom();
    expect(room.phase).toBe('countdown');
    expect(room.roundNumber).toBe(1);
  });

  it('starts round and produces game state on tick', () => {
    const room = new GameRoom();
    room.startRound();
    const state = room.processTick([noInput, noInput]);
    expect(state.tick).toBe(1);
    expect(state.roundNumber).toBe(1);
    expect(state.players[0].hp).toBe(S2_MATCH_CONFIG.PLAYER_HP);
    expect(state.players[1].hp).toBe(S2_MATCH_CONFIG.PLAYER_HP);
    expect(state.players[0].ammo).toBe(S2_MATCH_CONFIG.MAGAZINE_SIZE);
  });

  it('processes a fire event and deals damage', () => {
    const room = new GameRoom();
    room.startRound();

    // Run a few idle ticks first to establish game time
    for (let i = 0; i < 5; i++) {
      room.processTick([noInput, noInput]);
    }

    // Player 0 fires, aiming directly at player 1 (default aim = 0,0 = forward)
    const fireInput: ClientInput = {
      ...noInput,
      fire: true,
      timestamp: Date.now(),
    };
    const state = room.processTick([fireInput, noInput]);

    // Should have a hit event (headshot or body depending on geometry)
    const hitEvents = state.events.filter((e) => e.type === 'hit');
    expect(hitEvents.length).toBeGreaterThanOrEqual(1);

    // Player 1 should have taken damage
    expect(state.players[1].hp).toBeLessThan(S2_MATCH_CONFIG.PLAYER_HP);
  });

  it('enforces bolt-action cooldown between shots', () => {
    const room = new GameRoom();
    room.startRound();

    // First shot
    const fire: ClientInput = { ...noInput, fire: true, timestamp: Date.now() };
    const state1 = room.processTick([fire, noInput]);
    const hits1 = state1.events.filter((e) => e.type === 'hit');

    // Second shot immediately — should not fire (bolt cycle)
    const state2 = room.processTick([fire, noInput]);
    const hits2 = state2.events.filter((e) => e.type === 'hit');
    expect(hits2).toHaveLength(0);
  });

  it('resolves a full match with a winner', () => {
    const room = new GameRoom();
    let matchEnded = false;
    let matchWinner: 0 | 1 | null = null;

    // Play rounds until match ends
    for (let round = 0; round < S2_MATCH_CONFIG.MAX_ROUNDS && !matchEnded; round++) {
      room.startRound();

      // Player 0 fires enough shots to kill player 1
      for (let tick = 0; tick < 200 && !matchEnded; tick++) {
        const elapsed = tick * (1000 / S2_MATCH_CONFIG.TICK_RATE);
        const shouldFire = elapsed % S2_MATCH_CONFIG.BOLT_CYCLE_MS < (1000 / S2_MATCH_CONFIG.TICK_RATE);
        const input: ClientInput = {
          ...noInput,
          fire: shouldFire,
          timestamp: Date.now(),
        };
        const state = room.processTick([input, noInput]);

        for (const event of state.events) {
          if (event.type === 'match_end') {
            matchEnded = true;
            matchWinner = event.winner;
          }
        }
      }

      if (!matchEnded) {
        room.advanceRound();
      }
    }

    expect(matchEnded).toBe(true);
    expect(matchWinner).toBe(0);

    const result = room.getMatchResult();
    expect(result).not.toBeNull();
    expect(result!.winner).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/txdm_/.codex/warpath && pnpm --filter @warpath/shared build && cd apps/game-server && npx vitest run src/__tests__/gameRoom.test.ts`
Expected: FAIL — module `../gameRoom` not found

- [ ] **Step 3: Implement `gameRoom.ts`**

```typescript
// apps/game-server/src/gameRoom.ts
import { S2_MATCH_CONFIG } from '@warpath/shared';
import type {
  ClientInput,
  GameEvent,
  GameState,
  PlayerState,
  S2MatchResult,
  SpawnPair,
} from '@warpath/shared';
import { MutablePlayerState } from './playerState';
import { checkHit } from './hitDetection';
import { RoundManager } from './roundManager';

const TICK_MS = 1000 / S2_MATCH_CONFIG.TICK_RATE;
const HISTORY_SIZE = 6;

export class GameRoom {
  private players: [MutablePlayerState, MutablePlayerState] = [
    new MutablePlayerState(),
    new MutablePlayerState(),
  ];
  private roundManager = new RoundManager();
  private tickCount = 0;
  private elapsedMs = 0;
  private stateHistory: Array<[PlayerState, PlayerState]> = [];

  get phase(): string {
    return this.roundManager.phase;
  }

  get roundNumber(): number {
    return this.roundManager.roundNumber;
  }

  startRound(): GameEvent {
    this.players[0].reset();
    this.players[1].reset();
    return this.roundManager.startRound();
  }

  advanceRound(): void {
    this.roundManager.advanceRound();
  }

  getCurrentSpawn(): SpawnPair {
    return this.roundManager.getCurrentSpawn();
  }

  processTick(
    inputs: [ClientInput | null, ClientInput | null]
  ): GameState {
    this.tickCount++;
    this.elapsedMs += TICK_MS;

    const events: GameEvent[] = [];

    // Save current state to history before mutations
    this.stateHistory.push([
      this.players[0].snapshot(),
      this.players[1].snapshot(),
    ]);
    if (this.stateHistory.length > HISTORY_SIZE) {
      this.stateHistory.shift();
    }

    // Apply inputs (aim, stance, scope)
    for (let i = 0; i < 2; i++) {
      const input = inputs[i];
      if (input) {
        this.players[i]!.applyInput(input, this.elapsedMs);

        if (input.reload && !this.players[i]!.reloading) {
          this.players[i]!.startReload(this.elapsedMs);
        }
      }
    }

    // Process fire events (only if round is active)
    if (this.roundManager.phase === 'active') {
      for (let i = 0; i < 2; i++) {
        const input = inputs[i];
        const shooter = this.players[i]!;
        const targetIdx = i === 0 ? 1 : 0;
        const target = this.players[targetIdx]!;

        if (
          input?.fire &&
          shooter.canFire(this.elapsedMs) &&
          shooter.alive &&
          target.alive
        ) {
          shooter.fire(this.elapsedMs);

          // Lag compensation: look up historical target stance
          const lagTicks = this.estimateLagTicks(input.timestamp);
          const historicalTarget = this.getHistoricalState(
            targetIdx as 0 | 1,
            lagTicks
          );
          const targetStance =
            historicalTarget?.stance ?? target.stance;

          const spawn = this.getCurrentSpawn();
          const shooterPos =
            i === 0 ? spawn.player0 : spawn.player1;
          const targetPos =
            i === 0 ? spawn.player1 : spawn.player0;

          const result = checkHit(
            shooterPos,
            shooterPos.facingYaw,
            shooter.stance,
            input.aimYaw,
            input.aimPitch,
            targetPos,
            targetStance
          );

          if (result.hit) {
            target.takeDamage(result.damage);
            events.push({
              type: 'hit',
              target: targetIdx as 0 | 1,
              zone: result.zone,
              damage: result.damage,
            });

            if (!target.alive) {
              const headshot = result.zone === 'head';
              events.push({
                type: 'kill',
                killer: i as 0 | 1,
                victim: targetIdx as 0 | 1,
                headshot,
              });
              const roundEvents = this.roundManager.onPlayerKilled(
                i as 0 | 1,
                targetIdx as 0 | 1,
                headshot
              );
              this.roundManager.setRoundHp(
                this.players[0].hp,
                this.players[1].hp
              );
              events.push(...roundEvents);
            }
          }
        }
      }
    }

    // Update reload timers
    for (const player of this.players) {
      player.updateReload(this.elapsedMs);
    }

    // Update round timer
    if (this.roundManager.phase === 'active') {
      this.roundManager.tick(TICK_MS);

      // Check timer expiry
      if (this.roundManager.timerMs <= 0) {
        const timerEvents = this.roundManager.onTimerExpired(
          this.players[0].hp,
          this.players[1].hp
        );
        this.roundManager.setRoundHp(
          this.players[0].hp,
          this.players[1].hp
        );
        events.push(...timerEvents);
      }
    }

    return {
      tick: this.tickCount,
      roundNumber: this.roundManager.roundNumber,
      roundTimer: this.roundManager.timerMs,
      players: [
        this.players[0].snapshot(),
        this.players[1].snapshot(),
      ],
      events,
    };
  }

  getMatchResult(): S2MatchResult | null {
    return this.roundManager.getMatchResult();
  }

  isMatchOver(): boolean {
    return this.roundManager.isMatchOver();
  }

  private estimateLagTicks(clientTimestamp: number): number {
    if (clientTimestamp <= 0) return 0;
    const rttEstimate = Date.now() - clientTimestamp;
    const lagMs = Math.max(0, rttEstimate / 2);
    return Math.min(
      Math.round(lagMs / TICK_MS),
      HISTORY_SIZE - 1
    );
  }

  private getHistoricalState(
    playerIndex: 0 | 1,
    lagTicks: number
  ): PlayerState | null {
    const idx = this.stateHistory.length - 1 - lagTicks;
    if (idx < 0 || idx >= this.stateHistory.length) return null;
    return this.stateHistory[idx]![playerIndex];
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/txdm_/.codex/warpath && pnpm --filter @warpath/shared build && cd apps/game-server && npx vitest run src/__tests__/gameRoom.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add apps/game-server/src/gameRoom.ts apps/game-server/src/__tests__/gameRoom.test.ts
git commit -m "feat: add game room core loop with tick processing and lag compensation"
```

---

### Task 8: Database Auth Module

**Files:**
- Create: `apps/game-server/src/db.ts`
- Create: `apps/game-server/src/auth.ts`

- [ ] **Step 1: Implement `db.ts`**

```typescript
// apps/game-server/src/db.ts
import pg from 'pg';

const databaseUrl = process.env['DATABASE_URL'];

if (!databaseUrl) {
  console.warn(
    'DATABASE_URL not set — room auth will fail. Set it for production.'
  );
}

export const pool = databaseUrl ? new pg.Pool({ connectionString: databaseUrl }) : null;
```

- [ ] **Step 2: Implement `auth.ts`**

```typescript
// apps/game-server/src/auth.ts
import { pool } from './db';

export interface BattleInfo {
  id: string;
  leftAddress: string;
  leftToken: number;
  rightAddress: string;
  rightToken: number;
  roomId: string;
  roomTokenLeft: string;
  roomTokenRight: string;
  status: string;
}

export async function verifyRoomToken(
  roomId: string,
  roomToken: string
): Promise<{ battle: BattleInfo; playerIndex: 0 | 1 } | null> {
  if (!pool) return null;

  const result = await pool.query<{
    id: string;
    left_address: string;
    left_token: number;
    right_address: string;
    right_token: number;
    room_id: string;
    room_token_left: string;
    room_token_right: string;
    status: string;
  }>(
    `SELECT id, left_address, left_token, right_address, right_token,
            room_id, room_token_left, room_token_right, status
     FROM s2_battles
     WHERE room_id = $1
       AND status IN ('pending', 'active')
     LIMIT 1`,
    [roomId]
  );

  const row = result.rows[0];
  if (!row) return null;

  let playerIndex: 0 | 1;
  if (row.room_token_left === roomToken) {
    playerIndex = 0;
  } else if (row.room_token_right === roomToken) {
    playerIndex = 1;
  } else {
    return null;
  }

  const battle: BattleInfo = {
    id: row.id,
    leftAddress: row.left_address,
    leftToken: row.left_token,
    rightAddress: row.right_address,
    rightToken: row.right_token,
    roomId: row.room_id,
    roomTokenLeft: row.room_token_left,
    roomTokenRight: row.room_token_right,
    status: row.status,
  };

  return { battle, playerIndex };
}

export async function markBattleActive(battleId: string): Promise<void> {
  if (!pool) return;
  await pool.query(
    `UPDATE s2_battles SET status = 'active', updated_at = NOW() WHERE id = $1 AND status = 'pending'`,
    [battleId]
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/game-server/src/db.ts apps/game-server/src/auth.ts
git commit -m "feat: add database auth module for room token verification"
```

---

### Task 9: Result Reporter

**Files:**
- Create: `apps/game-server/src/resultReporter.ts`

- [ ] **Step 1: Implement `resultReporter.ts`**

```typescript
// apps/game-server/src/resultReporter.ts
import { S2_GAME_SERVER_SECRET_HEADER } from '@warpath/shared';
import type { S2MatchResult } from '@warpath/shared';

const API_URL = process.env['API_URL'] ?? 'http://localhost:3001';
const SERVER_SECRET = process.env['S2_GAME_SERVER_SECRET'] ?? '';

export async function reportMatchResult(
  battleId: string,
  result: S2MatchResult
): Promise<boolean> {
  if (!SERVER_SECRET) {
    console.error('S2_GAME_SERVER_SECRET not set — cannot report result');
    return false;
  }

  try {
    const response = await fetch(`${API_URL}/api/s2/results`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [S2_GAME_SERVER_SECRET_HEADER]: SERVER_SECRET,
      },
      body: JSON.stringify({
        battleId,
        result,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(
        `Result report failed: ${response.status} ${body}`
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error('Result report error:', error);
    return false;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/game-server/src/resultReporter.ts
git commit -m "feat: add match result reporter (POST to API)"
```

---

### Task 10: Room Manager

**Files:**
- Create: `apps/game-server/src/room.ts`

- [ ] **Step 1: Implement `room.ts`**

This file bridges WebSocket connections with the pure GameRoom logic.

```typescript
// apps/game-server/src/room.ts
import { S2_MATCH_CONFIG } from '@warpath/shared';
import type { ClientInput, ServerMessage } from '@warpath/shared';
import type { BattleInfo } from './auth';
import { markBattleActive } from './auth';
import { GameRoom } from './gameRoom';
import { parseClientMessage, serializeServerMessage } from './protocol';
import { reportMatchResult } from './resultReporter';

const TICK_MS = 1000 / S2_MATCH_CONFIG.TICK_RATE;
const COUNTDOWN_SECONDS = 3;

interface RoomConnection {
  send(data: string): void;
  close(): void;
}

export class Room {
  readonly battleId: string;
  private connections: [RoomConnection | null, RoomConnection | null] = [
    null,
    null,
  ];
  private inputs: [ClientInput | null, ClientInput | null] = [null, null];
  private game: GameRoom;
  private tickInterval: ReturnType<typeof setInterval> | null = null;
  private countdownInterval: ReturnType<typeof setInterval> | null = null;
  private battle: BattleInfo;
  private disposed = false;
  private onDispose: (() => void) | null = null;

  constructor(battle: BattleInfo, onDispose?: () => void) {
    this.battle = battle;
    this.battleId = battle.id;
    this.game = new GameRoom();
    this.onDispose = onDispose ?? null;
  }

  addConnection(ws: RoomConnection, playerIndex: 0 | 1): void {
    this.connections[playerIndex] = ws;

    if (this.connections[0] && this.connections[1]) {
      this.startCountdown();
    } else {
      this.send(playerIndex, {
        type: 'waiting',
        message: 'Waiting for opponent to connect...',
      });
    }
  }

  handleMessage(playerIndex: 0 | 1, raw: string): void {
    const msg = parseClientMessage(raw);
    if (!msg) return;

    if (msg.type === 'input') {
      this.inputs[playerIndex] = msg.input;
    } else if (msg.type === 'ping') {
      this.send(playerIndex, { type: 'pong' });
    }
  }

  handleDisconnect(playerIndex: 0 | 1): void {
    this.connections[playerIndex] = null;

    if (this.tickInterval && !this.disposed) {
      // Forfeit: opponent wins
      const winner: 0 | 1 = playerIndex === 0 ? 1 : 0;
      this.endMatchForfeit(winner);
    }
  }

  private async startCountdown(): Promise<void> {
    await markBattleActive(this.battle.id);

    let remaining = COUNTDOWN_SECONDS;
    const spawn = this.game.getCurrentSpawn();

    this.broadcast({
      type: 'countdown',
      seconds: remaining,
      round: this.game.roundNumber,
    });

    this.countdownInterval = setInterval(() => {
      remaining--;
      if (remaining <= 0) {
        if (this.countdownInterval) clearInterval(this.countdownInterval);
        this.countdownInterval = null;
        this.startRound();
      } else {
        this.broadcast({
          type: 'countdown',
          seconds: remaining,
          round: this.game.roundNumber,
        });
      }
    }, 1000);
  }

  private startRound(): void {
    const startEvent = this.game.startRound();
    this.broadcast({
      type: 'state',
      state: {
        tick: 0,
        roundNumber: this.game.roundNumber,
        roundTimer: S2_MATCH_CONFIG.ROUND_DURATION_MS,
        players: [
          {
            aimYaw: 0,
            aimPitch: 0,
            stance: 'standing',
            scoped: false,
            hp: S2_MATCH_CONFIG.PLAYER_HP,
            ammo: S2_MATCH_CONFIG.MAGAZINE_SIZE,
            reloading: false,
            alive: true,
          },
          {
            aimYaw: 0,
            aimPitch: 0,
            stance: 'standing',
            scoped: false,
            hp: S2_MATCH_CONFIG.PLAYER_HP,
            ammo: S2_MATCH_CONFIG.MAGAZINE_SIZE,
            reloading: false,
            alive: true,
          },
        ],
        events: [startEvent],
      },
    });

    this.tickInterval = setInterval(() => this.tick(), TICK_MS);
  }

  private tick(): void {
    const state = this.game.processTick([
      this.inputs[0],
      this.inputs[1],
    ]);

    // Clear inputs for next tick
    this.inputs = [null, null];

    this.broadcast({ type: 'state', state });

    // Check events for round/match transitions
    for (const event of state.events) {
      if (event.type === 'match_end') {
        this.endMatch(event.winner, event.finalScore);
        return;
      }
      if (event.type === 'round_end' && !this.game.isMatchOver()) {
        // Pause ticks, advance round, start countdown for next round
        if (this.tickInterval) clearInterval(this.tickInterval);
        this.tickInterval = null;

        setTimeout(() => {
          this.game.advanceRound();
          this.startCountdown();
        }, 2000);
        return;
      }
    }
  }

  private async endMatch(
    winner: 0 | 1,
    finalScore: [number, number]
  ): Promise<void> {
    if (this.disposed) return;
    this.disposed = true;

    if (this.tickInterval) clearInterval(this.tickInterval);
    if (this.countdownInterval) clearInterval(this.countdownInterval);

    this.broadcast({
      type: 'match_result',
      winner,
      finalScore,
    });

    const result = this.game.getMatchResult();
    if (result) {
      await reportMatchResult(this.battle.id, result);
    }

    setTimeout(() => this.cleanup(), 2000);
  }

  private async endMatchForfeit(winner: 0 | 1): Promise<void> {
    if (this.disposed) return;
    this.disposed = true;

    if (this.tickInterval) clearInterval(this.tickInterval);
    if (this.countdownInterval) clearInterval(this.countdownInterval);

    const result = this.game.getMatchResult();
    if (result) {
      await reportMatchResult(this.battle.id, result);
    }

    this.cleanup();
  }

  private cleanup(): void {
    for (const conn of this.connections) {
      try {
        conn?.close();
      } catch {
        // Connection may already be closed
      }
    }
    this.connections = [null, null];
    this.onDispose?.();
  }

  private send(playerIndex: 0 | 1, msg: ServerMessage): void {
    const conn = this.connections[playerIndex];
    if (conn) {
      conn.send(serializeServerMessage(msg));
    }
  }

  private broadcast(msg: ServerMessage): void {
    const data = serializeServerMessage(msg);
    for (const conn of this.connections) {
      if (conn) {
        conn.send(data);
      }
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/game-server/src/room.ts
git commit -m "feat: add room manager bridging WebSocket connections to game loop"
```

---

### Task 11: Bun WebSocket Server Entry

**Files:**
- Modify: `apps/game-server/src/index.ts`

- [ ] **Step 1: Implement the full server entry**

Replace the placeholder `apps/game-server/src/index.ts` with:

```typescript
// apps/game-server/src/index.ts
import type { ServerWebSocket } from 'bun';
import { verifyRoomToken } from './auth';
import { parseClientMessage, serializeServerMessage } from './protocol';
import { Room } from './room';

interface WsData {
  roomId: string | null;
  playerIndex: 0 | 1 | null;
  authenticated: boolean;
}

const rooms = new Map<string, Room>();

const PORT = Number(process.env['PORT'] ?? 3002);

const server = Bun.serve<WsData>({
  port: PORT,

  fetch(req, server) {
    const url = new URL(req.url);

    if (url.pathname === '/health') {
      return new Response(
        JSON.stringify({
          status: 'ok',
          rooms: rooms.size,
          timestamp: new Date().toISOString(),
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    const upgraded = server.upgrade(req, {
      data: {
        roomId: null,
        playerIndex: null,
        authenticated: false,
      },
    });

    if (upgraded) return undefined;

    return new Response('Expected WebSocket connection', {
      status: 426,
    });
  },

  websocket: {
    open(_ws) {
      // Wait for auth message
    },

    async message(ws: ServerWebSocket<WsData>, message) {
      const raw =
        typeof message === 'string'
          ? message
          : new TextDecoder().decode(message);

      if (!ws.data.authenticated) {
        await handleAuth(ws, raw);
        return;
      }

      const roomId = ws.data.roomId;
      if (!roomId) return;

      const room = rooms.get(roomId);
      if (!room) return;

      room.handleMessage(ws.data.playerIndex!, raw);
    },

    close(ws: ServerWebSocket<WsData>) {
      if (!ws.data.roomId || ws.data.playerIndex === null) return;

      const room = rooms.get(ws.data.roomId);
      if (room) {
        room.handleDisconnect(ws.data.playerIndex);
      }
    },
  },
});

async function handleAuth(
  ws: ServerWebSocket<WsData>,
  raw: string
): Promise<void> {
  const msg = parseClientMessage(raw);

  if (msg?.type !== 'auth') {
    ws.send(
      serializeServerMessage({
        type: 'auth_error',
        reason: 'Expected auth message as first message',
      })
    );
    ws.close();
    return;
  }

  const verified = await verifyRoomToken(msg.roomId, msg.roomToken);

  if (!verified) {
    ws.send(
      serializeServerMessage({
        type: 'auth_error',
        reason: 'Invalid room ID or token',
      })
    );
    ws.close();
    return;
  }

  const { battle, playerIndex } = verified;

  ws.data.roomId = msg.roomId;
  ws.data.playerIndex = playerIndex;
  ws.data.authenticated = true;

  let room = rooms.get(msg.roomId);
  if (!room) {
    room = new Room(battle, () => {
      rooms.delete(msg.roomId);
    });
    rooms.set(msg.roomId, room);
  }

  ws.send(
    serializeServerMessage({
      type: 'auth_ok',
      playerIndex,
      battleId: battle.id,
      opponentAddress:
        playerIndex === 0 ? battle.rightAddress : battle.leftAddress,
      opponentTokenId:
        playerIndex === 0 ? battle.rightToken : battle.leftToken,
    })
  );

  // Wrap Bun WS as RoomConnection interface
  const connection = {
    send: (data: string) => {
      try {
        ws.send(data);
      } catch {
        // Connection may be closing
      }
    },
    close: () => {
      try {
        ws.close();
      } catch {
        // Already closed
      }
    },
  };

  room.addConnection(connection, playerIndex);
}

console.log(`Deadshot game server running on port ${PORT}`);
console.log(`Health check: http://localhost:${PORT}/health`);
```

- [ ] **Step 2: Typecheck**

Run: `cd /Users/txdm_/.codex/warpath && pnpm --filter @warpath/shared build && pnpm --filter @warpath/game-server exec tsc --noEmit -p tsconfig.json`
Expected: May have Bun type issues — if so, install `@types/bun` or add `bun-types` to tsconfig. Fix type errors by adding:

In `apps/game-server/tsconfig.json`, add to `compilerOptions`:
```json
"types": ["bun-types"]
```

And add to `apps/game-server/package.json` devDependencies:
```json
"bun-types": "^1.0.0"
```

Then `pnpm install` and re-run typecheck.

- [ ] **Step 3: Commit**

```bash
git add apps/game-server/src/index.ts apps/game-server/tsconfig.json apps/game-server/package.json pnpm-lock.yaml
git commit -m "feat: add Bun WebSocket server entry with room routing and auth"
```

---

### Task 12: Full Typecheck and Test Pass

**Files:** None (verification only)

- [ ] **Step 1: Build all packages**

Run: `cd /Users/txdm_/.codex/warpath && pnpm build`
Expected: Clean build

- [ ] **Step 2: Run full typecheck**

Run: `cd /Users/txdm_/.codex/warpath && pnpm typecheck`
Expected: No type errors

Also run the game server typecheck explicitly:
Run: `cd /Users/txdm_/.codex/warpath && pnpm --filter @warpath/game-server exec tsc --noEmit -p tsconfig.json`
Expected: No errors

- [ ] **Step 3: Run all tests**

Run: `cd /Users/txdm_/.codex/warpath && pnpm test`
Expected: All tests pass across all packages (shared, api, web, game-server)

Also run game server tests explicitly:
Run: `cd /Users/txdm_/.codex/warpath && pnpm --filter @warpath/game-server test`
Expected: All game server tests pass

- [ ] **Step 4: Fix any issues found and commit**

If any tests fail or type errors are found, fix them and commit:

```bash
git add -A
git commit -m "fix: resolve typecheck and test issues from game server implementation"
```
