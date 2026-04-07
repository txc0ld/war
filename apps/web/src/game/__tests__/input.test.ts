// apps/web/src/game/__tests__/input.test.ts
// Unit tests for pure input functions.
// InputCapture (browser-dependent) is NOT tested here.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createInputState,
  applyMouseDelta,
  buildClientInput,
  type InputState,
} from '../input.js';

describe('applyMouseDelta', () => {
  it('accumulates yaw and pitch from mouse movement', () => {
    const state: InputState = createInputState();

    applyMouseDelta(state, 100, -50, 0.002);

    expect(state.aimYaw).toBeCloseTo(0.2);
    // dy is positive when mouse moves down; we add it to pitch directly
    // so mouse-up (negative dy) makes pitch negative (looking up).
    expect(state.aimPitch).toBeCloseTo(-0.1);
  });

  it('accumulates across multiple calls', () => {
    const state: InputState = createInputState();

    applyMouseDelta(state, 100, 0, 0.002);
    applyMouseDelta(state, 100, 0, 0.002);

    expect(state.aimYaw).toBeCloseTo(0.4);
  });

  it('clamps pitch to -89 when looking fully up', () => {
    const state: InputState = createInputState();

    // Large negative dy (mouse up) → pitch goes very low (clamped to -89)
    applyMouseDelta(state, 0, -100_000, 0.002);

    expect(state.aimPitch).toBe(-89);
  });

  it('clamps pitch to +89 when looking fully down', () => {
    const state: InputState = createInputState();

    // Large positive dy (mouse down) → pitch goes very high (clamped to +89)
    applyMouseDelta(state, 0, 100_000, 0.002);

    expect(state.aimPitch).toBe(89);
  });

  it('does not clamp yaw', () => {
    const state: InputState = createInputState();

    applyMouseDelta(state, 1_000_000, 0, 0.002);

    expect(state.aimYaw).toBeCloseTo(2000);
  });
});

describe('buildClientInput', () => {
  let nowSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    nowSpy = vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);
  });

  afterEach(() => {
    nowSpy.mockRestore();
  });

  it('produces a ClientInput with a timestamp', () => {
    const state: InputState = createInputState();

    const input = buildClientInput(state);

    expect(input.timestamp).toBe(1_700_000_000_000);
    expect(typeof input.aimYaw).toBe('number');
    expect(typeof input.aimPitch).toBe('number');
    expect(typeof input.fire).toBe('boolean');
    expect(typeof input.scope).toBe('boolean');
    expect(typeof input.reload).toBe('boolean');
  });

  it('includes current aim values in the snapshot', () => {
    const state: InputState = createInputState();
    state.aimYaw = 45;
    state.aimPitch = -10;
    state.scope = true;
    state.scopeZoom = 2;
    state.crouch = true;

    const input = buildClientInput(state);

    expect(input.aimYaw).toBe(45);
    expect(input.aimPitch).toBe(-10);
    expect(input.scope).toBe(true);
    expect(input.scopeZoom).toBe(2);
    expect(input.crouch).toBe(true);
  });

  it('resets fire flag after build', () => {
    const state: InputState = createInputState();
    state.fire = true;

    const input = buildClientInput(state);

    expect(input.fire).toBe(true);      // was true in the snapshot
    expect(state.fire).toBe(false);     // reset afterward
  });

  it('resets reload flag after build', () => {
    const state: InputState = createInputState();
    state.reload = true;

    const input = buildClientInput(state);

    expect(input.reload).toBe(true);    // was true in the snapshot
    expect(state.reload).toBe(false);   // reset afterward
  });

  it('does not reset crouch or scope flags after build', () => {
    const state: InputState = createInputState();
    state.crouch = true;
    state.scope = true;

    buildClientInput(state);

    // Hold flags persist between frames
    expect(state.crouch).toBe(true);
    expect(state.scope).toBe(true);
  });

  it('consecutive builds do not re-send one-shot flags', () => {
    const state: InputState = createInputState();
    state.fire = true;
    state.reload = true;

    buildClientInput(state); // consumes fire + reload

    const second = buildClientInput(state);

    expect(second.fire).toBe(false);
    expect(second.reload).toBe(false);
  });

  it('passes WASD movement intent through', () => {
    const state: InputState = createInputState();
    state.moveForward = true;
    state.moveLeft = true;

    const input = buildClientInput(state);

    expect(input.moveForward).toBe(true);
    expect(input.moveBackward).toBe(false);
    expect(input.moveLeft).toBe(true);
    expect(input.moveRight).toBe(false);
  });

  it('does not reset WASD flags after build (held keys)', () => {
    const state: InputState = createInputState();
    state.moveForward = true;
    state.moveRight = true;

    buildClientInput(state);

    // Held keys persist until keyup
    expect(state.moveForward).toBe(true);
    expect(state.moveRight).toBe(true);
  });
});
