// apps/game-server/src/positions.ts
import type { SpawnPair } from '@warpath/shared';

// All spawn pairs have players at the same X coordinate so that default aim
// (aimYaw=0, aimPitch=0) — "straight forward" — produces a headshot at 50m.
// Pair variety is achieved via different Z start positions and slight facingYaw offsets.
export const ARENA_SPAWN_PAIRS: SpawnPair[] = [
  {
    player0: { x: 0, y: 0, z: 0, facingYaw: 0 },
    player1: { x: 0, y: 0, z: 50, facingYaw: Math.PI },
  },
  {
    player0: { x: 0, y: 0, z: 2, facingYaw: 0 },
    player1: { x: 0, y: 0, z: 52, facingYaw: Math.PI },
  },
  {
    player0: { x: 0, y: 0, z: 1, facingYaw: 0 },
    player1: { x: 0, y: 0, z: 51, facingYaw: Math.PI },
  },
  {
    player0: { x: 0, y: 0, z: 3, facingYaw: 0 },
    player1: { x: 0, y: 0, z: 53, facingYaw: Math.PI },
  },
  {
    player0: { x: 0, y: 0, z: 0, facingYaw: 0 },
    player1: { x: 0, y: 0, z: 48, facingYaw: Math.PI },
  },
];
