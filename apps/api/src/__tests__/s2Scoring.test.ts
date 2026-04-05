import { describe, expect, it } from 'vitest';
import { calculateMatchScores } from '../services/s2Scoring';

describe('calculateMatchScores', () => {
  it('awards round wins, match win bonus, and headshot bonus to winner', () => {
    const result = {
      winner: 0 as const,
      rounds: [
        { round: 1, winner: 0 as const, killerHeadshot: true, player0Hp: 100, player1Hp: 0, durationMs: 15000 },
        { round: 2, winner: 1 as const, killerHeadshot: false, player0Hp: 0, player1Hp: 45, durationMs: 30000 },
        { round: 3, winner: 0 as const, killerHeadshot: false, player0Hp: 45, player1Hp: 0, durationMs: 25000 },
        { round: 4, winner: 0 as const, killerHeadshot: true, player0Hp: 100, player1Hp: 0, durationMs: 10000 },
      ],
      leftScore: 0,
      rightScore: 0,
    };

    const scores = calculateMatchScores(result);

    // Player 0 (winner): 3 round wins (300) + 2 headshots (50) + match win (150) + 1 round loss (10) = 510
    expect(scores.player0Score).toBe(510);

    // Player 1 (loser): 1 round win (100) + 0 headshots + 0 match bonus + 3 round losses (30) = 130
    expect(scores.player1Score).toBe(130);
  });

  it('gives participation points for round losses', () => {
    const result = {
      winner: 0 as const,
      rounds: [
        { round: 1, winner: 0 as const, killerHeadshot: false, player0Hp: 45, player1Hp: 0, durationMs: 40000 },
        { round: 2, winner: 0 as const, killerHeadshot: false, player0Hp: 45, player1Hp: 0, durationMs: 35000 },
        { round: 3, winner: 0 as const, killerHeadshot: false, player0Hp: 100, player1Hp: 0, durationMs: 20000 },
      ],
      leftScore: 0,
      rightScore: 0,
    };

    const scores = calculateMatchScores(result);

    // Player 1 (loser): 0 round wins + 3 round losses (30) = 30
    expect(scores.player1Score).toBe(30);
  });
});
