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
