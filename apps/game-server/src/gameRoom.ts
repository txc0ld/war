import { S2_MATCH_CONFIG } from '@warpath/shared';
import type { ClientInput, GameEvent, GameState, PlayerState, S2MatchResult, SpawnPair } from '@warpath/shared';
import { MutablePlayerState } from './playerState';
import { checkHit } from './hitDetection';
import { RoundManager } from './roundManager';

const TICK_MS = 1000 / S2_MATCH_CONFIG.TICK_RATE;
const HISTORY_SIZE = 6;

export class GameRoom {
  private players: [MutablePlayerState, MutablePlayerState] = [
    new MutablePlayerState(),
    new MutablePlayerState(),
  ];
  private roundManager = new RoundManager();
  private tickCount = 0;
  private elapsedMs = 0;
  private stateHistory: Array<[PlayerState, PlayerState]> = [];

  get phase(): string { return this.roundManager.phase; }
  get roundNumber(): number { return this.roundManager.roundNumber; }

  startRound(): GameEvent {
    this.players[0].reset();
    this.players[1].reset();
    this.tickCount = 0;
    this.elapsedMs = 0;
    this.stateHistory = [];
    return this.roundManager.startRound();
  }

  advanceRound(): void { this.roundManager.advanceRound(); }

  getCurrentSpawn(): SpawnPair { return this.roundManager.getCurrentSpawn(); }

  processTick(inputs: [ClientInput | null, ClientInput | null]): GameState {
    this.tickCount++;
    this.elapsedMs += TICK_MS;
    const events: GameEvent[] = [];

    // Save state history for lag compensation
    this.stateHistory.push([this.players[0].snapshot(), this.players[1].snapshot()]);
    if (this.stateHistory.length > HISTORY_SIZE) this.stateHistory.shift();

    // Apply inputs (aim, stance, scope, reload)
    for (let i = 0; i < 2; i++) {
      const input = inputs[i];
      if (input) {
        this.players[i]!.applyInput(input, this.elapsedMs);
        if (input.reload && !this.players[i]!.reloading) {
          this.players[i]!.startReload(this.elapsedMs);
        }
      }
    }

    // Process fire events (only during active round)
    if (this.roundManager.phase === 'active') {
      for (let i = 0; i < 2; i++) {
        const input = inputs[i];
        const shooter = this.players[i]!;
        const targetIdx = (i === 0 ? 1 : 0) as 0 | 1;
        const target = this.players[targetIdx]!;

        if (input?.fire && shooter.canFire(this.elapsedMs) && shooter.alive && target.alive) {
          shooter.fire(this.elapsedMs);

          // Lag compensation: use historical target stance
          const lagTicks = this.estimateLagTicks(input.timestamp);
          const historicalTarget = this.getHistoricalState(targetIdx, lagTicks);
          const targetStance = historicalTarget?.stance ?? target.stance;

          const spawn = this.getCurrentSpawn();
          const shooterPos = i === 0 ? spawn.player0 : spawn.player1;
          const targetPos = i === 0 ? spawn.player1 : spawn.player0;

          const result = checkHit(
            shooterPos, shooterPos.facingYaw, shooter.stance,
            input.aimYaw, input.aimPitch,
            targetPos, targetStance
          );

          if (result.hit) {
            target.takeDamage(result.damage);
            events.push({ type: 'hit', target: targetIdx, zone: result.zone, damage: result.damage });

            if (!target.alive) {
              const headshot = result.zone === 'head';
              events.push({ type: 'kill', killer: i as 0 | 1, victim: targetIdx, headshot });
              const roundEvents = this.roundManager.onPlayerKilled(i as 0 | 1, targetIdx, headshot);
              this.roundManager.setRoundHp(this.players[0].hp, this.players[1].hp);
              events.push(...roundEvents);
            }
          }
        }
      }
    }

    // Update reloads
    for (const player of this.players) player.updateReload(this.elapsedMs);

    // Update round timer
    if (this.roundManager.phase === 'active') {
      this.roundManager.tick(TICK_MS);
      if (this.roundManager.timerMs <= 0) {
        const timerEvents = this.roundManager.onTimerExpired(this.players[0].hp, this.players[1].hp);
        this.roundManager.setRoundHp(this.players[0].hp, this.players[1].hp);
        events.push(...timerEvents);
      }
    }

    return {
      tick: this.tickCount,
      roundNumber: this.roundManager.roundNumber,
      roundTimer: this.roundManager.timerMs,
      players: [this.players[0].snapshot(), this.players[1].snapshot()],
      events,
    };
  }

  getMatchResult(): S2MatchResult | null { return this.roundManager.getMatchResult(); }
  isMatchOver(): boolean { return this.roundManager.isMatchOver(); }

  private estimateLagTicks(clientTimestamp: number): number {
    if (clientTimestamp <= 0) return 0;
    const rttEstimate = Date.now() - clientTimestamp;
    const lagMs = Math.max(0, rttEstimate / 2);
    return Math.min(Math.round(lagMs / TICK_MS), HISTORY_SIZE - 1);
  }

  private getHistoricalState(playerIndex: 0 | 1, lagTicks: number): PlayerState | null {
    const idx = this.stateHistory.length - 1 - lagTicks;
    if (idx < 0 || idx >= this.stateHistory.length) return null;
    return this.stateHistory[idx]![playerIndex];
  }
}
