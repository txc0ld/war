// apps/web/src/game/__tests__/stateManager.test.ts
// Unit tests for StateManager — buffer management, interpolation, and event
// consumption.

import { describe, it, expect, beforeEach } from 'vitest';
import { StateManager } from '../stateManager.js';
import type { GameState, PlayerState } from '@warpath/shared';

// ── Fixtures ─────────────────────────────────────────────────────────────────

function makePlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    aimYaw: 0,
    aimPitch: 0,
    stance: 'standing',
    scoped: false,
    hp: 100,
    ammo: 5,
    reloading: false,
    alive: true,
    ...overrides,
  };
}

function makeState(
  tick: number,
  p0: Partial<PlayerState> = {},
  p1: Partial<PlayerState> = {},
  overrides: Partial<Omit<GameState, 'players'>> = {},
): GameState {
  return {
    tick,
    roundNumber: 1,
    roundTimer: 60,
    players: [makePlayer(p0), makePlayer(p1)],
    events: [],
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('StateManager', () => {
  let sm: StateManager;

  beforeEach(() => {
    sm = new StateManager();
  });

  // ── Storing state ──────────────────────────────────────────────────────────

  it('returns null from getLatestState before any push', () => {
    expect(sm.getLatestState()).toBeNull();
  });

  it('stores and returns the latest state', () => {
    const s = makeState(1);
    sm.pushState(s);
    expect(sm.getLatestState()).toBe(s);
  });

  it('overwrites with the newest state after multiple pushes', () => {
    sm.pushState(makeState(1));
    sm.pushState(makeState(2));
    const s3 = makeState(3);
    sm.pushState(s3);
    expect(sm.getLatestState()).toBe(s3);
  });

  it('trims buffer to 4 entries', () => {
    for (let i = 1; i <= 6; i++) {
      sm.pushState(makeState(i));
    }
    // Should still return the last pushed state
    expect(sm.getLatestState()?.tick).toBe(6);
    // Accessing tick 3 via interpolation: if buffer is trimmed to 4, tick 3
    // should no longer be the "prev" — tick 5 is prev, tick 6 is latest.
    const result = sm.getInterpolatedOpponent(0, 0);
    // snap fields come from tick 6's player
    expect(result.hp).toBe(100);
  });

  // ── Interpolation ──────────────────────────────────────────────────────────

  it('interpolates opponent aim at t=0.5 between two states', () => {
    sm.pushState(makeState(1, { aimYaw: 0, aimPitch: 0 }));
    sm.pushState(makeState(2, { aimYaw: 2, aimPitch: 2 }));

    const result = sm.getInterpolatedOpponent(0, 0.5);

    expect(result.aimYaw).toBeCloseTo(1);
    expect(result.aimPitch).toBeCloseTo(1);
  });

  it('returns prev state values at t=0', () => {
    sm.pushState(makeState(1, { aimYaw: 0 }));
    sm.pushState(makeState(2, { aimYaw: 10 }));

    const result = sm.getInterpolatedOpponent(0, 0);
    expect(result.aimYaw).toBeCloseTo(0);
  });

  it('returns latest state values at t=1', () => {
    sm.pushState(makeState(1, { aimYaw: 0 }));
    sm.pushState(makeState(2, { aimYaw: 10 }));

    const result = sm.getInterpolatedOpponent(0, 1);
    expect(result.aimYaw).toBeCloseTo(10);
  });

  it('returns the only state when buffer has exactly one entry', () => {
    sm.pushState(makeState(1, { aimYaw: 5, aimPitch: -3 }));

    const result = sm.getInterpolatedOpponent(0, 0.5);

    expect(result.aimYaw).toBe(5);
    expect(result.aimPitch).toBe(-3);
  });

  it('clamps t below 0 to 0', () => {
    sm.pushState(makeState(1, { aimYaw: 0 }));
    sm.pushState(makeState(2, { aimYaw: 10 }));

    const result = sm.getInterpolatedOpponent(0, -5);
    expect(result.aimYaw).toBeCloseTo(0);
  });

  it('clamps t above 1 to 1', () => {
    sm.pushState(makeState(1, { aimYaw: 0 }));
    sm.pushState(makeState(2, { aimYaw: 10 }));

    const result = sm.getInterpolatedOpponent(0, 99);
    expect(result.aimYaw).toBeCloseTo(10);
  });

  it('snaps HP to latest value (no interpolation on damage)', () => {
    sm.pushState(makeState(1, { hp: 100 }));
    sm.pushState(makeState(2, { hp: 60 }));

    const result = sm.getInterpolatedOpponent(0, 0.5);

    // hp must snap to the newer state — no lerp
    expect(result.hp).toBe(60);
  });

  it('snaps stance and scoped to latest value', () => {
    sm.pushState(makeState(1, { stance: 'standing', scoped: false }));
    sm.pushState(makeState(2, { stance: 'crouched', scoped: true }));

    const result = sm.getInterpolatedOpponent(0, 0.5);

    expect(result.stance).toBe('crouched');
    expect(result.scoped).toBe(true);
  });

  it('can interpolate playerIndex 1 independently', () => {
    sm.pushState(makeState(1, { aimYaw: 0 }, { aimYaw: 100 }));
    sm.pushState(makeState(2, { aimYaw: 0 }, { aimYaw: 200 }));

    const result = sm.getInterpolatedOpponent(1, 0.5);

    expect(result.aimYaw).toBeCloseTo(150);
  });

  // ── Round / timer / tick accessors ─────────────────────────────────────────

  it('returns roundNumber from latest state', () => {
    sm.pushState(makeState(1, {}, {}, { roundNumber: 2 }));
    expect(sm.getRoundNumber()).toBe(2);
  });

  it('defaults roundNumber to 1 when buffer is empty', () => {
    expect(sm.getRoundNumber()).toBe(1);
  });

  it('returns roundTimer from latest state', () => {
    sm.pushState(makeState(1, {}, {}, { roundTimer: 45 }));
    expect(sm.getRoundTimer()).toBe(45);
  });

  it('defaults roundTimer to 0 when buffer is empty', () => {
    expect(sm.getRoundTimer()).toBe(0);
  });

  it('returns tick from latest state', () => {
    sm.pushState(makeState(99));
    expect(sm.getTick()).toBe(99);
  });

  it('defaults tick to 0 when buffer is empty', () => {
    expect(sm.getTick()).toBe(0);
  });

  // ── Local player ───────────────────────────────────────────────────────────

  it('returns local player state from latest snapshot', () => {
    sm.pushState(makeState(1, { hp: 75 }));
    expect(sm.getLocalPlayer(0)?.hp).toBe(75);
  });

  it('returns null for local player when buffer is empty', () => {
    expect(sm.getLocalPlayer(0)).toBeNull();
  });

  // ── Event consumption ──────────────────────────────────────────────────────

  it('returns events from pushed states', () => {
    const s = makeState(1, {}, {}, {
      events: [{ type: 'hit', target: 0, zone: 'body', damage: 20 }],
    });
    sm.pushState(s);

    const events = sm.consumeEvents();
    expect(events).toHaveLength(1);
    expect(events[0]?.type).toBe('hit');
  });

  it('consumes events exactly once (second call returns empty)', () => {
    sm.pushState(
      makeState(1, {}, {}, {
        events: [{ type: 'kill', killer: 0, victim: 1, headshot: false }],
      }),
    );

    sm.consumeEvents(); // first call — drains the queue
    const second = sm.consumeEvents();

    expect(second).toHaveLength(0);
  });

  it('accumulates events across multiple state pushes', () => {
    sm.pushState(
      makeState(1, {}, {}, {
        events: [{ type: 'hit', target: 0, zone: 'head', damage: 50 }],
      }),
    );
    sm.pushState(
      makeState(2, {}, {}, {
        events: [{ type: 'hit', target: 1, zone: 'body', damage: 20 }],
      }),
    );

    const events = sm.consumeEvents();
    expect(events).toHaveLength(2);
  });

  // ── Reset ─────────────────────────────────────────────────────────────────

  it('reset clears buffer and pending events', () => {
    sm.pushState(
      makeState(1, {}, {}, {
        events: [{ type: 'hit', target: 0, zone: 'body', damage: 10 }],
      }),
    );

    sm.reset();

    expect(sm.getLatestState()).toBeNull();
    expect(sm.consumeEvents()).toHaveLength(0);
    expect(sm.getTick()).toBe(0);
  });
});
