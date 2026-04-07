// apps/web/src/game/opponent.ts
// Opponent rendering for the Deadshot sniper duel.
//
// Strategy:
//   1. Build a humanoid PLACEHOLDER (box + sphere) sized to the HITBOX
//      constants so the opponent is visible the moment the round starts.
//   2. Asynchronously load the soldier glTF (Mixamo Vanguard via three.js
//      examples — MIT licensed, ~2 MB, single mesh + visor, animations
//      embedded).
//   3. When the model arrives, hide the placeholder, add an anim component,
//      assign each animation track from the container, and start in Idle.
//   4. Per-frame: detect whether the opponent has moved since the previous
//      frame and switch between 'Idle' and 'Run' accordingly.
//
// Position, stance, rotation always come from the (interpolated) server
// PlayerState — the server is authoritative over WASD + jump + gravity.

import * as pc from 'playcanvas';
import { HITBOX } from '@warpath/shared';
import type { PlayerState } from '@warpath/shared';

const SOLDIER_URL = '/assets/s2/characters/soldier.glb';

/**
 * The soldier glb is roughly 1.8 m tall in its source units. The HITBOX
 * standing height is 1.65 m. Empirical fudge factor — adjust if the
 * head ends up too high or too low relative to the head hitbox.
 */
const SOLDIER_SCALE = 1.0;

/**
 * Speed (in metres per second) above which we switch the soldier into the
 * Run animation; below this we play Idle.
 */
const RUN_THRESHOLD_MPS = 0.5;

function applyMaterial(entity: pc.Entity, material: pc.StandardMaterial): void {
  const meshInstances = entity.render?.meshInstances;
  if (meshInstances === null || meshInstances === undefined) return;
  for (const mi of meshInstances) {
    mi.material = material;
  }
}

export class OpponentRenderer {
  readonly #app: pc.Application;
  readonly #root: pc.Entity;
  readonly #placeholder: pc.Entity;
  readonly #placeholderBody: pc.Entity;
  readonly #placeholderHead: pc.Entity;
  #soldierEntity: pc.Entity | null = null;
  #currentAnimState: 'Idle' | 'Run' = 'Idle';

  // Track last position to compute movement speed for animation selection.
  #lastPosX: number = 0;
  #lastPosZ: number = 0;
  #lastUpdateMs: number = 0;

  constructor(app: pc.Application) {
    this.#app = app;

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

    // ── Async load the soldier glb ──
    app.assets.loadFromUrl(SOLDIER_URL, 'container', (err, asset) => {
      if (err !== null || asset === undefined) {
        // eslint-disable-next-line no-console
        console.warn('[opponent] failed to load soldier model:', err);
        return;
      }
      this.#mountSoldier(asset.resource as pc.ContainerResource);
    });
  }

  #mountSoldier(container: pc.ContainerResource): void {
    const entity = container.instantiateRenderEntity({
      castShadows: true,
      receiveShadows: true,
    });
    entity.name = 'OpponentSoldier';
    entity.setLocalScale(SOLDIER_SCALE, SOLDIER_SCALE, SOLDIER_SCALE);
    // Many character models are authored facing -Z; rotate so positive aimYaw
    // turns the soldier the way the player is looking. We add 180° in update()
    // anyway to face the camera by default.
    entity.setLocalEulerAngles(0, 0, 0);
    this.#root.addChild(entity);
    this.#soldierEntity = entity;
    this.#placeholder.enabled = false;

    // ── Anim component + state graph ──
    // PlayCanvas's anim API expects a state graph. The simplest viable graph
    // is a single layer with two states (Idle, Run) and an "Any State"
    // transition. We assign the AnimTrack instances pulled from the container
    // resource to those states by name.
    entity.addComponent('anim', {
      activate: true,
      speed: 1,
    });

    const containerAny = container as unknown as { animations?: pc.Asset[] };
    const animAssets = containerAny.animations ?? [];

    // Build a state graph definition: Start → Idle, with a separate Run state.
    // Both states loop. Transitions between them are driven imperatively in
    // update() via baseLayer.transition('Run' / 'Idle').
    const stateGraph = {
      layers: [
        {
          name: 'Base',
          states: [
            { name: 'START' },
            { name: 'Idle', speed: 1, loop: true },
            { name: 'Run', speed: 1, loop: true },
          ],
          transitions: [
            { from: 'START', to: 'Idle', time: 0 },
            { from: 'Idle', to: 'Run', time: 0.15 },
            { from: 'Run', to: 'Idle', time: 0.15 },
          ],
        },
      ],
      parameters: {},
    };

    try {
      entity.anim?.loadStateGraph(stateGraph);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[opponent] loadStateGraph failed:', e);
    }

    // Assign each loaded animation track to the matching state by name.
    for (const animAsset of animAssets) {
      const track = animAsset.resource as pc.AnimTrack | undefined;
      if (track === undefined) continue;
      const name = animAsset.name ?? track.name ?? '';
      try {
        if (name === 'Idle' || name === 'Run') {
          // Pass explicit layer name to pick the multi-layer overload.
          entity.anim?.assignAnimation(name, track, 'Base', 1, true);
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn(`[opponent] assignAnimation(${name}) failed:`, e);
      }
    }

    try {
      entity.anim?.baseLayer?.play('Idle');
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[opponent] baseLayer.play(Idle) failed:', e);
    }
    this.#currentAnimState = 'Idle';
  }

  // ── Public API ────────────────────────────────────────────────────────────

  setSpawnPosition(x: number, z: number): void {
    this.#root.setPosition(x, 0, z);
    this.#lastPosX = x;
    this.#lastPosZ = z;
  }

  /**
   * Resize the placeholder to match the given stance. The soldier glb has
   * a real skeleton — for now we leave it at full standing scale even when
   * crouched (proper crouch needs a baked Crouch anim).
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
    }
  }

  /**
   * Sync the opponent's visual state to the latest (interpolated) server
   * snapshot, and switch animation states based on movement speed.
   */
  update(opponentState: PlayerState): void {
    if (!opponentState.alive) {
      this.#root.enabled = false;
      return;
    }

    this.#root.enabled = true;
    this.setStance(opponentState.stance);

    // Position: server-authoritative coordinates (includes Y for jumps)
    this.#root.setPosition(opponentState.x, opponentState.y, opponentState.z);

    // Compute approximate horizontal speed since the last frame
    const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const dt = Math.max(0.001, (now - this.#lastUpdateMs) / 1000);
    const dx = opponentState.x - this.#lastPosX;
    const dz = opponentState.z - this.#lastPosZ;
    const speed = Math.hypot(dx, dz) / dt;
    this.#lastPosX = opponentState.x;
    this.#lastPosZ = opponentState.z;
    this.#lastUpdateMs = now;

    // Pick animation by speed
    if (this.#soldierEntity !== null) {
      const desired: 'Idle' | 'Run' = speed > RUN_THRESHOLD_MPS ? 'Run' : 'Idle';
      if (desired !== this.#currentAnimState) {
        try {
          this.#soldierEntity.anim?.baseLayer?.transition(desired, 0.15);
        } catch {
          // Ignore — falls back to whatever the previous state was.
        }
        this.#currentAnimState = desired;
      }
    }

    // Rotate to face the direction the opponent is aiming. aimYaw arrives
    // in DEGREES from the wire. The model's authoring forward is -Z, so
    // adding 180° aligns the soldier's chest with the camera by default.
    const yawDeg = opponentState.aimYaw + 180;
    this.#root.setEulerAngles(0, yawDeg, 0);
  }

  destroy(): void {
    this.#root.destroy();
  }
}
