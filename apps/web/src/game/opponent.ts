// apps/web/src/game/opponent.ts
// Opponent rendering for the Deadshot sniper duel.
// Creates a simple humanoid placeholder (box body + sphere head) positioned
// in the world using hitbox-accurate geometry from @warpath/shared.

import * as pc from 'playcanvas';
import { HITBOX } from '@warpath/shared';
import type { PlayerState } from '@warpath/shared';

const RAD_TO_DEG = 180 / Math.PI;

/**
 * Apply a material to every mesh instance on a render component.
 */
function applyMaterial(entity: pc.Entity, material: pc.StandardMaterial): void {
  const meshInstances = entity.render?.meshInstances;
  if (meshInstances === null || meshInstances === undefined) return;
  for (const mi of meshInstances) {
    mi.material = material;
  }
}

export class OpponentRenderer {
  readonly #root: pc.Entity;
  readonly #body: pc.Entity;
  readonly #head: pc.Entity;

  #spawnX: number = 0;
  #spawnZ: number = -20;

  constructor(app: pc.Application) {
    // ── Root entity ───────────────────────────────────────────────────────────
    this.#root = new pc.Entity('opponent');

    // ── Body (box) ─────────────────────────────────────────────────────────────
    this.#body = new pc.Entity('OpponentBody');
    this.#body.addComponent('render', { type: 'box' });

    const bodyMaterial = new pc.StandardMaterial();
    bodyMaterial.diffuse = new pc.Color(0.3, 0.15, 0.1);
    bodyMaterial.update();
    applyMaterial(this.#body, bodyMaterial);

    this.#root.addChild(this.#body);

    // ── Head (sphere) ──────────────────────────────────────────────────────────
    this.#head = new pc.Entity('OpponentHead');
    this.#head.addComponent('render', { type: 'sphere' });

    const headMaterial = new pc.StandardMaterial();
    headMaterial.diffuse = new pc.Color(0.35, 0.2, 0.15);
    headMaterial.update();
    applyMaterial(this.#head, headMaterial);

    this.#root.addChild(this.#head);

    // ── Add root to scene ──────────────────────────────────────────────────────
    app.root.addChild(this.#root);

    // Apply default standing stance immediately.
    this.setStance('standing');
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /** Store the world-space spawn position for this opponent. */
  setSpawnPosition(x: number, z: number): void {
    this.#spawnX = x;
    this.#spawnZ = z;
    this.#root.setPosition(x, 0, z);
  }

  /** Resize body and reposition head to match the given stance. */
  setStance(stance: 'standing' | 'crouched'): void {
    if (stance === 'standing') {
      // Body: full standing height, centred vertically
      this.#body.setLocalScale(
        HITBOX.BODY_HALF_WIDTH * 2,
        HITBOX.STANDING_BODY_MAX_Y,
        HITBOX.BODY_HALF_DEPTH * 2,
      );
      this.#body.setLocalPosition(0, HITBOX.STANDING_BODY_MAX_Y / 2, 0);

      // Head: sphere scaled to head diameter
      const headDiam = HITBOX.STANDING_HEAD_RADIUS * 2;
      this.#head.setLocalScale(headDiam, headDiam, headDiam);
      this.#head.setLocalPosition(0, HITBOX.STANDING_HEAD_CENTER_Y, 0);
    } else {
      // Crouched body
      this.#body.setLocalScale(
        HITBOX.BODY_HALF_WIDTH * 2,
        HITBOX.CROUCHED_BODY_MAX_Y,
        HITBOX.BODY_HALF_DEPTH * 2,
      );
      this.#body.setLocalPosition(0, HITBOX.CROUCHED_BODY_MAX_Y / 2, 0);

      // Crouched head
      const headDiam = HITBOX.CROUCHED_HEAD_RADIUS * 2;
      this.#head.setLocalScale(headDiam, headDiam, headDiam);
      this.#head.setLocalPosition(0, HITBOX.CROUCHED_HEAD_CENTER_Y, 0);
    }
  }

  /**
   * Sync the opponent's visual state to the latest server snapshot.
   * Called once per application tick from the game orchestrator.
   *
   * Position is read from the (interpolated) player state — the server
   * tracks WASD movement so the opponent walks around the arena.
   */
  update(opponentState: PlayerState): void {
    if (!opponentState.alive) {
      this.#root.enabled = false;
      return;
    }

    this.#root.enabled = true;

    // Stance
    this.setStance(opponentState.stance);

    // Position: use server-authoritative coordinates
    this.#root.setPosition(opponentState.x, opponentState.y, opponentState.z);
    this.#spawnX = opponentState.x;
    this.#spawnZ = opponentState.z;

    // Rotate to face toward the player (+180° because the root faces outward
    // by default and we want it to look toward the camera origin).
    const yawDeg = opponentState.aimYaw * RAD_TO_DEG + 180;
    this.#root.setEulerAngles(0, yawDeg, 0);
  }

  /** Remove the opponent entity from the scene and release resources. */
  destroy(): void {
    this.#root.destroy();
  }
}
