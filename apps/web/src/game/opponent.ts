// apps/web/src/game/opponent.ts
// Opponent rendering for the Deadshot sniper duel.
//
// Strategy:
//   1. Build a humanoid PLACEHOLDER (box + sphere) sized to the HITBOX
//      constants so the opponent is visible the moment the round starts.
//   2. Asynchronously load the soldier glTF from public assets.
//   3. When the model arrives, hide the placeholder and reveal the model.
//
// Position, stance, rotation always come from the (interpolated) server
// PlayerState — the server is authoritative over WASD + jump + gravity.

import * as pc from 'playcanvas';
import { HITBOX } from '@warpath/shared';
import type { PlayerState } from '@warpath/shared';

const SOLDIER_URL = '/assets/s2/characters/soldier.glb';

/**
 * The soldier glb is roughly 1.8 m tall in its source units. The HITBOX
 * standing height is 1.65 m. Scale factor brings the model bounds into
 * line with the hitbox so head shots actually land on the head.
 */
const SOLDIER_SCALE = 0.92;

function applyMaterial(entity: pc.Entity, material: pc.StandardMaterial): void {
  const meshInstances = entity.render?.meshInstances;
  if (meshInstances === null || meshInstances === undefined) return;
  for (const mi of meshInstances) {
    mi.material = material;
  }
}

export class OpponentRenderer {
  readonly #root: pc.Entity;
  readonly #placeholder: pc.Entity;
  readonly #placeholderBody: pc.Entity;
  readonly #placeholderHead: pc.Entity;
  #soldierEntity: pc.Entity | null = null;

  #spawnX: number = 0;
  #spawnZ: number = -20;

  constructor(app: pc.Application) {
    // ── Root entity (drives position + rotation) ──
    this.#root = new pc.Entity('opponent');

    // ── Placeholder hierarchy ──
    this.#placeholder = new pc.Entity('OpponentPlaceholder');
    this.#root.addChild(this.#placeholder);

    this.#placeholderBody = new pc.Entity('OpponentBody');
    this.#placeholderBody.addComponent('render', { type: 'box' });
    const bodyMat = new pc.StandardMaterial();
    bodyMat.diffuse = new pc.Color(0.3, 0.15, 0.1);
    bodyMat.update();
    applyMaterial(this.#placeholderBody, bodyMat);
    this.#placeholder.addChild(this.#placeholderBody);

    this.#placeholderHead = new pc.Entity('OpponentHead');
    this.#placeholderHead.addComponent('render', { type: 'sphere' });
    const headMat = new pc.StandardMaterial();
    headMat.diffuse = new pc.Color(0.35, 0.2, 0.15);
    headMat.update();
    applyMaterial(this.#placeholderHead, headMat);
    this.#placeholder.addChild(this.#placeholderHead);

    app.root.addChild(this.#root);
    this.setStance('standing');

    // ── Async load the soldier glb (fire-and-forget) ──
    app.assets.loadFromUrl(SOLDIER_URL, 'container', (err, asset) => {
      if (err !== null || asset === undefined) {
        // eslint-disable-next-line no-console
        console.warn('[opponent] failed to load soldier model:', err);
        return;
      }
      const container = asset.resource as pc.ContainerResource;
      const entity = container.instantiateRenderEntity({
        castShadows: true,
        receiveShadows: true,
      });
      entity.name = 'OpponentSoldier';
      entity.setLocalScale(SOLDIER_SCALE, SOLDIER_SCALE, SOLDIER_SCALE);
      // Many character models are authored facing -Z; rotate 180° so they
      // face toward the camera by default. The per-frame update() call
      // adjusts yaw on top of this base rotation.
      entity.setLocalEulerAngles(0, 180, 0);
      this.#root.addChild(entity);
      this.#soldierEntity = entity;
      // Hide the placeholder now that the real model is in.
      this.#placeholder.enabled = false;
    });
  }

  // ── Public API ────────────────────────────────────────────────────────────

  setSpawnPosition(x: number, z: number): void {
    this.#spawnX = x;
    this.#spawnZ = z;
    this.#root.setPosition(x, 0, z);
  }

  /**
   * Resize the placeholder body / head to match the given stance. The
   * soldier glb model has its own crouch handling (skeletal animation
   * eventually) — for now we just scale Y down on crouch as a stand-in.
   */
  setStance(stance: 'standing' | 'crouched'): void {
    if (stance === 'standing') {
      this.#placeholderBody.setLocalScale(
        HITBOX.BODY_HALF_WIDTH * 2,
        HITBOX.STANDING_BODY_MAX_Y,
        HITBOX.BODY_HALF_DEPTH * 2,
      );
      this.#placeholderBody.setLocalPosition(0, HITBOX.STANDING_BODY_MAX_Y / 2, 0);

      const headDiam = HITBOX.STANDING_HEAD_RADIUS * 2;
      this.#placeholderHead.setLocalScale(headDiam, headDiam, headDiam);
      this.#placeholderHead.setLocalPosition(0, HITBOX.STANDING_HEAD_CENTER_Y, 0);

      if (this.#soldierEntity !== null) {
        this.#soldierEntity.setLocalScale(SOLDIER_SCALE, SOLDIER_SCALE, SOLDIER_SCALE);
      }
    } else {
      this.#placeholderBody.setLocalScale(
        HITBOX.BODY_HALF_WIDTH * 2,
        HITBOX.CROUCHED_BODY_MAX_Y,
        HITBOX.BODY_HALF_DEPTH * 2,
      );
      this.#placeholderBody.setLocalPosition(0, HITBOX.CROUCHED_BODY_MAX_Y / 2, 0);

      const headDiam = HITBOX.CROUCHED_HEAD_RADIUS * 2;
      this.#placeholderHead.setLocalScale(headDiam, headDiam, headDiam);
      this.#placeholderHead.setLocalPosition(0, HITBOX.CROUCHED_HEAD_CENTER_Y, 0);

      if (this.#soldierEntity !== null) {
        const crouchY = SOLDIER_SCALE * (HITBOX.CROUCHED_BODY_MAX_Y / HITBOX.STANDING_BODY_MAX_Y);
        this.#soldierEntity.setLocalScale(SOLDIER_SCALE, crouchY, SOLDIER_SCALE);
      }
    }
  }

  /**
   * Sync the opponent's visual state to the latest (interpolated) server
   * snapshot. The hitbox the server uses lives at the same x/y/z, so the
   * visible model and the hitbox stay locked together by construction.
   */
  update(opponentState: PlayerState): void {
    if (!opponentState.alive) {
      this.#root.enabled = false;
      return;
    }

    this.#root.enabled = true;

    this.setStance(opponentState.stance);

    // Position: use server-authoritative coordinates (includes Y for jumps)
    this.#root.setPosition(opponentState.x, opponentState.y, opponentState.z);
    this.#spawnX = opponentState.x;
    this.#spawnZ = opponentState.z;

    // Rotate to face the direction the opponent is aiming. aimYaw arrives
    // in DEGREES from the wire (matching the client's setLocalEulerAngles
    // convention). +180° because the model's default forward is -Z and we
    // want positive aimYaw rotations to feel correct from a third-party POV.
    const yawDeg = opponentState.aimYaw + 180;
    this.#root.setEulerAngles(0, yawDeg, 0);
  }

  destroy(): void {
    this.#root.destroy();
  }
}
