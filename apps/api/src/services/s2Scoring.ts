import { eq, sql } from 'drizzle-orm';
import { S2_SCORING } from '@warpath/shared';
import type { S2MatchResult } from '@warpath/shared';
import { db } from '../db/client';
import { s2Battles, s2Players } from '../db/schema';

interface MatchScores {
  player0Score: number;
  player1Score: number;
  player0Headshots: number;
  player1Headshots: number;
  player0Kills: number;
  player1Kills: number;
}

export function calculateMatchScores(result: S2MatchResult): MatchScores {
  let player0Score = 0;
  let player1Score = 0;
  let player0Headshots = 0;
  let player1Headshots = 0;
  let player0Kills = 0;
  let player1Kills = 0;

  for (const round of result.rounds) {
    if (round.winner === 0) {
      player0Score += S2_SCORING.ROUND_WIN;
      player1Score += S2_SCORING.ROUND_LOSS;
      player0Kills++;
      if (round.killerHeadshot) {
        player0Score += S2_SCORING.HEADSHOT_BONUS;
        player0Headshots++;
      }
    } else if (round.winner === 1) {
      player1Score += S2_SCORING.ROUND_WIN;
      player0Score += S2_SCORING.ROUND_LOSS;
      player1Kills++;
      if (round.killerHeadshot) {
        player1Score += S2_SCORING.HEADSHOT_BONUS;
        player1Headshots++;
      }
    }
    // Draws (winner === null) award no points to either player
  }

  if (result.winner === 0) {
    player0Score += S2_SCORING.MATCH_WIN_BONUS;
  } else {
    player1Score += S2_SCORING.MATCH_WIN_BONUS;
  }

  return {
    player0Score,
    player1Score,
    player0Headshots,
    player1Headshots,
    player0Kills,
    player1Kills,
  };
}

export async function applyS2MatchResult(
  battleId: string,
  result: S2MatchResult
): Promise<void> {
  const [battle] = await db
    .select()
    .from(s2Battles)
    .where(eq(s2Battles.id, battleId))
    .limit(1);

  if (!battle || battle.status === 'resolved') {
    return;
  }

  const scores = calculateMatchScores(result);
  const winnerSide = result.winner === 0 ? 'left' : 'right';

  const roundsWon0 = result.rounds.filter((r) => r.winner === 0).length;
  const roundsWon1 = result.rounds.filter((r) => r.winner === 1).length;

  await db.transaction(async (tx) => {
    await tx
      .update(s2Battles)
      .set({
        status: 'resolved',
        winner: winnerSide,
        leftScore: scores.player0Score,
        rightScore: scores.player1Score,
        roundsWonLeft: roundsWon0,
        roundsWonRight: roundsWon1,
        roundsJson: result.rounds as unknown as Record<string, unknown>,
        resolvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(s2Battles.id, battleId));

    // Update left player (player 0)
    await tx
      .update(s2Players)
      .set({
        score: sql`${s2Players.score} + ${scores.player0Score}`,
        wins: result.winner === 0
          ? sql`${s2Players.wins} + 1`
          : s2Players.wins,
        losses: result.winner === 1
          ? sql`${s2Players.losses} + 1`
          : s2Players.losses,
        headshotKills: sql`${s2Players.headshotKills} + ${scores.player0Headshots}`,
        totalKills: sql`${s2Players.totalKills} + ${scores.player0Kills}`,
        winStreak: result.winner === 0
          ? sql`${s2Players.winStreak} + 1`
          : sql`0`,
        updatedAt: new Date(),
      })
      .where(eq(s2Players.address, battle.leftAddress));

    // Update right player (player 1)
    await tx
      .update(s2Players)
      .set({
        score: sql`${s2Players.score} + ${scores.player1Score}`,
        wins: result.winner === 1
          ? sql`${s2Players.wins} + 1`
          : s2Players.wins,
        losses: result.winner === 0
          ? sql`${s2Players.losses} + 1`
          : s2Players.losses,
        headshotKills: sql`${s2Players.headshotKills} + ${scores.player1Headshots}`,
        totalKills: sql`${s2Players.totalKills} + ${scores.player1Kills}`,
        winStreak: result.winner === 1
          ? sql`${s2Players.winStreak} + 1`
          : sql`0`,
        updatedAt: new Date(),
      })
      .where(eq(s2Players.address, battle.rightAddress));
  });
}
