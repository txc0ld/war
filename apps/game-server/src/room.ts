// apps/game-server/src/room.ts
import { S2_MATCH_CONFIG } from '@warpath/shared';
import type { ClientInput, S2MatchResult, ServerMessage } from '@warpath/shared';
import type { BattleInfo } from './auth.js';
import { markBattleActive } from './auth.js';
import { GameRoom } from './gameRoom.js';
import { parseClientMessage, serializeServerMessage } from './protocol.js';
import { reportMatchResult } from './resultReporter.js';

const TICK_MS = 1000 / S2_MATCH_CONFIG.TICK_RATE;
const COUNTDOWN_SECONDS = 3;

interface RoomConnection {
  send(data: string): void;
  close(): void;
}

export class Room {
  readonly battleId: string;
  private connections: [RoomConnection | null, RoomConnection | null] = [null, null];
  private inputs: [ClientInput | null, ClientInput | null] = [null, null];
  private game: GameRoom;
  private tickInterval: ReturnType<typeof setInterval> | null = null;
  private countdownInterval: ReturnType<typeof setInterval> | null = null;
  private battle: BattleInfo;
  private disposed = false;
  private onDispose: (() => void) | null = null;

  constructor(battle: BattleInfo, onDispose?: () => void) {
    this.battle = battle;
    this.battleId = battle.id;
    this.game = new GameRoom();
    this.onDispose = onDispose ?? null;
  }

  addConnection(ws: RoomConnection, playerIndex: 0 | 1): void {
    this.connections[playerIndex] = ws;
    if (this.connections[0] && this.connections[1]) {
      if (!this.tickInterval && !this.countdownInterval && !this.disposed) {
        this.startCountdown();
      }
    } else {
      this.send(playerIndex, { type: 'waiting', message: 'Waiting for opponent to connect...' });
    }
  }

  handleMessage(playerIndex: 0 | 1, raw: string): void {
    const msg = parseClientMessage(raw);
    if (!msg) return;
    if (msg.type === 'input') {
      this.inputs[playerIndex] = msg.input;
    } else if (msg.type === 'ping') {
      this.send(playerIndex, { type: 'pong' });
    }
  }

  handleDisconnect(playerIndex: 0 | 1): void {
    this.connections[playerIndex] = null;
    if (!this.disposed) {
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
        this.countdownInterval = null;
      }
      const winner: 0 | 1 = playerIndex === 0 ? 1 : 0;
      this.endMatchForfeit(winner);
    }
  }

  private async startCountdown(): Promise<void> {
    await markBattleActive(this.battle.id);
    let remaining = COUNTDOWN_SECONDS;

    this.broadcast({ type: 'countdown', seconds: remaining, round: this.game.roundNumber });

    this.countdownInterval = setInterval(() => {
      remaining--;
      if (remaining <= 0) {
        if (this.countdownInterval) clearInterval(this.countdownInterval);
        this.countdownInterval = null;
        this.startRound();
      } else {
        this.broadcast({ type: 'countdown', seconds: remaining, round: this.game.roundNumber });
      }
    }, 1000);
  }

  private startRound(): void {
    const startEvent = this.game.startRound();
    // After startRound() the game has placed each player at their spawn — pull
    // the live snapshot so the broadcast carries world coordinates.
    const initialState = this.game.processTick([null, null]);
    this.broadcast({
      type: 'state',
      state: {
        tick: 0,
        roundNumber: this.game.roundNumber,
        roundTimer: S2_MATCH_CONFIG.ROUND_DURATION_MS,
        players: initialState.players,
        events: [startEvent],
      },
    });
    this.tickInterval = setInterval(() => this.tick(), TICK_MS);
  }

  private tick(): void {
    const state = this.game.processTick([this.inputs[0], this.inputs[1]]);
    this.inputs = [null, null];
    this.broadcast({ type: 'state', state });

    for (const event of state.events) {
      if (event.type === 'match_end') {
        this.endMatch(event.winner, event.finalScore);
        return;
      }
      if (event.type === 'round_end' && !this.game.isMatchOver()) {
        if (this.tickInterval) clearInterval(this.tickInterval);
        this.tickInterval = null;
        setTimeout(() => {
          this.game.advanceRound();
          this.startCountdown();
        }, 2000);
        return;
      }
    }
  }

  private async endMatch(winner: 0 | 1, finalScore: [number, number]): Promise<void> {
    if (this.disposed) return;
    this.disposed = true;
    if (this.tickInterval) clearInterval(this.tickInterval);
    if (this.countdownInterval) clearInterval(this.countdownInterval);

    this.broadcast({ type: 'match_result', winner, finalScore });

    const result = this.game.getMatchResult();
    if (result) await reportMatchResult(this.battle.id, result);

    setTimeout(() => this.cleanup(), 2000);
  }

  private async endMatchForfeit(winner: 0 | 1): Promise<void> {
    if (this.disposed) return;
    this.disposed = true;
    if (this.tickInterval) clearInterval(this.tickInterval);
    if (this.countdownInterval) clearInterval(this.countdownInterval);

    const existingResult = this.game.getMatchResult();
    const forfeitResult: S2MatchResult = existingResult ?? {
      winner,
      rounds: [],
      leftScore: 0,
      rightScore: 0,
    };
    await reportMatchResult(this.battle.id, forfeitResult);
    this.cleanup();
  }

  private cleanup(): void {
    for (const conn of this.connections) {
      try { conn?.close(); } catch { /* already closed */ }
    }
    this.connections = [null, null];
    this.onDispose?.();
  }

  private send(playerIndex: 0 | 1, msg: ServerMessage): void {
    const conn = this.connections[playerIndex];
    if (conn) conn.send(serializeServerMessage(msg));
  }

  private broadcast(msg: ServerMessage): void {
    const data = serializeServerMessage(msg);
    for (const conn of this.connections) {
      if (conn) conn.send(data);
    }
  }
}
