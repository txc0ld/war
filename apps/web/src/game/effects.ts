// apps/web/src/game/effects.ts
// Short-lived visual effects for the Deadshot sniper duel:
// bullet tracers, muzzle flash, and scope glint.

import * as pc from 'playcanvas';

interface ActiveEffect {
  entity: pc.Entity;
  lifetime: number;
  elapsed: number;
}

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

/**
 * Parse a CSS hex colour string (e.g. "#ff8800") into normalised RGB components.
 * Returns null if the string is not a valid 6-digit hex colour.
 */
function parseHexColor(hex: string): { r: number; g: number; b: number } | null {
  const cleaned = hex.startsWith('#') ? hex.slice(1) : hex;
  if (cleaned.length !== 6) return null;
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  return { r: r / 255, g: g / 255, b: b / 255 };
}

export class EffectsManager {
  readonly #app: pc.Application;
  readonly #tracerMat: pc.StandardMaterial;
  readonly #flashMat: pc.StandardMaterial;
  #effects: ActiveEffect[] = [];

  constructor(app: pc.Application) {
    this.#app = app;

    // ── Tracer material ────────────────────────────────────────────────────────
    // Emissive yellow-orange, no lighting contribution.
    this.#tracerMat = new pc.StandardMaterial();
    this.#tracerMat.emissive = new pc.Color(1, 0.8, 0.2);
    this.#tracerMat.emissiveIntensity = 3;
    this.#tracerMat.useLighting = false;
    this.#tracerMat.update();

    // ── Flash material ─────────────────────────────────────────────────────────
    // Emissive orange, additive blend, slightly transparent.
    this.#flashMat = new pc.StandardMaterial();
    this.#flashMat.emissive = new pc.Color(1, 0.6, 0.1);
    this.#flashMat.emissiveIntensity = 5;
    this.#flashMat.useLighting = false;
    this.#flashMat.blendType = pc.BLEND_ADDITIVE;
    this.#flashMat.opacity = 0.8;
    this.#flashMat.update();
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /**
   * Spawn a bullet tracer line between two world-space positions.
   * If `color` is provided as a hex string (e.g. "#ff0000"), the tracer uses
   * a cloned material tinted to that colour instead of the default yellow-orange.
   */
  spawnTracer(from: pc.Vec3, to: pc.Vec3, color?: string): void {
    const entity = new pc.Entity('Tracer');
    entity.addComponent('render', { type: 'box' });

    // Determine material — clone base if a custom colour was supplied.
    let mat: pc.StandardMaterial;
    if (color !== undefined) {
      const parsed = parseHexColor(color);
      mat = this.#tracerMat.clone() as pc.StandardMaterial;
      if (parsed !== null) {
        mat.emissive = new pc.Color(parsed.r, parsed.g, parsed.b);
        mat.update();
      }
    } else {
      mat = this.#tracerMat;
    }
    applyMaterial(entity, mat);

    // Length = distance between the two endpoints.
    const length = from.distance(to);

    // Thicker cross-section so the tracer is actually visible at distance.
    entity.setLocalScale(0.04, 0.04, length);

    // Position at the midpoint.
    const mid = new pc.Vec3().add2(from, to).mulScalar(0.5);
    entity.setPosition(mid.x, mid.y, mid.z);

    // Orient so that local Z points toward `to`.
    entity.lookAt(to);

    this.#app.root.addChild(entity);
    this.#effects.push({ entity, lifetime: 0.15, elapsed: 0 });
  }

  /**
   * Spawn a brief muzzle flash sphere at the given world-space position.
   * Larger + longer-lived than a real muzzle flash so it reads clearly to
   * the player on every shot.
   */
  spawnMuzzleFlash(position: pc.Vec3): void {
    const entity = new pc.Entity('MuzzleFlash');
    entity.addComponent('render', { type: 'sphere' });
    entity.setLocalScale(0.6, 0.6, 0.6);
    entity.setPosition(position.x, position.y, position.z);
    applyMaterial(entity, this.#flashMat);

    this.#app.root.addChild(entity);
    this.#effects.push({ entity, lifetime: 0.14, elapsed: 0 });
  }

  /**
   * Spawn a brief scope-glint sphere at the given world-space position.
   * The glint is offset upward by 1.6 units (approximate head height) and
   * uses a bright white additive emissive material.
   */
  spawnScopeGlint(position: pc.Vec3): void {
    const entity = new pc.Entity('ScopeGlint');
    entity.addComponent('render', { type: 'sphere' });
    entity.setLocalScale(0.05, 0.05, 0.05);
    entity.setPosition(position.x, position.y + 1.6, position.z);

    const mat = new pc.StandardMaterial();
    mat.emissive = new pc.Color(1, 1, 1);
    mat.emissiveIntensity = 8;
    mat.useLighting = false;
    mat.blendType = pc.BLEND_ADDITIVE;
    mat.update();
    applyMaterial(entity, mat);

    this.#app.root.addChild(entity);
    this.#effects.push({ entity, lifetime: 0.3, elapsed: 0 });
  }

  /**
   * Advance all active effects by `dt` seconds.
   * Effects that have exceeded their lifetime are destroyed.
   * Must be called once per application tick from the game orchestrator.
   */
  update(dt: number): void {
    const surviving: ActiveEffect[] = [];

    for (const effect of this.#effects) {
      effect.elapsed += dt;

      if (effect.elapsed >= effect.lifetime) {
        effect.entity.destroy();
      } else {
        // Optional: gently shrink the effect as it ages so it fades out visually.
        const remaining = 1 - effect.elapsed / effect.lifetime;
        const s = remaining;
        const current = effect.entity.getLocalScale();
        effect.entity.setLocalScale(current.x * s, current.y * s, current.z);
        surviving.push(effect);
      }
    }

    this.#effects = surviving;
  }

  /**
   * Destroy all active effect entities and clear the list.
   * Call during game teardown.
   */
  destroy(): void {
    for (const effect of this.#effects) {
      effect.entity.destroy();
    }
    this.#effects = [];
  }
}
