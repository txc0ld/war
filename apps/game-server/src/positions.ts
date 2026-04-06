// apps/game-server/src/positions.ts
import type { SpawnPair } from '@warpath/shared';

// Diverse spawn positions with lateral offsets and varied engagement distances.
export const ARENA_SPAWN_PAIRS: SpawnPair[] = [
  // Pair 0: Centre lane, 50m — the classic
  {
    player0: { x: 0, y: 0, z: 0, facingYaw: 0 },
    player1: { x: 0, y: 0, z: 50, facingYaw: Math.PI },
  },
  // Pair 1: Left offset, 45m — slight angle
  {
    player0: { x: -4, y: 0, z: 0, facingYaw: 0 },
    player1: { x: 4, y: 0, z: 45, facingYaw: Math.PI },
  },
  // Pair 2: Right offset, 55m — longer range
  {
    player0: { x: 3, y: 0, z: 2, facingYaw: 0 },
    player1: { x: -3, y: 0, z: 57, facingYaw: Math.PI },
  },
  // Pair 3: Wide lateral, 40m — close and off-axis
  {
    player0: { x: -6, y: 0, z: 5, facingYaw: 0 },
    player1: { x: 6, y: 0, z: 45, facingYaw: Math.PI },
  },
  // Pair 4: Near-symmetric, 48m — subtle offset
  {
    player0: { x: 2, y: 0, z: 1, facingYaw: 0 },
    player1: { x: -2, y: 0, z: 49, facingYaw: Math.PI },
  },
  // Pair 5: Hard angle, 42m
  {
    player0: { x: -8, y: 0, z: 0, facingYaw: 0 },
    player1: { x: 8, y: 0, z: 42, facingYaw: Math.PI },
  },
  // Pair 6: Centre lane, short range, 35m — fast round
  {
    player0: { x: 0, y: 0, z: 0, facingYaw: 0 },
    player1: { x: 0, y: 0, z: 35, facingYaw: Math.PI },
  },
  // Pair 7: Diagonal offset, 52m
  {
    player0: { x: -5, y: 0, z: 3, facingYaw: 0 },
    player1: { x: 5, y: 0, z: 55, facingYaw: Math.PI },
  },
];
