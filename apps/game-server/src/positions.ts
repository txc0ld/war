// apps/game-server/src/positions.ts
import type { SpawnPair } from '@warpath/shared';

export const ARENA_SPAWN_PAIRS: SpawnPair[] = [
  {
    player0: { x: -2, y: 0, z: 0, facingYaw: 0 },
    player1: { x: 2, y: 0, z: 50, facingYaw: Math.PI },
  },
  {
    player0: { x: 3, y: 0, z: 0, facingYaw: -0.06 },
    player1: { x: -3, y: 0, z: 50, facingYaw: Math.PI + 0.06 },
  },
  {
    player0: { x: 0, y: 0, z: 2, facingYaw: 0.03 },
    player1: { x: 0, y: 0, z: 48, facingYaw: Math.PI - 0.03 },
  },
  {
    player0: { x: -4, y: 0, z: 1, facingYaw: 0.08 },
    player1: { x: 4, y: 0, z: 49, facingYaw: Math.PI - 0.08 },
  },
  {
    player0: { x: 1, y: 0, z: 0, facingYaw: -0.02 },
    player1: { x: -1, y: 0, z: 50, facingYaw: Math.PI + 0.02 },
  },
];
