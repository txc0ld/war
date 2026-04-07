// apps/game-server/src/roundManager.ts
import { S2_MATCH_CONFIG } from '@warpath/shared';
import type { GameEvent, S2MatchResult, S2RoundResult, SpawnInfo, SpawnPair } from '@warpath/shared';
import { ARENA_SPAWN_PAIRS } from './positions';

type RoundPhase = 'countdown' | 'active' | 'round_over' | 'match_over';

export class RoundManager {
  roundNumber = 1;
  phase: RoundPhase = 'countdown';
  timerMs = 0;
  score: [number, number] = [0, 0];
  matchWinner: 0 | 1 | null = null;

  private roundResults: S2RoundResult[] = [];
  private currentRoundHeadshot = false;
  private spawnIndex = 0;

  getCurrentSpawn(): SpawnPair {
    return ARENA_SPAWN_PAIRS[this.spawnIndex % ARENA_SPAWN_PAIRS.length]!;
  }

  startRound(): GameEvent {
    this.phase = 'active';
    this.timerMs = S2_MATCH_CONFIG.ROUND_DURATION_MS;
    this.currentRoundHeadshot = false;

    const spawn = this.getCurrentSpawn();
    const p0 = spawn.player0;
    const p1 = spawn.player1;

    // Compute the yaw offset each player needs to aim toward the opponent.
    // atan2 + facingYaw are in radians; the wire protocol carries aimYaw in
    // DEGREES (matching PlayCanvas's setLocalEulerAngles convention), so
    // convert before storing.
    const RAD_TO_DEG = 180 / Math.PI;
    const aim0Yaw = (Math.atan2(p1.x - p0.x, p1.z - p0.z) - p0.facingYaw) * RAD_TO_DEG;
    const aim1Yaw = (Math.atan2(p0.x - p1.x, p0.z - p1.z) - p1.facingYaw) * RAD_TO_DEG;

    const positions: [SpawnInfo, SpawnInfo] = [
      { x: p0.x, y: p0.y, z: p0.z, facingYaw: p0.facingYaw, aimYaw: aim0Yaw, aimPitch: 0 },
      { x: p1.x, y: p1.y, z: p1.z, facingYaw: p1.facingYaw, aimYaw: aim1Yaw, aimPitch: 0 },
    ];

    return {
      type: 'round_start',
      round: this.roundNumber,
      positions,
    };
  }

  tick(deltaMs: number): void {
    if (this.phase === 'active') {
      this.timerMs = Math.max(0, this.timerMs - deltaMs);
    }
  }

  onPlayerKilled(killer: 0 | 1, _victim: 0 | 1, headshot: boolean): GameEvent[] {
    if (this.phase !== 'active') return [];
    this.currentRoundHeadshot = headshot;
    return this.endRound(killer);
  }

  onTimerExpired(player0Hp: number, player1Hp: number): GameEvent[] {
    if (this.phase !== 'active') return [];
    let winner: 0 | 1 | null = null;
    if (player0Hp > player1Hp) winner = 0;
    else if (player1Hp > player0Hp) winner = 1;
    return this.endRound(winner);
  }

  private endRound(winner: 0 | 1 | null): GameEvent[] {
    this.phase = 'round_over';
    if (winner !== null) this.score[winner]++;

    const durationMs = S2_MATCH_CONFIG.ROUND_DURATION_MS - this.timerMs;

    this.roundResults.push({
      round: this.roundNumber,
      winner,
      killerHeadshot: this.currentRoundHeadshot,
      player0Hp: 0,
      player1Hp: 0,
      durationMs,
    });

    const events: GameEvent[] = [
      { type: 'round_end', winner, score: [this.score[0], this.score[1]] },
    ];

    if (this.isMatchOver()) {
      this.phase = 'match_over';
      this.matchWinner = this.score[0] > this.score[1] ? 0 : 1;
      events.push({
        type: 'match_end',
        winner: this.matchWinner,
        finalScore: [this.score[0], this.score[1]],
      });
    }

    return events;
  }

  advanceRound(): void {
    this.roundNumber++;
    this.spawnIndex++;
    this.phase = 'countdown';
  }

  isMatchOver(): boolean {
    return (
      this.score[0] >= S2_MATCH_CONFIG.ROUNDS_TO_WIN ||
      this.score[1] >= S2_MATCH_CONFIG.ROUNDS_TO_WIN ||
      this.roundNumber >= S2_MATCH_CONFIG.MAX_ROUNDS
    );
  }

  getMatchResult(): S2MatchResult | null {
    if (!this.isMatchOver()) return null;
    const winner: 0 | 1 = this.score[0] > this.score[1] ? 0 : 1;
    return { winner, rounds: this.roundResults, leftScore: 0, rightScore: 0 };
  }

  setRoundHp(player0Hp: number, player1Hp: number): void {
    const last = this.roundResults[this.roundResults.length - 1];
    if (last) {
      last.player0Hp = player0Hp;
      last.player1Hp = player1Hp;
    }
  }
}
