import { describe, expect, it } from 'vitest';
import { getStatsForToken, resolveBattle } from '../stats.js';

describe('stats', () => {
  it('returns deterministic stats for the same token', () => {
    const first = getStatsForToken(42);
    const second = getStatsForToken(42);

    expect(first).toEqual(second);
    expect(first.damage).toBeGreaterThanOrEqual(1);
    expect(first.damage).toBeLessThanOrEqual(100);
    expect(first.dodge).toBeGreaterThanOrEqual(1);
    expect(first.dodge).toBeLessThanOrEqual(100);
    expect(first.speed).toBeGreaterThanOrEqual(1);
    expect(first.speed).toBeLessThanOrEqual(100);
  });

  it('breaks ties in favor of the left fighter deterministically', () => {
    const stats = getStatsForToken(7);
    const result = resolveBattle(stats, stats, 'tie-breaker-seed');

    expect(result.winner).toBe('left');
    expect(result.leftHpRemaining).toBeGreaterThan(0);
    expect(result.rightHpRemaining).toBe(0);
    expect(result.rounds.length).toBeGreaterThan(0);
  });

  it('handles extreme stat inputs without leaving invalid hp values', () => {
    const result = resolveBattle(
      { damage: 0, dodge: 0, speed: 0 },
      { damage: 100, dodge: 100, speed: 100 },
      'extreme-seed'
    );

    expect(result.winner).toBe('right');
    expect(result.leftHpRemaining).toBeGreaterThanOrEqual(0);
    expect(result.rightHpRemaining).toBeGreaterThanOrEqual(0);
    expect(result.leftHpRemaining).toBeLessThanOrEqual(100);
    expect(result.rightHpRemaining).toBeLessThanOrEqual(100);
    expect(result.rounds.length).toBeGreaterThan(0);
  });
});
