import { describe, expect, it } from 'vitest';
import { GameRoom } from '../gameRoom';
import { S2_MATCH_CONFIG } from '@warpath/shared';
import type { ClientInput } from '@warpath/shared';

const noInput: ClientInput = {
  aimYaw: 0, aimPitch: 0, fire: false, scope: false,
  scopeZoom: 1, crouch: false, reload: false,
  moveForward: false, moveBackward: false, moveLeft: false, moveRight: false,
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
    // Run a few idle ticks to establish game time
    for (let i = 0; i < 5; i++) room.processTick([noInput, noInput]);

    // Player 0 fires — default aim (0,0) is forward, pointing at opponent
    const fireInput: ClientInput = { ...noInput, fire: true, timestamp: Date.now() };
    const state = room.processTick([fireInput, noInput]);

    const hitEvents = state.events.filter((e) => e.type === 'hit');
    expect(hitEvents.length).toBeGreaterThanOrEqual(1);
    expect(state.players[1].hp).toBeLessThan(S2_MATCH_CONFIG.PLAYER_HP);
  });

  it('enforces bolt-action cooldown between shots', () => {
    const room = new GameRoom();
    room.startRound();

    const fire: ClientInput = { ...noInput, fire: true, timestamp: Date.now() };
    const state1 = room.processTick([fire, noInput]);
    const hits1 = state1.events.filter((e) => e.type === 'hit');
    expect(hits1.length).toBeGreaterThanOrEqual(1);

    // Immediately fire again — bolt cycle hasn't elapsed
    const state2 = room.processTick([fire, noInput]);
    const hits2 = state2.events.filter((e) => e.type === 'hit');
    expect(hits2).toHaveLength(0);
  });

  it('resolves a full match with a winner', () => {
    const room = new GameRoom();
    let matchEnded = false;
    let matchWinner: 0 | 1 | null = null;

    for (let round = 0; round < S2_MATCH_CONFIG.MAX_ROUNDS && !matchEnded; round++) {
      const roundEvent = room.startRound();
      // Use the computed aimYaw from SpawnInfo so shots hit the opponent
      const aimYaw = roundEvent.type === 'round_start' ? roundEvent.positions[0].aimYaw : 0;
      const aimPitch = roundEvent.type === 'round_start' ? roundEvent.positions[0].aimPitch : 0;

      for (let tick = 0; tick < 200 && !matchEnded; tick++) {
        const elapsed = tick * (1000 / S2_MATCH_CONFIG.TICK_RATE);
        const shouldFire = elapsed % S2_MATCH_CONFIG.BOLT_CYCLE_MS < (1000 / S2_MATCH_CONFIG.TICK_RATE);
        const input: ClientInput = { ...noInput, aimYaw, aimPitch, fire: shouldFire, timestamp: Date.now() };
        const state = room.processTick([input, noInput]);
        for (const event of state.events) {
          if (event.type === 'match_end') {
            matchEnded = true;
            matchWinner = event.winner;
          }
        }
      }
      if (!matchEnded) room.advanceRound();
    }

    expect(matchEnded).toBe(true);
    expect(matchWinner).toBe(0);
    const result = room.getMatchResult();
    expect(result).not.toBeNull();
    expect(result!.winner).toBe(0);
  });
});
