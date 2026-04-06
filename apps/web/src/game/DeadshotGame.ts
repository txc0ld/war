// apps/web/src/game/DeadshotGame.ts
// Skeleton orchestrator for the Deadshot PlayCanvas sniper duel.
// React mounts the canvas and calls init(); the rest of the game layer is
// imperative — React never reaches inside the PlayCanvas scene.

import { createScene, destroyScene } from './scene.js';
import type { SceneContext } from './scene.js';
import type { GameConfig, GameEventMap, MatchResultEvent, GameErrorEvent } from './types.js';
import { CameraController } from './camera.js';
import { InputCapture } from './input.js';
import { GameConnection } from './connection.js';
import type { ConnectionHandlers } from './connection.js';
import { StateManager } from './stateManager.js';

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

    // ── Input capture ────────────────────────────────────────────────────────
    this.#input = new InputCapture(canvas);
    this.#input.attach();

    // ── WebSocket connection ──────────────────────────────────────────────────
    const connectionHandlers: ConnectionHandlers = {
      onAuth: (_msg) => {
        // Full game-loop wiring will be added in a subsequent task.
      },
      onAuthError: (_msg) => {
        this.#emit('error', { reason: _msg.reason });
      },
      onWaiting: (_msg) => {
        // No action needed at this layer yet.
      },
      onCountdown: (_msg) => {
        // Round countdown handling will be wired in a subsequent task.
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

    // Emit 'connected' after scene setup succeeds.
    this.#emit('connected', undefined);
  }

  /**
   * Tear down the PlayCanvas Application and remove all event handlers.
   */
  destroy(): void {
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

    if (this.#scene !== null) {
      destroyScene(this.#scene);
      this.#scene = null;
    }
    this.#config = null;
    this.#handlers.clear();
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
