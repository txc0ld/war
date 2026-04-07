// apps/game-server/src/positions.ts
import type { SpawnPair } from '@warpath/shared';

// Spawn positions for the urban warzone arena.
// With WASD movement enabled players can roam, so these are STARTING points
// rather than fixed combat positions. Each pair has the two players facing
// roughly toward each other across the long Z axis of the arena.
//
// World layout (rough):
//
//   X: -35 ←── playable area ──→ +35       (70m wide)
//   Z: -10 ←── playable area ──→ +75       (85m deep)
//
// Player 0 starts on the south side facing north (+Z).
// Player 1 starts on the north side facing south (-Z, ie facingYaw = PI).
export const ARENA_SPAWN_PAIRS: SpawnPair[] = [
  // Pair 0: centre lane spawn
  {
    player0: { x: 0, y: 0, z: 0, facingYaw: 0 },
    player1: { x: 0, y: 0, z: 65, facingYaw: Math.PI },
  },
  // Pair 1: left and right opposing
  {
    player0: { x: -12, y: 0, z: 5, facingYaw: 0 },
    player1: { x: 12, y: 0, z: 60, facingYaw: Math.PI },
  },
  // Pair 2: opposite of pair 1
  {
    player0: { x: 12, y: 0, z: 5, facingYaw: 0 },
    player1: { x: -12, y: 0, z: 60, facingYaw: Math.PI },
  },
  // Pair 3: tight close-range start
  {
    player0: { x: -4, y: 0, z: 25, facingYaw: 0 },
    player1: { x: 4, y: 0, z: 45, facingYaw: Math.PI },
  },
  // Pair 4: wide flanks
  {
    player0: { x: -22, y: 0, z: 8, facingYaw: 0 },
    player1: { x: 22, y: 0, z: 55, facingYaw: Math.PI },
  },
];
