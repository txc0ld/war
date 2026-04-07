// apps/web/src/game/camera.ts
// FPS camera controller for the Deadshot sniper duel.
// Manages yaw/pitch orientation, stance-based eye height, and FOV zoom.

import * as pc from 'playcanvas';
import { HITBOX } from '@warpath/shared';

const BASE_FOV = 60;
const SCOPED_1X_FOV = 24; // 2.5x zoom
const SCOPED_2X_FOV = 10; // 6x zoom
const FOV_LERP_SPEED = 12;
const PITCH_MIN = -89;
const PITCH_MAX = 89;

// ── Scope sway ──────────────────────────────────────────────────────────────
export const SWAY_CONFIG = {
  BASE_AMPLITUDE: 0.004,      // radians (~0.23°)
  YAW_FREQUENCY: 0.7,         // Hz
  PITCH_FREQUENCY: 1.1,       // Hz (different from yaw for figure-8)
  CROUCHED_MULTIPLIER: 0.35,  // crouching reduces sway significantly
  ZOOM_MULTIPLIER_1X: 1.0,
  ZOOM_MULTIPLIER_2X: 1.6,    // more sway at higher magnification
} as const;

export interface SwayResult {
  yawOffset: number;
  pitchOffset: number;
}

export function computeSway(
  elapsed: number,
  scoped: boolean,
  stance: 'standing' | 'crouched',
  zoomLevel: 1 | 2,
): SwayResult {
  if (!scoped || elapsed === 0) {
    return { yawOffset: 0, pitchOffset: 0 };
  }

  const stanceMul = stance === 'crouched' ? SWAY_CONFIG.CROUCHED_MULTIPLIER : 1;
  const zoomMul = zoomLevel === 2 ? SWAY_CONFIG.ZOOM_MULTIPLIER_2X : SWAY_CONFIG.ZOOM_MULTIPLIER_1X;
  const amp = SWAY_CONFIG.BASE_AMPLITUDE * stanceMul * zoomMul;

  return {
    yawOffset: amp * Math.sin(elapsed * SWAY_CONFIG.YAW_FREQUENCY * Math.PI * 2),
    pitchOffset: amp * Math.sin(elapsed * SWAY_CONFIG.PITCH_FREQUENCY * Math.PI * 2),
  };
}

export class CameraController {
  readonly entity: pc.Entity;

  private yaw: number = 0;
  private pitch: number = 0;
  private targetFov: number = BASE_FOV;
  readonly baseFov: number = BASE_FOV;

  private swayElapsed: number = 0;
  private swayActive: boolean = false;
  private swayStance: 'standing' | 'crouched' = 'standing';
  private swayZoom: 1 | 2 = 1;

  constructor(entity: pc.Entity) {
    this.entity = entity;
  }

  /**
   * Set the camera's aim direction.
   * Pitch is clamped to ±89 degrees to prevent gimbal lock at the poles.
   *
   * In our convention positive `pitch` means "looking up". PlayCanvas's
   * positive X-axis rotation tilts the camera downward, so we negate the
   * pitch value when applying it to the entity transform.
   */
  setAim(yaw: number, pitch: number): void {
    this.yaw = yaw;
    this.pitch = pc.math.clamp(pitch, PITCH_MIN, PITCH_MAX);
    this.entity.setLocalEulerAngles(-this.pitch, this.yaw, 0);
  }

  getAim(): { yaw: number; pitch: number } {
    return { yaw: this.yaw, pitch: this.pitch };
  }

  setPosition(x: number, y: number, z: number): void {
    this.entity.setPosition(x, y, z);
  }

  /**
   * Move the camera eye to the correct Y height for the given stance.
   * X and Z are preserved.
   */
  setStance(stance: 'standing' | 'crouched'): void {
    const pos = this.entity.getPosition();
    const eyeY =
      stance === 'crouched' ? HITBOX.CROUCHED_EYE_Y : HITBOX.STANDING_EYE_Y;
    this.entity.setPosition(pos.x, eyeY, pos.z);
  }

  enableSway(stance: 'standing' | 'crouched', zoomLevel: 1 | 2): void {
    if (!this.swayActive) {
      this.swayElapsed = 0;
    }
    this.swayActive = true;
    this.swayStance = stance;
    this.swayZoom = zoomLevel;
  }

  disableSway(): void {
    this.swayActive = false;
    this.swayElapsed = 0;
  }

  /**
   * Set the zoom level.
   * 0 = no scope (60°), 1 = 2.5× (24°), 2 = 6× (10°).
   */
  setZoom(level: 0 | 1 | 2): void {
    if (level === 0) {
      this.targetFov = BASE_FOV;
    } else if (level === 1) {
      this.targetFov = SCOPED_1X_FOV;
    } else {
      this.targetFov = SCOPED_2X_FOV;
    }
  }

  /**
   * Called once per application tick. Smoothly lerps the camera component's
   * FOV toward targetFov at a fixed angular speed.
   */
  update(dt: number): void {
    const cam = this.entity.camera;
    if (cam === null || cam === undefined) return;

    // FOV lerp
    const currentFov: number = cam.fov;
    if (Math.abs(currentFov - this.targetFov) < 0.01) {
      cam.fov = this.targetFov;
    } else {
      cam.fov = pc.math.lerp(currentFov, this.targetFov, FOV_LERP_SPEED * dt);
    }

    // Scope sway
    if (this.swayActive) {
      this.swayElapsed += dt;
      const sway = computeSway(this.swayElapsed, true, this.swayStance, this.swayZoom);
      const swayYawDeg = sway.yawOffset * (180 / Math.PI);
      const swayPitchDeg = sway.pitchOffset * (180 / Math.PI);
      // Negate pitch to match setAim's convention.
      const pitchWithSway = pc.math.clamp(this.pitch + swayPitchDeg, PITCH_MIN, PITCH_MAX);
      this.entity.setLocalEulerAngles(
        -pitchWithSway,
        this.yaw + swayYawDeg,
        0,
      );
    }
  }
}
