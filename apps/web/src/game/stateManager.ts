// apps/web/src/game/stateManager.ts
// Server-state buffer with linear interpolation for smooth opponent rendering.
//
// Interpolation strategy:
//   - aimYaw / aimPitch: lerp between the two most recent states using `t`
//   - All other fields (stance, scoped, hp, ammo, reloading, alive): snap to
//     the latest value — no lerp on discrete or health values.
//
// The buffer holds at most MAX_BUFFER_SIZE entries; older entries are dropped
// once the cap is reached.

import type { GameState, PlayerState, GameEvent } from '@warpath/shared';

// ── Constants ────────────────────────────────────────────────────────────────

const MAX_BUFFER_SIZE = 4;

// ── Module-level helpers ─────────────────────────────────────────────────────

/**
 * Linear interpolation between two angles (radians or degrees — no wrapping).
 * Yaw is unbounded so plain lerp is correct.
 */
function lerpAngle(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Clamp `value` into [min, max].
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Produce a PlayerState that lerps aim angles between `a` and `b` at factor
 * `t`, snapping all other fields to `b` (the newer state).
 */
function interpolatePlayer(a: PlayerState, b: PlayerState, t: number): PlayerState {
  return {
    aimYaw: lerpAngle(a.aimYaw, b.aimYaw, t),
    aimPitch: lerpAngle(a.aimPitch, b.aimPitch, t),
    // Snap fields — discrete or health values must not lerp
    stance: b.stance,
    scoped: b.scoped,
    hp: b.hp,
    ammo: b.ammo,
    reloading: b.reloading,
    alive: b.alive,
  };
}

// ── StateManager ─────────────────────────────────────────────────────────────

export class StateManager {
  #buffer: GameState[] = [];
  #pendingEvents: GameEvent[] = [];

  /**
   * Add a new state snapshot to the buffer.
   * Trims to MAX_BUFFER_SIZE by discarding the oldest entry.
   * Events from the incoming state are collected for later consumption.
   */
  pushState(state: GameState): void {
    this.#buffer.push(state);

    if (this.#buffer.length > MAX_BUFFER_SIZE) {
      this.#buffer.shift();
    }

    for (const evt of state.events) {
      this.#pendingEvents.push(evt);
    }
  }

  /**
   * Return the most recently pushed state, or null if the buffer is empty.
   */
  getLatestState(): GameState | null {
    return this.#buffer.length > 0
      ? (this.#buffer[this.#buffer.length - 1] ?? null)
      : null;
  }

  /**
   * Return an interpolated PlayerState for the opponent at render fraction `t`.
   *
   * When two or more states are buffered, aim angles are lerped between the
   * second-most-recent and most-recent states.  All other fields snap to the
   * latest value.  If only one state exists the snap value is returned directly.
   *
   * `t` is clamped to [0, 1].
   */
  getInterpolatedOpponent(opponentIndex: 0 | 1, t: number): PlayerState {
    const clamped = clamp(t, 0, 1);
    const len = this.#buffer.length;

    if (len === 0) {
      // Fallback: return a sensible default rather than throw
      return {
        aimYaw: 0,
        aimPitch: 0,
        stance: 'standing',
        scoped: false,
        hp: 100,
        ammo: 0,
        reloading: false,
        alive: true,
      };
    }

    const latest = this.#buffer[len - 1];
    if (len === 1 || latest === undefined) {
      return (latest ?? this.#buffer[0])!.players[opponentIndex];
    }

    const prev = this.#buffer[len - 2];
    if (prev === undefined) {
      return latest.players[opponentIndex];
    }

    return interpolatePlayer(
      prev.players[opponentIndex],
      latest.players[opponentIndex],
      clamped,
    );
  }

  /**
   * Return the local player's state from the latest snapshot, or null if
   * the buffer is empty.
   */
  getLocalPlayer(playerIndex: 0 | 1): PlayerState | null {
    const latest = this.getLatestState();
    return latest !== null ? latest.players[playerIndex] : null;
  }

  /** Round number from the latest state (defaults to 1 when buffer is empty). */
  getRoundNumber(): number {
    return this.getLatestState()?.roundNumber ?? 1;
  }

  /** Round timer from the latest state (defaults to 0 when buffer is empty). */
  getRoundTimer(): number {
    return this.getLatestState()?.roundTimer ?? 0;
  }

  /** Tick counter from the latest state (defaults to 0 when buffer is empty). */
  getTick(): number {
    return this.getLatestState()?.tick ?? 0;
  }

  /**
   * Return all accumulated events since the last call and clear the queue.
   * Callers must process each event exactly once.
   */
  consumeEvents(): GameEvent[] {
    const events = this.#pendingEvents;
    this.#pendingEvents = [];
    return events;
  }

  /** Reset all internal state. */
  reset(): void {
    this.#buffer = [];
    this.#pendingEvents = [];
  }
}
