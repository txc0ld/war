// apps/web/src/game/weapon.ts
// First-person weapon renderer for the Deadshot sniper duel.
// Attaches a placeholder sniper geometry as a child of the camera entity.

import * as pc from 'playcanvas';
import { S2_MATCH_CONFIG } from '@warpath/shared';

const BOLT_PULL_Z = 0.15;
const RECOIL_RECOVERY_RATE = 0.5; // units per second
const REST_POSITION = new pc.Vec3(0.25, -0.15, -0.5);

/**
 * Apply a material to every mesh instance on a render component.
 * PlayCanvas stores mesh instances in `entity.render.meshInstances`.
 */
function applyMaterial(entity: pc.Entity, material: pc.StandardMaterial): void {
  const meshInstances = entity.render?.meshInstances;
  if (meshInstances === null || meshInstances === undefined) return;
  for (const mi of meshInstances) {
    mi.material = material;
  }
}

export class WeaponRenderer {
  readonly #entity: pc.Entity;
  readonly #boltCycleS: number;
  readonly #reloadDurationS: number;

  #recoilOffset: number = 0;
  #boltTimer: number = 0;
  #reloadTimer: number = 0;

  constructor(cameraEntity: pc.Entity, app: pc.Application) {
    this.#boltCycleS = S2_MATCH_CONFIG.BOLT_CYCLE_MS / 1000;
    this.#reloadDurationS = S2_MATCH_CONFIG.RELOAD_DURATION_MS / 1000;

    // ── Root weapon entity ────────────────────────────────────────────────────
    this.#entity = new pc.Entity('Weapon');

    // ── Sniper body ────────────────────────────────────────────────────────────
    // Elongated box: 0.06 wide × 0.06 tall × 0.6 long
    const body = new pc.Entity('WeaponBody');
    body.addComponent('render', { type: 'box' });
    body.setLocalScale(0.06, 0.06, 0.6);

    const bodyMaterial = new pc.StandardMaterial();
    bodyMaterial.diffuse = new pc.Color(0.2, 0.2, 0.22);
    bodyMaterial.update();
    applyMaterial(body, bodyMaterial);

    this.#entity.addChild(body);

    // ── Scope tube ─────────────────────────────────────────────────────────────
    // Smaller box (0.5 × 0.5 × 0.4 relative to body scale) sitting on top.
    // Absolute scale relative to parent weapon entity:
    //   width/depth: 0.06 * 0.5 = 0.03
    //   height:      0.06 * 0.5 = 0.03
    //   length:      0.6  * 0.4 = 0.24
    const scope = new pc.Entity('WeaponScope');
    scope.addComponent('render', { type: 'box' });
    scope.setLocalScale(0.03, 0.03, 0.24);
    // Position scope on top of the body, centred along the length.
    scope.setLocalPosition(0, 0.045, 0);

    const scopeMaterial = new pc.StandardMaterial();
    scopeMaterial.diffuse = new pc.Color(0.15, 0.15, 0.17);
    scopeMaterial.update();
    applyMaterial(scope, scopeMaterial);

    this.#entity.addChild(scope);

    // ── Attach to camera ───────────────────────────────────────────────────────
    this.#entity.setLocalPosition(REST_POSITION.x, REST_POSITION.y, REST_POSITION.z);
    cameraEntity.addChild(this.#entity);

    // Register with the app so it participates in the update loop via update().
    // (We call update() manually from DeadshotGame, so no script needed.)
    app.root.addChild; // no-op reference — entity is already in hierarchy via camera
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /** Called when the player fires a shot. */
  triggerFire(): void {
    this.#recoilOffset = 0.08;
    this.#boltTimer = this.#boltCycleS;
  }

  /** Called when the player begins a reload. */
  triggerReload(): void {
    this.#reloadTimer = this.#reloadDurationS;
  }

  /** Show or hide the weapon depending on scope state. */
  setScoped(scoped: boolean): void {
    this.#entity.enabled = !scoped;
  }

  /**
   * Advance weapon animations by `dt` seconds.
   * Must be called once per application tick from the game orchestrator.
   */
  update(dt: number): void {
    // 1. Recoil recovery ──────────────────────────────────────────────────────
    if (this.#recoilOffset > 0) {
      this.#recoilOffset = Math.max(0, this.#recoilOffset - RECOIL_RECOVERY_RATE * dt);
    }

    // 2. Bolt animation ───────────────────────────────────────────────────────
    let boltZ = 0;
    if (this.#boltTimer > 0) {
      this.#boltTimer = Math.max(0, this.#boltTimer - dt);
      const progress = 1 - this.#boltTimer / this.#boltCycleS; // 0 → 1 over cycle
      if (progress <= 0.5) {
        // Pull back
        boltZ = BOLT_PULL_Z * (progress * 2);
      } else {
        // Push forward
        boltZ = BOLT_PULL_Z * (1 - (progress - 0.5) * 2);
      }
    }

    // 3. Reload bob ───────────────────────────────────────────────────────────
    let reloadDipY = 0;
    if (this.#reloadTimer > 0) {
      this.#reloadTimer = Math.max(0, this.#reloadTimer - dt);
      const progress = 1 - this.#reloadTimer / this.#reloadDurationS; // 0 → 1
      reloadDipY = -0.15 * Math.sin(progress * Math.PI);
    }

    // 4. Apply combined offset ────────────────────────────────────────────────
    this.#entity.setLocalPosition(
      REST_POSITION.x,
      REST_POSITION.y + reloadDipY,
      REST_POSITION.z + this.#recoilOffset + boltZ,
    );
  }

  /** Remove the weapon entity from the scene and release resources. */
  destroy(): void {
    this.#entity.destroy();
  }
}
