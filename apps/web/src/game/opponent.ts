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
 * The Mixamo Vanguard glb authored by three.js stores positions in
 * CENTIMETRES, not metres. Without scaling, the soldier is ~180 m tall.
 * 0.01 brings it down to a real-world ~1.8 m which fits the HITBOX
 * standing height of 1.65 m.
 */
const SOLDIER_SCALE = 0.01;

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

  // Anim diagnostics surfaced to an on-screen HUD overlay.
  #diagOverlay: HTMLDivElement | null = null;
  readonly #diag: {
    tracksFound: string[];
    idleFound: boolean;
    runFound: boolean;
    stateGraphLoaded: boolean;
    idleAssigned: boolean;
    runAssigned: boolean;
    playedIdle: boolean;
    error: string;
  } = {
    tracksFound: [],
    idleFound: false,
    runFound: false,
    stateGraphLoaded: false,
    idleAssigned: false,
    runAssigned: false,
    playedIdle: false,
    error: '',
  };

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
    // The Mixamo Vanguard glb stores the skeleton in a Mixamo-style Z-up
    // orientation. PlayCanvas's instantiateRenderEntity does NOT carry the
    // glTF root-node correction matrix that three.js applies, so the soldier
    // ends up laying on its back. Rotate -90° around X to stand it upright,
    // and 180° around Y so its chest faces -Z (toward the camera at default
    // yaw=0). The parent #root entity owns the WORLD yaw rotation, so this
    // local fix is preserved when we yaw the opponent each frame.
    entity.setLocalEulerAngles(-90, 180, 0);
    this.#root.addChild(entity);
    this.#soldierEntity = entity;
    this.#placeholder.enabled = false;

    // ── Anim component + state graph ──
    // PlayCanvas v2 anim API requires:
    //   1. Add 'anim' component with activate: true
    //   2. Load a state graph that names every state we want to drive
    //   3. assignAnimation(stateName, track) — where stateName is "Layer.State"
    //      using DOT notation, NOT the multi-arg overload
    entity.addComponent('anim', { activate: true, speed: 1 });

    const containerAny = container as unknown as { animations?: pc.Asset[] };
    const animAssets = containerAny.animations ?? [];

    // Diagnostics — surface this in the on-screen HUD so we don't need DevTools.
    const animNames = animAssets
      .map((a) => a.name ?? '(unnamed)')
      .filter((n) => n.length > 0);
    this.#diag.tracksFound = animNames;

    // Minimal state graph: just Idle and Run, both looping. Use a "Layer.State"
    // dot path for assignAnimation.
    const stateGraph = {
      layers: [
        {
          name: 'Base',
          states: [
            { name: 'START' },
            { name: 'Idle', speed: 1.0, loop: true },
            { name: 'Run', speed: 1.0, loop: true },
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
      this.#diag.stateGraphLoaded = true;
    } catch (e) {
      this.#diag.stateGraphLoaded = false;
      this.#diag.error = String(e);
      // eslint-disable-next-line no-console
      console.warn('[opponent] loadStateGraph failed:', e);
    }

    // Find the Idle and Run tracks. Tolerate any name containing 'idle'/'run'.
    let idleTrack: pc.AnimTrack | null = null;
    let runTrack: pc.AnimTrack | null = null;
    for (const animAsset of animAssets) {
      const track = animAsset.resource as pc.AnimTrack | undefined;
      if (track === undefined || track === null) continue;
      const lower = (animAsset.name ?? '').toLowerCase();
      if (idleTrack === null && lower.includes('idle')) idleTrack = track;
      else if (runTrack === null && lower.includes('run') && !lower.includes('idle')) {
        runTrack = track;
      }
    }
    this.#diag.idleFound = idleTrack !== null;
    this.#diag.runFound = runTrack !== null;

    // Assign with the documented dotted-state-name form.
    if (idleTrack !== null) {
      try {
        entity.anim?.assignAnimation('Base.Idle', idleTrack);
        this.#diag.idleAssigned = true;
      } catch (e) {
        this.#diag.error = `idle: ${String(e)}`;
        // eslint-disable-next-line no-console
        console.warn('[opponent] assignAnimation(Base.Idle) failed:', e);
      }
    }
    if (runTrack !== null) {
      try {
        entity.anim?.assignAnimation('Base.Run', runTrack);
        this.#diag.runAssigned = true;
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[opponent] assignAnimation(Base.Run) failed:', e);
      }
    }

    // Force-play Idle. The START → Idle transition should auto-trigger but
    // we play explicitly as a belt-and-braces.
    try {
      entity.anim?.baseLayer?.play('Idle');
      this.#diag.playedIdle = true;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[opponent] baseLayer.play(Idle) failed:', e);
    }
    this.#currentAnimState = 'Idle';

    // Render the diagnostic to the on-screen HUD.
    this.#renderDiag();
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
    if (this.#diagOverlay !== null) {
      this.#diagOverlay.remove();
      this.#diagOverlay = null;
    }
  }

  /**
   * Render the anim diagnostic to a small fixed overlay so we can read it
   * without opening DevTools. Only used during the soldier-debug iteration —
   * remove once the animation is reliably playing.
   */
  #renderDiag(): void {
    if (typeof document === 'undefined') return;
    if (this.#diagOverlay === null) {
      const el = document.createElement('div');
      el.style.cssText = [
        'position: fixed',
        'left: 12px',
        'bottom: 12px',
        'z-index: 99999',
        'background: rgba(0,0,0,0.7)',
        'color: #00f0ff',
        'font: 11px ui-monospace, Menlo, monospace',
        'padding: 8px 10px',
        'border: 1px solid #00f0ff',
        'border-radius: 4px',
        'pointer-events: none',
        'max-width: 360px',
      ].join('; ');
      document.body.appendChild(el);
      this.#diagOverlay = el;
    }
    const d = this.#diag;
    this.#diagOverlay.textContent =
      `[soldier anim] tracks=[${d.tracksFound.join(', ')}] ` +
      `idle:found=${d.idleFound},assigned=${d.idleAssigned} ` +
      `run:found=${d.runFound},assigned=${d.runAssigned} ` +
      `graph=${d.stateGraphLoaded} play=${d.playedIdle}` +
      (d.error.length > 0 ? ` ERR=${d.error}` : '');
  }
}
