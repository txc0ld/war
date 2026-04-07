// apps/web/src/game/__tests__/connection.test.ts
// Unit tests for the pure message-builder and parser functions in connection.ts.
// GameConnection (WebSocket-dependent) is NOT tested here.

import { describe, it, expect } from 'vitest';
import {
  buildAuthMessage,
  buildInputMessage,
  buildPingMessage,
  parseServerMessage,
} from '../connection.js';
import type { ClientInput } from '@warpath/shared';

// ── Fixtures ─────────────────────────────────────────────────────────────────

const sampleInput: ClientInput = {
  aimYaw: 1.23,
  aimPitch: -0.45,
  fire: true,
  scope: false,
  scopeZoom: 1,
  crouch: false,
  reload: false,
  moveForward: false,
  moveBackward: false,
  moveLeft: false,
  moveRight: false,
  timestamp: 1_700_000_000_000,
};

// ── buildAuthMessage ──────────────────────────────────────────────────────────

describe('buildAuthMessage', () => {
  it('produces a JSON string with type auth', () => {
    const raw = buildAuthMessage('room-abc', 'tok-xyz');
    const parsed = JSON.parse(raw) as unknown;

    expect(parsed).toEqual({
      type: 'auth',
      roomId: 'room-abc',
      roomToken: 'tok-xyz',
    });
  });

  it('includes both roomId and roomToken', () => {
    const raw = buildAuthMessage('r1', 't1');
    expect(raw).toContain('"roomId":"r1"');
    expect(raw).toContain('"roomToken":"t1"');
  });
});

// ── buildInputMessage ─────────────────────────────────────────────────────────

describe('buildInputMessage', () => {
  it('wraps ClientInput under the input key', () => {
    const raw = buildInputMessage(sampleInput);
    const parsed = JSON.parse(raw) as { type: string; input: ClientInput };

    expect(parsed.type).toBe('input');
    expect(parsed.input.aimYaw).toBe(sampleInput.aimYaw);
    expect(parsed.input.aimPitch).toBe(sampleInput.aimPitch);
    expect(parsed.input.fire).toBe(sampleInput.fire);
    expect(parsed.input.timestamp).toBe(sampleInput.timestamp);
  });

  it('preserves all ClientInput fields', () => {
    const full: ClientInput = {
      aimYaw: 3.14,
      aimPitch: 0.5,
      fire: false,
      scope: true,
      scopeZoom: 2,
      crouch: true,
      reload: true,
      moveForward: true,
      moveBackward: false,
      moveLeft: true,
      moveRight: false,
      timestamp: 999,
    };
    const parsed = JSON.parse(buildInputMessage(full)) as { input: ClientInput };
    expect(parsed.input).toEqual(full);
  });
});

// ── buildPingMessage ──────────────────────────────────────────────────────────

describe('buildPingMessage', () => {
  it('produces a JSON ping message', () => {
    const parsed = JSON.parse(buildPingMessage()) as unknown;
    expect(parsed).toEqual({ type: 'ping' });
  });
});

// ── parseServerMessage ────────────────────────────────────────────────────────

describe('parseServerMessage', () => {
  it('parses an auth_ok message', () => {
    const raw = JSON.stringify({
      type: 'auth_ok',
      playerIndex: 0,
      battleId: 'battle-123',
      opponentAddress: '0xdeadbeef',
      opponentTokenId: 42,
    });

    const msg = parseServerMessage(raw);

    expect(msg).not.toBeNull();
    expect(msg?.type).toBe('auth_ok');
    if (msg?.type === 'auth_ok') {
      expect(msg.playerIndex).toBe(0);
      expect(msg.battleId).toBe('battle-123');
    }
  });

  it('parses a state message and preserves nested structure', () => {
    const raw = JSON.stringify({
      type: 'state',
      state: {
        tick: 7,
        roundNumber: 1,
        roundTimer: 55,
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
            aimYaw: 1.5,
            aimPitch: -0.2,
            stance: 'crouched',
            scoped: true,
            hp: 80,
            ammo: 3,
            reloading: false,
            alive: true,
          },
        ],
        events: [],
      },
    });

    const msg = parseServerMessage(raw);

    expect(msg).not.toBeNull();
    expect(msg?.type).toBe('state');
    if (msg?.type === 'state') {
      expect(msg.state.tick).toBe(7);
      expect(msg.state.players[0].hp).toBe(100);
      expect(msg.state.players[1].stance).toBe('crouched');
    }
  });

  it('returns null for invalid JSON', () => {
    expect(parseServerMessage('not-json{{')).toBeNull();
  });

  it('returns null when type field is missing', () => {
    const raw = JSON.stringify({ roomId: 'abc', data: 42 });
    expect(parseServerMessage(raw)).toBeNull();
  });

  it('returns null for a JSON null value', () => {
    expect(parseServerMessage('null')).toBeNull();
  });

  it('returns null for a JSON number', () => {
    expect(parseServerMessage('42')).toBeNull();
  });

  it('parses a countdown message', () => {
    const raw = JSON.stringify({ type: 'countdown', seconds: 3, round: 1 });
    const msg = parseServerMessage(raw);
    expect(msg?.type).toBe('countdown');
    if (msg?.type === 'countdown') {
      expect(msg.seconds).toBe(3);
      expect(msg.round).toBe(1);
    }
  });

  it('parses a match_result message', () => {
    const raw = JSON.stringify({
      type: 'match_result',
      winner: 1,
      finalScore: [1, 2],
    });
    const msg = parseServerMessage(raw);
    expect(msg?.type).toBe('match_result');
    if (msg?.type === 'match_result') {
      expect(msg.winner).toBe(1);
      expect(msg.finalScore).toEqual([1, 2]);
    }
  });
});
