// apps/web/src/game/DeadshotGame.ts
// Orchestrator for the Deadshot PlayCanvas sniper duel.
// React mounts the canvas and calls init(); the rest of the game layer is
// imperative — React never reaches inside the PlayCanvas scene.

import * as pc from 'playcanvas';
import { createScene, destroyScene } from './scene.js';
import type { SceneContext } from './scene.js';
import type { GameConfig, GameEventMap, MatchResultEvent, GameErrorEvent } from './types.js';
import { CameraController } from './camera.js';
import { InputCapture, buildClientInput } from './input.js';
import { GameConnection } from './connection.js';
import type { ConnectionHandlers } from './connection.js';
import { StateManager } from './stateManager.js';
import { WeaponRenderer } from './weapon.js';
import { OpponentRenderer } from './opponent.js';
import { ScopeOverlay } from './scope.js';
import { HudOverlay } from './hud.js';
import { EffectsManager } from './effects.js';

// Handler type for each event key: undefined payload events use () => void.
type EventHandler<K extends keyof GameEventMap> =
  GameEventMap[K] extends undefined
    ? () => void
    : (data: GameEventMap[K]) => void;

// Internal storage type: a union of all possible handler signatures.
type AnyHandler =
  | EventHandler<'match_result'>
  | EventHandler<'error'>
  | EventHandler<'disconnected'>
  | EventHandler<'connected'>;

export class DeadshotGame {
  #scene: SceneContext | null = null;
  #config: GameConfig | null = null;
  #handlers: Map<keyof GameEventMap, Set<AnyHandler>> = new Map();
  #camera: CameraController | null = null;
  #input: InputCapture | null = null;
  #connection: GameConnection | null = null;
  #stateManager: StateManager = new StateManager();
  #weapon: WeaponRenderer | null = null;
  #opponent: OpponentRenderer | null = null;
  #scope: ScopeOverlay | null = null;
  #hud: HudOverlay | null = null;
  #effects: EffectsManager | null = null;

  // ── Per-frame tracking ───────────────────────────────────────────────────
  #lastScopeState: boolean = false;
  #roundScores: [number, number] = [0, 0];

  // ── Lifecycle ────────────────────────────────────────────────────────────

  /**
   * Initialise the PlayCanvas Application on `canvas`.
   * Safe to call once per mount; call `destroy()` before re-initialising.
   */
  init(canvas: HTMLCanvasElement, config: GameConfig): void {
    if (this.#scene !== null) {
      throw new Error('DeadshotGame is already initialised. Call destroy() first.');
    }
    this.#config = config;
    this.#scene = createScene(canvas);

    // ── Camera controller ────────────────────────────────────────────────────
    this.#camera = new CameraController(this.#scene.camera);

    // ── Weapon renderer ───────────────────────────────────────────────────────
    this.#weapon = new WeaponRenderer(this.#scene.camera, this.#scene.app);

    // ── Opponent renderer ─────────────────────────────────────────────────────
    this.#opponent = new OpponentRenderer(this.#scene.app);
    this.#opponent.setSpawnPosition(0, -20);

    // ── Effects manager ───────────────────────────────────────────────────────
    this.#effects = new EffectsManager(this.#scene.app);

    // ── Scope and HUD overlays ────────────────────────────────────────────────
    const overlayParent = canvas.parentElement ?? document.body;
    this.#scope = new ScopeOverlay(overlayParent);
    this.#scope.setReticleImage(config.sniper.scopeReticle);
    this.#hud = new HudOverlay(overlayParent);

    // ── Input capture ────────────────────────────────────────────────────────
    this.#input = new InputCapture(canvas);
    this.#input.attach();

    // ── WebSocket connection ──────────────────────────────────────────────────
    const connectionHandlers: ConnectionHandlers = {
      onAuth: (_msg) => {
        this.#emit('connected', undefined);
      },
      onAuthError: (_msg) => {
        this.#emit('error', { reason: _msg.reason });
      },
      onWaiting: (_msg) => {
        // No action needed — waiting for opponent to join.
      },
      onCountdown: (msg) => {
        this.#hud?.showCountdown(msg.seconds);
      },
      onState: (msg) => {
        this.#stateManager.pushState(msg.state);
      },
      onMatchResult: (msg) => {
        this.#emit('match_result', {
          winner: msg.winner,
          finalScore: msg.finalScore,
        });
      },
      onError: (msgOrError) => {
        const reason =
          msgOrError instanceof Error
            ? msgOrError.message
            : msgOrError.message;
        this.#emit('error', { reason });
      },
      onDisconnect: () => {
        this.#connection = null;
        this.#emit('disconnected', undefined);
      },
    };

    this.#connection = new GameConnection(connectionHandlers);
    this.#connection.connect(config.wsUrl, config.roomId, config.roomToken);

    // ── Register frame update ─────────────────────────────────────────────────
    this.#scene.app.on('update', this.#onUpdate, this);
  }

  /**
   * Tear down the PlayCanvas Application and remove all event handlers.
   */
  destroy(): void {
    // ── Deregister frame update ───────────────────────────────────────────────
    if (this.#scene !== null) {
      this.#scene.app.off('update', this.#onUpdate, this);
    }

    // ── Close WebSocket and reset state ──────────────────────────────────────
    if (this.#connection !== null) {
      this.#connection.disconnect();
      this.#connection = null;
    }
    this.#stateManager.reset();

    // ── Detach input before tearing down the scene ───────────────────────────
    if (this.#input !== null) {
      this.#input.detach();
      this.#input = null;
    }

    this.#camera = null;

    // ── Scope and HUD overlays ────────────────────────────────────────────────
    if (this.#scope !== null) {
      this.#scope.destroy();
      this.#scope = null;
    }

    if (this.#hud !== null) {
      this.#hud.destroy();
      this.#hud = null;
    }

    // ── Effects ───────────────────────────────────────────────────────────────
    if (this.#effects !== null) {
      this.#effects.destroy();
      this.#effects = null;
    }

    // ── Weapon and opponent ───────────────────────────────────────────────────
    if (this.#weapon !== null) {
      this.#weapon.destroy();
      this.#weapon = null;
    }

    if (this.#opponent !== null) {
      this.#opponent.destroy();
      this.#opponent = null;
    }

    if (this.#scene !== null) {
      destroyScene(this.#scene);
      this.#scene = null;
    }
    this.#config = null;
    this.#handlers.clear();

    // Reset per-frame tracking state
    this.#lastScopeState = false;
    this.#roundScores = [0, 0];
  }

  // ── Frame update ──────────────────────────────────────────────────────────

  /**
   * Main game loop tick. Registered with `app.on('update', ...)` and receives
   * delta time in seconds from PlayCanvas.
   */
  #onUpdate(dt: number): void {
    const config = this.#config;
    if (config === null) return;

    const playerIndex = config.playerIndex;
    const opponentIndex: 0 | 1 = playerIndex === 0 ? 1 : 0;

    // ── 1. Read input state ────────────────────────────────────────────────────
    const inputState = this.#input?.getState();
    if (inputState === undefined) return;

    // ── 2. Update camera aim and stance ───────────────────────────────────────
    if (this.#camera !== null) {
      this.#camera.setAim(inputState.aimYaw, inputState.aimPitch);
      this.#camera.setStance(inputState.crouch ? 'crouched' : 'standing');
      this.#camera.update(dt);
    }

    // ── 3. Scope toggle detection ──────────────────────────────────────────────
    const scopeNow = inputState.scope;
    if (scopeNow !== this.#lastScopeState) {
      this.#lastScopeState = scopeNow;

      if (scopeNow) {
        this.#scope?.show();
        this.#camera?.setZoom(inputState.scopeZoom);
        this.#weapon?.setScoped(true);
      } else {
        this.#scope?.hide();
        this.#camera?.setZoom(0);
        this.#weapon?.setScoped(false);
      }
    }

    // While scoped, sync zoom level in case the player changed it (1x ↔ 2x).
    if (scopeNow && this.#camera !== null) {
      this.#camera.setZoom(inputState.scopeZoom);
    }

    // ── 4. Build and send client input ────────────────────────────────────────
    // buildClientInput resets one-shot flags (fire, reload) — call exactly once.
    const clientInput = buildClientInput(inputState);
    this.#connection?.sendInput(clientInput);

    // ── 5. Read server state ───────────────────────────────────────────────────
    const localPlayer = this.#stateManager.getLocalPlayer(playerIndex);
    const opponentState = this.#stateManager.getInterpolatedOpponent(opponentIndex, 0.5);
    const roundTimer = this.#stateManager.getRoundTimer();

    // ── 6. Update HUD ─────────────────────────────────────────────────────────
    if (this.#hud !== null && localPlayer !== null) {
      this.#hud.setHealth(localPlayer.hp);
      this.#hud.setAmmo(localPlayer.ammo, localPlayer.reloading);
      this.#hud.setRoundScore(this.#roundScores[playerIndex], this.#roundScores[opponentIndex]);
      this.#hud.setTimer(roundTimer);
    }

    // ── 7. Update opponent renderer ────────────────────────────────────────────
    this.#opponent?.update(opponentState);

    // ── 8. Process server events ───────────────────────────────────────────────
    const events = this.#stateManager.consumeEvents();
    for (const evt of events) {
      switch (evt.type) {
        case 'hit': {
          if (evt.target === opponentIndex) {
            // We hit the opponent
            this.#hud?.showHitMarker(evt.zone === 'head');
            this.#weapon?.triggerFire();

            // Muzzle flash at camera position
            const camPos = this.#scene?.camera.getPosition().clone();
            if (camPos !== undefined && this.#effects !== null) {
              this.#effects.spawnMuzzleFlash(camPos);

              // Tracer from camera to opponent root
              const opponentPos = new pc.Vec3(0, 1.0, -20);
              this.#effects.spawnTracer(camPos, opponentPos);
            }
          }
          // If target is local player, no additional visual needed beyond
          // the health bar update already handled via server state.
          break;
        }

        case 'kill': {
          if (evt.killer === playerIndex) {
            this.#hud?.showKillBanner(evt.headshot);
          }
          break;
        }

        case 'round_start': {
          // Set initial camera aim from this player's spawn angles
          const spawnAngles = evt.positions[playerIndex];
          this.#input?.setInitialAim(spawnAngles.yaw, spawnAngles.pitch);
          if (this.#camera !== null) {
            this.#camera.setAim(spawnAngles.yaw, spawnAngles.pitch);
          }

          // Reset scope state on new round
          this.#lastScopeState = false;
          this.#scope?.hide();
          this.#camera?.setZoom(0);
          this.#weapon?.setScoped(false);
          break;
        }

        case 'round_end': {
          // Update round scores
          this.#roundScores = [evt.score[0], evt.score[1]];
          break;
        }

        case 'match_end': {
          // match_end is also delivered via onMatchResult from the connection,
          // which emits 'match_result' to the React layer. No duplicate action needed.
          break;
        }

        default: {
          // Exhaustiveness guard — TypeScript will error if a new GameEvent
          // variant is added without a case above.
          const _exhaustive: never = evt;
          void _exhaustive;
          break;
        }
      }
    }

    // ── 9. Update weapon animations ────────────────────────────────────────────
    this.#weapon?.update(dt);

    // ── 10. Update visual effects ──────────────────────────────────────────────
    this.#effects?.update(dt);
  }

  // ── Typed event emitter ──────────────────────────────────────────────────

  on<K extends keyof GameEventMap>(event: K, handler: EventHandler<K>): void {
    if (!this.#handlers.has(event)) {
      this.#handlers.set(event, new Set());
    }
    // Cast is safe: the Set for key K only ever holds EventHandler<K>.
    (this.#handlers.get(event) as Set<EventHandler<K>>).add(handler);
  }

  off<K extends keyof GameEventMap>(event: K, handler: EventHandler<K>): void {
    (this.#handlers.get(event) as Set<EventHandler<K>> | undefined)?.delete(
      handler,
    );
  }

  // ── Protected emit (available to subclasses) ─────────────────────────────

  protected emit<K extends keyof GameEventMap>(
    event: K,
    data?: GameEventMap[K],
  ): void {
    this.#emit(event, data as GameEventMap[K]);
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  #emit<K extends keyof GameEventMap>(event: K, data: GameEventMap[K]): void {
    const set = this.#handlers.get(event);
    if (set === undefined) return;

    for (const handler of set) {
      if (data === undefined) {
        // No-payload event: handler is () => void.
        (handler as () => void)();
      } else {
        // Payload event: pass data through.
        (handler as (d: GameEventMap[K]) => void)(data);
      }
    }
  }

  // ── Accessors (for subclasses / tests) ────────────────────────────────────

  protected get scene(): SceneContext | null {
    return this.#scene;
  }

  protected get config(): GameConfig | null {
    return this.#config;
  }

  protected get camera(): CameraController | null {
    return this.#camera;
  }

  protected get input(): InputCapture | null {
    return this.#input;
  }

  protected get connection(): GameConnection | null {
    return this.#connection;
  }

  protected get stateManager(): StateManager {
    return this.#stateManager;
  }
}

// Re-export types consumed by React integration code.
export type { GameConfig, MatchResultEvent, GameErrorEvent, GameEventMap };
