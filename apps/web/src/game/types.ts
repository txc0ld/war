// apps/web/src/game/types.ts
// Local game types for the Deadshot PlayCanvas integration.
// These are NOT shared-package types — they describe the game layer's imperative API.

import type { SniperMetadata } from '@warpath/shared';

export interface GameConfig {
  sniper: SniperMetadata;
  opponentSniper: SniperMetadata;
  wsUrl: string;
  roomId: string;
  roomToken: string;
  playerIndex: 0 | 1;
  /**
   * Solo preview mode. When true, the game does NOT open a WebSocket
   * connection to the game server — the arena renders, mouse aims the
   * camera, and WASD applies movement locally so a single user can walk
   * around without an opponent. Used for testing the visuals + movement
   * loop without requiring matchmaking.
   */
  previewMode?: boolean;
}

export interface MatchResultEvent {
  winner: 0 | 1;
  finalScore: [number, number];
}

export interface GameErrorEvent {
  reason: string;
}

export type GameEventMap = {
  match_result: MatchResultEvent;
  error: GameErrorEvent;
  disconnected: undefined;
  connected: undefined;
};
