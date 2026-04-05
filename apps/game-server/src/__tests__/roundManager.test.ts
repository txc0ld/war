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
    for (let i = 0; i < S2_MATCH_CONFIG.ROUNDS_TO_WIN; i++) {
      rm.startRound();
      rm.onPlayerKilled(0, 1, false);
      if (i < S2_MATCH_CONFIG.ROUNDS_TO_WIN - 1) rm.advanceRound();
    }
    expect(rm.isMatchOver()).toBe(true);
    expect(rm.matchWinner).toBe(0);
  });

  it('plays up to MAX_ROUNDS when no player reaches ROUNDS_TO_WIN early', () => {
    const rm = new RoundManager();
    // Alternate: 0, 1, 0, 1, 0 → player 0 wins 3-2
    for (let i = 0; i < S2_MATCH_CONFIG.MAX_ROUNDS; i++) {
      rm.startRound();
      const winner = (i % 2 === 0 ? 0 : 1) as 0 | 1;
      const loser = (winner === 0 ? 1 : 0) as 0 | 1;
      rm.onPlayerKilled(winner, loser, false);
      if (!rm.isMatchOver()) rm.advanceRound();
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
