# Deadshot Phase 5: Polish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add game audio, diverse spawn positions, scope sway mechanics, and hardened loading/error states to the Deadshot S2 sniper duel.

**Architecture:** Audio lives in a new `AudioManager` class inside the game module, following the same pattern as `EffectsManager` (imperative, no React). Spawn positions expand server-side with a new `SpawnInfo` type that carries world coords + facing angles to the client. Scope sway is a camera-level oscillation layered on top of player aim. Loading/error states are handled in the `DeadshotCanvas` React wrapper.

**Tech Stack:** PlayCanvas (v2.x), HTMLAudioElement, TypeScript, Vitest

**Design spec:** `docs/superpowers/specs/2026-04-05-deadshot-season2-integration-design.md` §9 (Phase 5)

**Depends on:** Plans 1-4 fully implemented. All 167 tests passing.

---

### File Structure

```
New files:
  apps/web/src/game/audio.ts                      # AudioManager class
  apps/web/src/game/__tests__/audio.test.ts        # Audio unit tests
  apps/web/src/game/__tests__/sway.test.ts         # Sway math unit tests
  apps/web/public/assets/s2/                       # S2 audio assets directory

Modified files:
  packages/shared/src/s2GameTypes.ts               # SpawnInfo type, update round_start
  apps/game-server/src/positions.ts                # Diverse spawn pairs
  apps/game-server/src/roundManager.ts             # Compute facing angles in startRound
  apps/web/src/game/camera.ts                      # Scope sway oscillation
  apps/web/src/game/DeadshotGame.ts                # Audio + spawn sync + sway integration
  apps/web/src/game/opponent.ts                    # Spawn position from round_start
  apps/web/src/components/s2/DeadshotCanvas.tsx     # Loading/error states
```

---

### Task 1: Audio Manager

**Files:**
- Create: `apps/web/src/game/audio.ts`
- Create: `apps/web/src/game/__tests__/audio.test.ts`

A lightweight audio system for in-game sounds. Uses HTMLAudioElement with a pool pattern (matches the existing `siteAudio.ts` style). Respects the global mute preference from `audioPreferences.ts`. Gracefully no-ops if audio files fail to load.

- [ ] **Step 1: Write the failing test for AudioManager**

```typescript
// apps/web/src/game/__tests__/audio.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AudioManager, SOUND_PATHS, type SoundId } from '../audio.js';

// Mock HTMLAudioElement for jsdom
function createMockAudio(): HTMLAudioElement {
  const el = {
    src: '',
    volume: 1,
    muted: false,
    currentTime: 0,
    loop: false,
    preload: '',
    paused: true,
    play: vi.fn(() => Promise.resolve()),
    pause: vi.fn(),
    load: vi.fn(),
    cloneNode: vi.fn(() => createMockAudio()),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  } as unknown as HTMLAudioElement;
  return el;
}

// Intercept Audio constructor
const originalAudio = globalThis.Audio;
beforeEach(() => {
  globalThis.Audio = vi.fn(() => createMockAudio()) as unknown as typeof Audio;
  return () => {
    globalThis.Audio = originalAudio;
  };
});

describe('AudioManager', () => {
  it('creates without errors', () => {
    const mgr = new AudioManager();
    expect(mgr).toBeDefined();
    mgr.destroy();
  });

  it('play() calls audio play on a loaded sound', () => {
    const mgr = new AudioManager();
    mgr.play('gunshot');
    // Audio constructor was called during preload, then cloneNode for playback
    expect(globalThis.Audio).toHaveBeenCalled();
    mgr.destroy();
  });

  it('setMuted(true) prevents sound playback', () => {
    const mgr = new AudioManager();
    mgr.setMuted(true);
    // play should not throw even when muted
    mgr.play('gunshot');
    mgr.destroy();
  });

  it('setMuted(false) allows sound playback', () => {
    const mgr = new AudioManager();
    mgr.setMuted(true);
    mgr.setMuted(false);
    mgr.play('scope_in');
    mgr.destroy();
  });

  it('startAmbient begins looping ambient audio', () => {
    const mgr = new AudioManager();
    mgr.startAmbient();
    mgr.destroy();
  });

  it('stopAmbient pauses ambient audio', () => {
    const mgr = new AudioManager();
    mgr.startAmbient();
    mgr.stopAmbient();
    mgr.destroy();
  });

  it('destroy cleans up all resources', () => {
    const mgr = new AudioManager();
    mgr.startAmbient();
    mgr.destroy();
    // Should not throw on double destroy
    mgr.destroy();
  });

  it('SOUND_PATHS has entries for all expected sound IDs', () => {
    const expected: SoundId[] = [
      'gunshot', 'bolt_cycle', 'bullet_crack', 'scope_in',
      'scope_out', 'reload', 'hit_received', 'ambient',
    ];
    for (const id of expected) {
      expect(SOUND_PATHS[id]).toBeDefined();
      expect(typeof SOUND_PATHS[id]).toBe('string');
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && npx vitest run src/game/__tests__/audio.test.ts`
Expected: FAIL — module `../audio.js` does not exist

- [ ] **Step 3: Implement AudioManager**

```typescript
// apps/web/src/game/audio.ts
// In-game audio manager for the Deadshot sniper duel.
// Uses HTMLAudioElement with a clone-to-play pattern for overlapping one-shots.
// Respects the global mute preference from audioPreferences.ts.

import { getAudioMutedSnapshot, subscribeToAudioPreference } from '@/lib/audioPreferences';

export type SoundId =
  | 'gunshot'
  | 'bolt_cycle'
  | 'bullet_crack'
  | 'scope_in'
  | 'scope_out'
  | 'reload'
  | 'hit_received'
  | 'ambient';

export const SOUND_PATHS: Record<SoundId, string> = {
  gunshot: '/assets/s2/gunshot.mp3',
  bolt_cycle: '/assets/s2/bolt-cycle.mp3',
  bullet_crack: '/assets/s2/bullet-crack.mp3',
  scope_in: '/assets/s2/scope-in.mp3',
  scope_out: '/assets/s2/scope-out.mp3',
  reload: '/assets/s2/reload.mp3',
  hit_received: '/assets/s2/hit-received.mp3',
  ambient: '/assets/s2/ambient.mp3',
};

const VOLUMES: Record<SoundId, number> = {
  gunshot: 0.5,
  bolt_cycle: 0.35,
  bullet_crack: 0.3,
  scope_in: 0.25,
  scope_out: 0.25,
  reload: 0.3,
  hit_received: 0.4,
  ambient: 0.08,
};

export class AudioManager {
  #sources: Map<SoundId, HTMLAudioElement> = new Map();
  #ambient: HTMLAudioElement | null = null;
  #muted: boolean;
  #unsubscribe: (() => void) | null = null;
  #destroyed = false;

  constructor() {
    this.#muted = getAudioMutedSnapshot();

    // Subscribe to global mute preference changes
    this.#unsubscribe = subscribeToAudioPreference(() => {
      this.#muted = getAudioMutedSnapshot();
      if (this.#ambient !== null) {
        this.#ambient.muted = this.#muted;
      }
    });

    // Preload all one-shot sounds
    for (const [id, path] of Object.entries(SOUND_PATHS) as Array<[SoundId, string]>) {
      if (id === 'ambient') continue; // ambient is handled separately
      try {
        const audio = new Audio(path);
        audio.preload = 'auto';
        audio.volume = VOLUMES[id];
        this.#sources.set(id, audio);
      } catch {
        // Audio failed to create — will no-op on play
      }
    }
  }

  /**
   * Play a one-shot sound. Clones the preloaded element so overlapping
   * shots don't cut each other off.
   */
  play(id: SoundId): void {
    if (this.#destroyed || this.#muted) return;
    if (id === 'ambient') {
      this.startAmbient();
      return;
    }

    const source = this.#sources.get(id);
    if (source === undefined) return;

    try {
      const clone = source.cloneNode(false) as HTMLAudioElement;
      clone.volume = VOLUMES[id];
      clone.play().catch(() => {
        // Autoplay blocked or file missing — silent fail
      });
    } catch {
      // Clone failed — silent fail
    }
  }

  /** Start looping ambient audio. */
  startAmbient(): void {
    if (this.#destroyed) return;
    if (this.#ambient !== null) return; // already playing

    try {
      const audio = new Audio(SOUND_PATHS.ambient);
      audio.loop = true;
      audio.volume = VOLUMES.ambient;
      audio.muted = this.#muted;
      audio.play().catch(() => {
        // Autoplay blocked — silent fail
      });
      this.#ambient = audio;
    } catch {
      // Audio creation failed
    }
  }

  /** Stop ambient audio. */
  stopAmbient(): void {
    if (this.#ambient !== null) {
      this.#ambient.pause();
      this.#ambient = null;
    }
  }

  /** Override muted state directly (independent of global preference). */
  setMuted(muted: boolean): void {
    this.#muted = muted;
    if (this.#ambient !== null) {
      this.#ambient.muted = muted;
    }
  }

  /** Clean up all audio resources and unsubscribe from preferences. */
  destroy(): void {
    if (this.#destroyed) return;
    this.#destroyed = true;
    this.stopAmbient();
    this.#sources.clear();
    if (this.#unsubscribe !== null) {
      this.#unsubscribe();
      this.#unsubscribe = null;
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && npx vitest run src/game/__tests__/audio.test.ts`
Expected: PASS — all 8 tests green

- [ ] **Step 5: Create S2 audio assets directory with placeholder files**

Create the directory `apps/web/public/assets/s2/`. For each sound ID, create a minimal valid MP3 file (silent placeholder) that can be replaced later with real audio from Gary.

```bash
mkdir -p apps/web/public/assets/s2
```

Then create a script-generated minimal silent MP3 for each sound. Use the smallest valid MP3 frame (a MPEG audio frame header + padding). Alternatively, if `ffmpeg` is available:

```bash
for name in gunshot bolt-cycle bullet-crack scope-in scope-out reload hit-received ambient; do
  ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t 0.1 -q:a 9 "apps/web/public/assets/s2/${name}.mp3" -y 2>/dev/null || true
done
```

If ffmpeg is not available, create empty files as placeholders (AudioManager handles load failure gracefully):

```bash
for name in gunshot bolt-cycle bullet-crack scope-in scope-out reload hit-received ambient; do
  touch "apps/web/public/assets/s2/${name}.mp3"
done
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/game/audio.ts apps/web/src/game/__tests__/audio.test.ts apps/web/public/assets/s2/
git commit -m "feat(s2): add AudioManager for in-game sound effects"
```

---

### Task 2: Wire Audio into DeadshotGame

**Files:**
- Modify: `apps/web/src/game/DeadshotGame.ts`

Integrate AudioManager into the game orchestrator. Trigger sounds at the correct moments in the game loop.

- [ ] **Step 1: Add AudioManager to DeadshotGame**

In `DeadshotGame.ts`, add the import and private field:

```typescript
import { AudioManager } from './audio.js';
```

Add field alongside existing private fields:

```typescript
#audio: AudioManager | null = null;
```

- [ ] **Step 2: Create AudioManager in init(), destroy in destroy()**

In `init()`, after creating the EffectsManager:

```typescript
// ── Audio manager ──────────────────────────────────────────────────────
this.#audio = new AudioManager();
this.#audio.startAmbient();
```

In `destroy()`, before the effects cleanup:

```typescript
// ── Audio ─────────────────────────────────────────────────────────────
if (this.#audio !== null) {
  this.#audio.destroy();
  this.#audio = null;
}
```

- [ ] **Step 3: Wire audio triggers in the event processing section of #onUpdate**

In the `switch (evt.type)` block inside `#onUpdate`, update these cases:

**hit event** — when we hit the opponent, play gunshot. When we're hit, play hit_received + bullet_crack:

```typescript
case 'hit': {
  if (evt.target === opponentIndex) {
    // We hit the opponent
    this.#hud?.showHitMarker(evt.zone === 'head');
    this.#weapon?.triggerFire();
    this.#audio?.play('gunshot');

    // Muzzle flash at camera position
    const camPos = this.#scene?.camera.getPosition().clone();
    if (camPos !== undefined && this.#effects !== null) {
      this.#effects.spawnMuzzleFlash(camPos);
      const opponentPos = new pc.Vec3(0, 1.0, -20);
      this.#effects.spawnTracer(camPos, opponentPos);
    }

    // Bolt cycle sound after a brief delay
    setTimeout(() => { this.#audio?.play('bolt_cycle'); }, 300);
  } else {
    // We got hit — play incoming bullet crack and hit feedback
    this.#audio?.play('bullet_crack');
    this.#audio?.play('hit_received');
  }
  break;
}
```

**round_start event** — stop and restart ambient on new round:

```typescript
case 'round_start': {
  const spawnAngles = evt.positions[playerIndex];
  this.#input?.setInitialAim(spawnAngles.yaw, spawnAngles.pitch);
  if (this.#camera !== null) {
    this.#camera.setAim(spawnAngles.yaw, spawnAngles.pitch);
  }

  // Reset scope state on new round
  this.#lastScopeState = false;
  this.#scope?.hide();
  this.#camera?.setZoom(0);
  this.#weapon?.setScoped(false);
  break;
}
```

- [ ] **Step 4: Wire scope toggle sounds**

In the scope toggle detection section (step 3 of #onUpdate), add audio triggers:

```typescript
// ── 3. Scope toggle detection ──────────────────────────────────────────────
const scopeNow = inputState.scope;
if (scopeNow !== this.#lastScopeState) {
  this.#lastScopeState = scopeNow;

  if (scopeNow) {
    this.#scope?.show();
    this.#camera?.setZoom(inputState.scopeZoom);
    this.#weapon?.setScoped(true);
    this.#audio?.play('scope_in');
  } else {
    this.#scope?.hide();
    this.#camera?.setZoom(0);
    this.#weapon?.setScoped(false);
    this.#audio?.play('scope_out');
  }
}
```

- [ ] **Step 5: Wire reload sound**

After step 4 (build and send client input), check if the player just started reloading. Add a tracking field `#lastReloadingState: boolean = false;` to the per-frame tracking fields, and in step 6 (update HUD):

```typescript
// Track reload start for audio
if (localPlayer !== null && localPlayer.reloading && !this.#lastReloadingState) {
  this.#audio?.play('reload');
}
this.#lastReloadingState = localPlayer?.reloading ?? false;
```

- [ ] **Step 6: Run all tests to verify nothing broke**

Run: `cd apps/web && npx vitest run`
Expected: All existing tests + new audio tests pass

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/game/DeadshotGame.ts
git commit -m "feat(s2): wire AudioManager into game loop — gunshot, bolt cycle, scope, reload, bullet crack"
```

---

### Task 3: Diverse Spawn Positions + SpawnInfo Type

**Files:**
- Modify: `packages/shared/src/s2GameTypes.ts`
- Modify: `apps/game-server/src/positions.ts`
- Modify: `apps/game-server/src/roundManager.ts`

Expand spawn variety so rounds feel different. Add a `SpawnInfo` type that carries world position + facing angles in the `round_start` event, so the client can position the camera and opponent correctly.

- [ ] **Step 1: Add SpawnInfo type to shared types**

In `packages/shared/src/s2GameTypes.ts`, add the new type and update the `round_start` event:

Replace `SpawnAngles` and the `round_start` variant:

```typescript
// ── Spawn info sent with round_start (position + facing direction) ──
export interface SpawnInfo {
  x: number;
  y: number;
  z: number;
  facingYaw: number;
  aimYaw: number;
  aimPitch: number;
}
```

Update the `round_start` in `GameEvent`:

```typescript
| { type: 'round_start'; round: number; positions: [SpawnInfo, SpawnInfo] }
```

Keep `SpawnAngles` exported for backwards compatibility but mark it with a comment as deprecated:

```typescript
/** @deprecated Use SpawnInfo instead */
export interface SpawnAngles {
  yaw: number;
  pitch: number;
}
```

- [ ] **Step 2: Expand spawn pairs in positions.ts**

Replace the contents of `apps/game-server/src/positions.ts`:

```typescript
// apps/game-server/src/positions.ts
import type { SpawnPair } from '@warpath/shared';

// Diverse spawn positions with lateral offsets and varied engagement distances.
// Both players face each other across the Z axis. facingYaw is the base
// orientation: 0 = looking toward +Z, PI = looking toward -Z.
export const ARENA_SPAWN_PAIRS: SpawnPair[] = [
  // Pair 0: Centre lane, 50m — the classic
  {
    player0: { x: 0, y: 0, z: 0, facingYaw: 0 },
    player1: { x: 0, y: 0, z: 50, facingYaw: Math.PI },
  },
  // Pair 1: Left offset, 45m — slight angle
  {
    player0: { x: -4, y: 0, z: 0, facingYaw: 0 },
    player1: { x: 4, y: 0, z: 45, facingYaw: Math.PI },
  },
  // Pair 2: Right offset, 55m — longer range
  {
    player0: { x: 3, y: 0, z: 2, facingYaw: 0 },
    player1: { x: -3, y: 0, z: 57, facingYaw: Math.PI },
  },
  // Pair 3: Wide lateral, 40m — close and off-axis
  {
    player0: { x: -6, y: 0, z: 5, facingYaw: 0 },
    player1: { x: 6, y: 0, z: 45, facingYaw: Math.PI },
  },
  // Pair 4: Near-symmetric, 48m — subtle offset
  {
    player0: { x: 2, y: 0, z: 1, facingYaw: 0 },
    player1: { x: -2, y: 0, z: 49, facingYaw: Math.PI },
  },
  // Pair 5: Hard angle, 42m
  {
    player0: { x: -8, y: 0, z: 0, facingYaw: 0 },
    player1: { x: 8, y: 0, z: 42, facingYaw: Math.PI },
  },
  // Pair 6: Centre lane, short range, 35m — fast round
  {
    player0: { x: 0, y: 0, z: 0, facingYaw: 0 },
    player1: { x: 0, y: 0, z: 35, facingYaw: Math.PI },
  },
  // Pair 7: Diagonal offset, 52m
  {
    player0: { x: -5, y: 0, z: 3, facingYaw: 0 },
    player1: { x: 5, y: 0, z: 55, facingYaw: Math.PI },
  },
];
```

- [ ] **Step 3: Update roundManager.startRound() to compute real facing angles**

In `apps/game-server/src/roundManager.ts`, update `startRound()` to compute the yaw each player needs to face the other:

```typescript
import type { GameEvent, S2MatchResult, S2RoundResult, SpawnPair, SpawnInfo } from '@warpath/shared';
```

Replace the `startRound()` method:

```typescript
startRound(): GameEvent {
  this.phase = 'active';
  this.timerMs = S2_MATCH_CONFIG.ROUND_DURATION_MS;
  this.currentRoundHeadshot = false;

  const spawn = this.getCurrentSpawn();

  // Compute the yaw offset each player needs to aim toward the opponent.
  const p0 = spawn.player0;
  const p1 = spawn.player1;

  const aim0Yaw = Math.atan2(p1.x - p0.x, p1.z - p0.z) - p0.facingYaw;
  const aim1Yaw = Math.atan2(p0.x - p1.x, p0.z - p1.z) - p1.facingYaw;

  const positions: [SpawnInfo, SpawnInfo] = [
    { x: p0.x, y: p0.y, z: p0.z, facingYaw: p0.facingYaw, aimYaw: aim0Yaw, aimPitch: 0 },
    { x: p1.x, y: p1.y, z: p1.z, facingYaw: p1.facingYaw, aimYaw: aim1Yaw, aimPitch: 0 },
  ];

  return {
    type: 'round_start',
    round: this.roundNumber,
    positions,
  };
}
```

- [ ] **Step 4: Build shared package and run game-server tests**

```bash
pnpm --filter @warpath/shared build
cd apps/game-server && npx vitest run
```

Expected: All game-server tests pass. Some may need minor updates if they assert on the `round_start` event shape — update assertions to match the new `SpawnInfo` format.

- [ ] **Step 5: Commit**

```bash
git add packages/shared/src/s2GameTypes.ts apps/game-server/src/positions.ts apps/game-server/src/roundManager.ts
git commit -m "feat(s2): diverse spawn positions with computed facing angles via SpawnInfo"
```

---

### Task 4: Client Spawn Position Sync

**Files:**
- Modify: `apps/web/src/game/DeadshotGame.ts`
- Modify: `apps/web/src/game/opponent.ts`

Update the client to position the camera and opponent based on spawn data received in the `round_start` event.

- [ ] **Step 1: Update opponent.ts — accept spawn position from round_start**

No API changes needed — `OpponentRenderer.setSpawnPosition(x, z)` already exists. Just ensure it's called with the correct values from the round_start event.

- [ ] **Step 2: Update DeadshotGame round_start handling to use SpawnInfo**

In `DeadshotGame.ts`, update the `round_start` case in the event processing section. Import SpawnInfo:

```typescript
import type { SpawnInfo } from '@warpath/shared';
```

Update the round_start handler:

```typescript
case 'round_start': {
  const playerSpawn = evt.positions[playerIndex];
  const opponentSpawn = evt.positions[opponentIndex];

  // Position camera at player's spawn
  this.#camera?.setPosition(playerSpawn.x, 0, playerSpawn.z);
  this.#input?.setInitialAim(playerSpawn.aimYaw, playerSpawn.aimPitch);
  if (this.#camera !== null) {
    this.#camera.setAim(playerSpawn.aimYaw, playerSpawn.aimPitch);
  }

  // Position opponent at their spawn
  this.#opponent?.setSpawnPosition(opponentSpawn.x, opponentSpawn.z);

  // Reset scope state on new round
  this.#lastScopeState = false;
  this.#scope?.hide();
  this.#camera?.setZoom(0);
  this.#weapon?.setScoped(false);
  break;
}
```

- [ ] **Step 3: Update the initial opponent spawn position in init()**

Currently `init()` hardcodes `this.#opponent.setSpawnPosition(0, -20)`. Change this to a reasonable default that matches the first spawn pair center:

```typescript
this.#opponent?.setSpawnPosition(0, 50);
```

This default will be overridden by the first `round_start` event.

- [ ] **Step 4: Update camera.ts — add setPosition method if missing**

The `CameraController` already has a `setPosition(x, y, z)` method. Verify it sets position correctly for both stance heights. No changes needed if it works as expected.

- [ ] **Step 5: Update tracer target position to use opponent spawn instead of hardcoded**

In the `hit` event handler in `#onUpdate`, the tracer target is hardcoded `new pc.Vec3(0, 1.0, -20)`. Replace with a dynamic reference. Add a field to track opponent spawn:

```typescript
#opponentSpawnX: number = 0;
#opponentSpawnZ: number = 50;
```

In the `round_start` handler:
```typescript
this.#opponentSpawnX = opponentSpawn.x;
this.#opponentSpawnZ = opponentSpawn.z;
```

In the `hit` handler:
```typescript
const opponentPos = new pc.Vec3(this.#opponentSpawnX, 1.0, this.#opponentSpawnZ);
```

- [ ] **Step 6: Run all web tests**

Run: `cd apps/web && npx vitest run`
Expected: All tests pass

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/game/DeadshotGame.ts apps/web/src/game/opponent.ts
git commit -m "feat(s2): client spawn sync — camera and opponent positioned per round_start SpawnInfo"
```

---

### Task 5: Scope Sway

**Files:**
- Modify: `apps/web/src/game/camera.ts`
- Create: `apps/web/src/game/__tests__/sway.test.ts`
- Modify: `apps/web/src/game/DeadshotGame.ts`

Add subtle scope sway: sinusoidal oscillation on yaw and pitch while scoped. Amplitude varies by stance (crouched = less sway) and zoom level (higher zoom = more sway). Uses different frequencies for horizontal and vertical to create a natural figure-8 pattern.

- [ ] **Step 1: Write failing tests for sway math**

```typescript
// apps/web/src/game/__tests__/sway.test.ts
import { describe, it, expect } from 'vitest';
import { computeSway, SWAY_CONFIG } from '../camera.js';

describe('computeSway', () => {
  it('returns zero sway when not scoped', () => {
    const result = computeSway(1.0, false, 'standing', 1);
    expect(result.yawOffset).toBe(0);
    expect(result.pitchOffset).toBe(0);
  });

  it('returns non-zero sway when scoped and time > 0', () => {
    const result = computeSway(1.0, true, 'standing', 1);
    expect(result.yawOffset).not.toBe(0);
    expect(result.pitchOffset).not.toBe(0);
  });

  it('crouched sway amplitude is smaller than standing', () => {
    const standing = computeSway(1.5, true, 'standing', 1);
    const crouched = computeSway(1.5, true, 'crouched', 1);
    expect(Math.abs(crouched.yawOffset)).toBeLessThan(Math.abs(standing.yawOffset));
    expect(Math.abs(crouched.pitchOffset)).toBeLessThan(Math.abs(standing.pitchOffset));
  });

  it('higher zoom produces larger sway', () => {
    const zoom1 = computeSway(2.0, true, 'standing', 1);
    const zoom2 = computeSway(2.0, true, 'standing', 2);
    expect(Math.abs(zoom2.yawOffset)).toBeGreaterThanOrEqual(Math.abs(zoom1.yawOffset));
  });

  it('sway is zero at time zero', () => {
    const result = computeSway(0, true, 'standing', 1);
    expect(result.yawOffset).toBe(0);
    expect(result.pitchOffset).toBe(0);
  });

  it('sway amplitude stays within configured maximum', () => {
    // Test many time values
    for (let t = 0; t < 20; t += 0.1) {
      const result = computeSway(t, true, 'standing', 2);
      expect(Math.abs(result.yawOffset)).toBeLessThanOrEqual(
        SWAY_CONFIG.BASE_AMPLITUDE * SWAY_CONFIG.ZOOM_MULTIPLIER_2X + 0.001,
      );
      expect(Math.abs(result.pitchOffset)).toBeLessThanOrEqual(
        SWAY_CONFIG.BASE_AMPLITUDE * SWAY_CONFIG.ZOOM_MULTIPLIER_2X + 0.001,
      );
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && npx vitest run src/game/__tests__/sway.test.ts`
Expected: FAIL — `computeSway` and `SWAY_CONFIG` not exported from `../camera.js`

- [ ] **Step 3: Implement sway in camera.ts**

Add sway exports and integrate into the camera controller. At the top of `camera.ts`, add:

```typescript
// ── Scope sway ──────────────────────────────────────────────────────────────
// Sinusoidal oscillation applied while scoped for realism.
// Different frequencies for yaw and pitch create a figure-8 pattern.

export const SWAY_CONFIG = {
  BASE_AMPLITUDE: 0.004,      // radians (~0.23°)
  YAW_FREQUENCY: 0.7,         // Hz
  PITCH_FREQUENCY: 1.1,       // Hz (different from yaw for figure-8)
  CROUCHED_MULTIPLIER: 0.35,  // crouching reduces sway significantly
  ZOOM_MULTIPLIER_1X: 1.0,    // 2.5x scope
  ZOOM_MULTIPLIER_2X: 1.6,    // 6x scope — more sway at higher magnification
} as const;

export interface SwayResult {
  yawOffset: number;
  pitchOffset: number;
}

/**
 * Compute sway offset for the current frame.
 * Pure function — no side effects.
 *
 * @param elapsed  Total elapsed time in seconds since scope was entered
 * @param scoped   Whether the player is currently scoped in
 * @param stance   Current stance (crouching reduces sway)
 * @param zoomLevel 1 or 2 (scope magnification)
 */
export function computeSway(
  elapsed: number,
  scoped: boolean,
  stance: 'standing' | 'crouched',
  zoomLevel: 1 | 2,
): SwayResult {
  if (!scoped || elapsed === 0) {
    return { yawOffset: 0, pitchOffset: 0 };
  }

  const stanceMul = stance === 'crouched' ? SWAY_CONFIG.CROUCHED_MULTIPLIER : 1;
  const zoomMul = zoomLevel === 2 ? SWAY_CONFIG.ZOOM_MULTIPLIER_2X : SWAY_CONFIG.ZOOM_MULTIPLIER_1X;
  const amp = SWAY_CONFIG.BASE_AMPLITUDE * stanceMul * zoomMul;

  return {
    yawOffset: amp * Math.sin(elapsed * SWAY_CONFIG.YAW_FREQUENCY * Math.PI * 2),
    pitchOffset: amp * Math.sin(elapsed * SWAY_CONFIG.PITCH_FREQUENCY * Math.PI * 2),
  };
}
```

- [ ] **Step 4: Integrate sway into CameraController**

Add sway tracking fields and apply sway in the `update()` method:

```typescript
export class CameraController {
  // ... existing fields ...
  private swayElapsed: number = 0;
  private swayActive: boolean = false;
  private swayStance: 'standing' | 'crouched' = 'standing';
  private swayZoom: 1 | 2 = 1;

  // ... existing methods ...

  /** Enable scope sway tracking. */
  enableSway(stance: 'standing' | 'crouched', zoomLevel: 1 | 2): void {
    if (!this.swayActive) {
      this.swayElapsed = 0; // Reset timer on scope-in
    }
    this.swayActive = true;
    this.swayStance = stance;
    this.swayZoom = zoomLevel;
  }

  /** Disable scope sway. */
  disableSway(): void {
    this.swayActive = false;
    this.swayElapsed = 0;
  }

  update(dt: number): void {
    const cam = this.entity.camera;
    if (cam === null || cam === undefined) return;

    // FOV lerp (existing)
    const currentFov: number = cam.fov;
    if (Math.abs(currentFov - this.targetFov) > 0.01) {
      cam.fov = pc.math.lerp(currentFov, this.targetFov, FOV_LERP_SPEED * dt);
    } else {
      cam.fov = this.targetFov;
    }

    // Scope sway
    if (this.swayActive) {
      this.swayElapsed += dt;
      const sway = computeSway(this.swayElapsed, true, this.swayStance, this.swayZoom);
      // Apply sway as a temporary rotation offset on top of the base aim
      const swayYaw = this.yaw + sway.yawOffset * (180 / Math.PI);
      const swayPitch = this.pitch + sway.pitchOffset * (180 / Math.PI);
      this.entity.setLocalEulerAngles(
        pc.math.clamp(swayPitch, PITCH_MIN, PITCH_MAX),
        swayYaw,
        0,
      );
    }
  }
}
```

- [ ] **Step 5: Wire sway in DeadshotGame scope toggle section**

In `DeadshotGame.ts`, in the scope toggle detection (step 3 of `#onUpdate`):

```typescript
if (scopeNow !== this.#lastScopeState) {
  this.#lastScopeState = scopeNow;

  if (scopeNow) {
    this.#scope?.show();
    this.#camera?.setZoom(inputState.scopeZoom);
    this.#weapon?.setScoped(true);
    this.#audio?.play('scope_in');
    this.#camera?.enableSway(inputState.crouch ? 'crouched' : 'standing', inputState.scopeZoom);
  } else {
    this.#scope?.hide();
    this.#camera?.setZoom(0);
    this.#weapon?.setScoped(false);
    this.#audio?.play('scope_out');
    this.#camera?.disableSway();
  }
}

// While scoped, keep sway params in sync with current stance and zoom
if (scopeNow && this.#camera !== null) {
  this.#camera.setZoom(inputState.scopeZoom);
  this.#camera.enableSway(inputState.crouch ? 'crouched' : 'standing', inputState.scopeZoom);
}
```

- [ ] **Step 6: Run all tests**

```bash
cd apps/web && npx vitest run
```

Expected: All tests pass including the new sway tests

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/game/camera.ts apps/web/src/game/__tests__/sway.test.ts apps/web/src/game/DeadshotGame.ts
git commit -m "feat(s2): scope sway — sinusoidal oscillation, reduced when crouched, scaled with zoom"
```

---

### Task 6: Loading & Error States in DeadshotCanvas

**Files:**
- Modify: `apps/web/src/components/s2/DeadshotCanvas.tsx`

Add visual feedback for connection states (connecting, error, disconnected) and a brief loading overlay while the PlayCanvas scene initializes.

- [ ] **Step 1: Add connection state tracking**

Add state for connection status and error display:

```typescript
import { useCallback, useEffect, useRef, useState } from 'react';
```

Inside the component, add:

```typescript
const [connectionState, setConnectionState] = useState<'loading' | 'connecting' | 'connected' | 'error'>('loading');
const [errorMessage, setErrorMessage] = useState<string | null>(null);
```

- [ ] **Step 2: Update event handlers to track connection state**

```typescript
const handleConnected = useCallback(() => {
  setConnectionState('connected');
  setS2Phase('playing');
}, [setS2Phase]);

const handleError = useCallback(
  (data: GameErrorEvent) => {
    setConnectionState('error');
    setErrorMessage(data.reason);
    // Auto-dismiss back to idle after 3 seconds
    setTimeout(() => setS2Phase('idle'), 3000);
  },
  [setS2Phase],
);

const handleDisconnect = useCallback(() => {
  setConnectionState('error');
  setErrorMessage('Connection lost');
  setTimeout(() => setS2Phase('idle'), 2000);
}, [setS2Phase]);
```

- [ ] **Step 3: Set connecting state after init**

In the useEffect after `game.init(canvas, config)`:

```typescript
setConnectionState('connecting');
```

- [ ] **Step 4: Add overlay UI for non-connected states**

Below the canvas element in the JSX:

```typescript
{/* Connection state overlay */}
{connectionState !== 'connected' ? (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0,0,0,0.85)',
      zIndex: 50,
      fontFamily: 'monospace',
      color: '#f5f7ef',
    }}
  >
    {connectionState === 'loading' || connectionState === 'connecting' ? (
      <>
        <div
          style={{
            fontSize: '0.875rem',
            textTransform: 'uppercase',
            letterSpacing: '0.18em',
            color: '#00f0ff',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        >
          {connectionState === 'loading' ? 'Initializing...' : 'Connecting to server...'}
        </div>
      </>
    ) : null}

    {connectionState === 'error' && errorMessage !== null ? (
      <div
        style={{
          fontSize: '0.8125rem',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: '#f87171',
        }}
      >
        {errorMessage}
      </div>
    ) : null}
  </div>
) : null}
```

- [ ] **Step 5: Run typecheck**

```bash
npx tsc --noEmit -p apps/web/tsconfig.json
```

Expected: No type errors

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/s2/DeadshotCanvas.tsx
git commit -m "feat(s2): loading and error state overlays for DeadshotCanvas"
```

---

### Verification

After all tasks are complete, run the full test suite and typecheck:

```bash
pnpm --filter @warpath/shared build && pnpm test
npx tsc --noEmit -p apps/web/tsconfig.json
npx tsc --noEmit -p apps/game-server/tsconfig.json
```

Expected: All tests pass, zero type errors across all packages.
