// apps/web/src/game/input.ts
// Input capture system for the Deadshot FPS game.
//
// Pure functions (InputState, createInputState, applyMouseDelta, buildClientInput)
// are exported separately so they can be unit-tested in a jsdom environment
// without requiring a real canvas or pointer-lock API.
//
// The InputCapture class is browser-dependent and handles pointer lock,
// mouse events, and keyboard state.

import type { ClientInput } from '@warpath/shared';

// ── Constants ────────────────────────────────────────────────────────────────

const MOUSE_SENSITIVITY = 0.002;
const PITCH_MIN = -89;
const PITCH_MAX = 89;

// ── Pure state ───────────────────────────────────────────────────────────────

export interface InputState {
  aimYaw: number;
  aimPitch: number;
  fire: boolean;
  scope: boolean;
  scopeZoom: 1 | 2;
  crouch: boolean;
  reload: boolean;
}

export function createInputState(): InputState {
  return {
    aimYaw: 0,
    aimPitch: 0,
    fire: false,
    scope: false,
    scopeZoom: 1,
    crouch: false,
    reload: false,
  };
}

/**
 * Accumulate mouse movement into state.
 * Standard FPS convention: negative dy (mouse up) increases pitch (look up).
 */
export function applyMouseDelta(
  state: InputState,
  dx: number,
  dy: number,
  sensitivity: number,
): void {
  state.aimYaw += dx * sensitivity;
  // Negate dy so that moving mouse up (negative dy) increases pitch (look up)
  state.aimPitch -= dy * sensitivity;
  state.aimPitch = Math.max(PITCH_MIN, Math.min(PITCH_MAX, state.aimPitch));
}

/**
 * Snapshot the current state into a ClientInput frame.
 * One-shot flags (fire, reload) are reset to false after the snapshot is taken
 * so they are not re-sent on the next tick.
 */
export function buildClientInput(state: InputState): ClientInput {
  const input: ClientInput = {
    aimYaw: state.aimYaw,
    aimPitch: state.aimPitch,
    fire: state.fire,
    scope: state.scope,
    scopeZoom: state.scopeZoom,
    crouch: state.crouch,
    reload: state.reload,
    timestamp: Date.now(),
  };

  // Reset one-shot flags
  state.fire = false;
  state.reload = false;

  return input;
}

// ── Browser-dependent class ──────────────────────────────────────────────────

export class InputCapture {
  private readonly canvas: HTMLCanvasElement;
  private state: InputState = createInputState();
  private locked: boolean = false;

  // Bound listener references so we can remove them exactly later
  private readonly onCanvasClick: () => void;
  private readonly onPointerLockChange: () => void;
  private readonly onMouseMove: (e: MouseEvent) => void;
  private readonly onMouseDown: (e: MouseEvent) => void;
  private readonly onKeyDown: (e: KeyboardEvent) => void;
  private readonly onKeyUp: (e: KeyboardEvent) => void;
  private readonly onContextMenu: (e: Event) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    this.onCanvasClick = () => {
      if (!this.locked) {
        this.canvas.requestPointerLock();
      }
    };

    this.onPointerLockChange = () => {
      this.locked = document.pointerLockElement === this.canvas;
      // If we just released pointer lock while scoped, descope cleanly
      if (!this.locked && this.state.scope) {
        this.state.scope = false;
        this.state.scopeZoom = 1;
      }
    };

    this.onMouseMove = (e: MouseEvent) => {
      if (!this.locked) return;
      applyMouseDelta(this.state, e.movementX, e.movementY, MOUSE_SENSITIVITY);
    };

    this.onMouseDown = (e: MouseEvent) => {
      if (!this.locked) return;
      if (e.button === 0) {
        // Left click → fire
        this.state.fire = true;
      } else if (e.button === 2) {
        // Right click → toggle scope; descoping resets zoom to 1
        if (this.state.scope) {
          this.state.scope = false;
          this.state.scopeZoom = 1;
        } else {
          this.state.scope = true;
        }
      }
    };

    this.onKeyDown = (e: KeyboardEvent) => {
      if (!this.locked) return;
      switch (e.code) {
        case 'KeyC':
          this.state.crouch = !this.state.crouch;
          break;
        case 'KeyR':
          this.state.reload = true;
          break;
        case 'Digit1':
          if (this.state.scope) this.state.scopeZoom = 1;
          break;
        case 'Digit2':
          if (this.state.scope) this.state.scopeZoom = 2;
          break;
        default:
          break;
      }
    };

    this.onKeyUp = (_e: KeyboardEvent) => {
      // Reserved for future use (e.g. hold-to-crouch)
    };

    this.onContextMenu = (e: Event) => {
      e.preventDefault();
    };
  }

  attach(): void {
    this.canvas.addEventListener('click', this.onCanvasClick);
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mousedown', this.onMouseDown);
    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('keyup', this.onKeyUp);
    this.canvas.addEventListener('contextmenu', this.onContextMenu);
  }

  detach(): void {
    this.canvas.removeEventListener('click', this.onCanvasClick);
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mousedown', this.onMouseDown);
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('keyup', this.onKeyUp);
    this.canvas.removeEventListener('contextmenu', this.onContextMenu);

    if (document.pointerLockElement === this.canvas) {
      document.exitPointerLock();
    }
    this.locked = false;
  }

  getState(): InputState {
    return this.state;
  }

  setInitialAim(yaw: number, pitch: number): void {
    this.state.aimYaw = yaw;
    this.state.aimPitch = Math.max(PITCH_MIN, Math.min(PITCH_MAX, pitch));
  }
}
