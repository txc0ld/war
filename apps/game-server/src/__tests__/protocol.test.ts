import { describe, expect, it } from 'vitest';
import { parseClientMessage, serializeServerMessage } from '../protocol';
import type { ClientMessage, ServerMessage } from '@warpath/shared';

describe('parseClientMessage', () => {
  it('parses a valid auth message', () => {
    const raw = JSON.stringify({ type: 'auth', roomId: 'room-1', roomToken: 'token-abc' });
    const result = parseClientMessage(raw);
    expect(result).toEqual({ type: 'auth', roomId: 'room-1', roomToken: 'token-abc' });
  });

  it('parses a valid input message', () => {
    const raw = JSON.stringify({
      type: 'input',
      input: {
        aimYaw: 0.1, aimPitch: -0.05, fire: true, scope: false,
        scopeZoom: 1, crouch: false, reload: false, timestamp: 1000,
      },
    });
    const result = parseClientMessage(raw);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('input');
  });

  it('parses a ping message', () => {
    const raw = JSON.stringify({ type: 'ping' });
    expect(parseClientMessage(raw)).toEqual({ type: 'ping' });
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
      type: 'auth_ok', playerIndex: 0, battleId: 'battle-1',
      opponentAddress: '0xabc', opponentTokenId: 42,
    };
    expect(JSON.parse(serializeServerMessage(msg))).toEqual(msg);
  });

  it('serializes a state message', () => {
    const msg: ServerMessage = {
      type: 'state',
      state: {
        tick: 1, roundNumber: 1, roundTimer: 59000,
        players: [
          { aimYaw: 0, aimPitch: 0, stance: 'standing', scoped: false, hp: 100, ammo: 5, reloading: false, alive: true, x: 0, y: 0, z: 0 },
          { aimYaw: 0, aimPitch: 0, stance: 'standing', scoped: false, hp: 100, ammo: 5, reloading: false, alive: true, x: 0, y: 0, z: 65 },
        ],
        events: [],
      },
    };
    expect(JSON.parse(serializeServerMessage(msg))).toEqual(msg);
  });
});
