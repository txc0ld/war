// packages/shared/src/s2GameTypes.ts

// ── 3D math primitive ──
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

// ── Per-tick client input ──
export interface ClientInput {
  aimYaw: number;
  aimPitch: number;
  fire: boolean;
  scope: boolean;
  scopeZoom: 1 | 2;
  crouch: boolean;
  reload: boolean;
  // ── WASD movement intent (truthy when key is held) ──
  moveForward: boolean;
  moveBackward: boolean;
  moveLeft: boolean;
  moveRight: boolean;
  // ── Jump intent (one-shot, consumed each tick) ──
  jump: boolean;
  timestamp: number;
}

// ── Player state snapshot (broadcast each tick) ──
export interface PlayerState {
  aimYaw: number;
  aimPitch: number;
  stance: 'standing' | 'crouched';
  scoped: boolean;
  hp: number;
  ammo: number;
  reloading: boolean;
  alive: boolean;
  // ── World-space position (server authoritative) ──
  x: number;
  y: number;
  z: number;
}

// ── Spawn angles sent with round_start (deprecated — use SpawnInfo) ──
export interface SpawnAngles {
  yaw: number;
  pitch: number;
}

// ── Spawn info sent with round_start (position + facing direction) ──
export interface SpawnInfo {
  x: number;
  y: number;
  z: number;
  facingYaw: number;
  aimYaw: number;
  aimPitch: number;
}

// ── Events emitted during a tick ──
export type GameEvent =
  | { type: 'hit'; target: 0 | 1; zone: 'head' | 'body'; damage: number }
  | { type: 'kill'; killer: 0 | 1; victim: 0 | 1; headshot: boolean }
  | { type: 'round_start'; round: number; positions: [SpawnInfo, SpawnInfo] }
  | { type: 'round_end'; winner: 0 | 1 | null; score: [number, number] }
  | { type: 'match_end'; winner: 0 | 1; finalScore: [number, number] };

// ── Full game state broadcast each tick ──
export interface GameState {
  tick: number;
  roundNumber: number;
  roundTimer: number;
  players: [PlayerState, PlayerState];
  events: GameEvent[];
}

// ── Client → Server messages ──
export type ClientMessage =
  | { type: 'auth'; roomId: string; roomToken: string }
  | { type: 'input'; input: ClientInput }
  | { type: 'ping' };

// ── Server → Client messages ──
export type ServerMessage =
  | { type: 'auth_ok'; playerIndex: 0 | 1; battleId: string; opponentAddress: string; opponentTokenId: number }
  | { type: 'auth_error'; reason: string }
  | { type: 'waiting'; message: string }
  | { type: 'countdown'; seconds: number; round: number }
  | { type: 'state'; state: GameState }
  | { type: 'match_result'; winner: 0 | 1; finalScore: [number, number] }
  | { type: 'error'; code: string; message: string }
  | { type: 'pong' };

// ── Spawn position in world space ──
export interface SpawnPosition {
  x: number;
  y: number;
  z: number;
  facingYaw: number;
}

export interface SpawnPair {
  player0: SpawnPosition;
  player1: SpawnPosition;
}

// ── Hit detection result ──
export type HitResult =
  | { hit: false }
  | { hit: true; zone: 'head' | 'body'; damage: number };

// ── Hitbox geometry constants ──
export const HITBOX = {
  STANDING_EYE_Y: 1.65,
  STANDING_BODY_MIN_Y: 0.0,
  STANDING_BODY_MAX_Y: 1.5,
  STANDING_HEAD_CENTER_Y: 1.65,
  STANDING_HEAD_RADIUS: 0.13,
  CROUCHED_EYE_Y: 1.1,
  CROUCHED_BODY_MIN_Y: 0.0,
  CROUCHED_BODY_MAX_Y: 1.0,
  CROUCHED_HEAD_CENTER_Y: 1.1,
  CROUCHED_HEAD_RADIUS: 0.13,
  BODY_HALF_WIDTH: 0.25,
  BODY_HALF_DEPTH: 0.15,
} as const;
