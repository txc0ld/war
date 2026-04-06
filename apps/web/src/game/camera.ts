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

export class CameraController {
  readonly entity: pc.Entity;

  private yaw: number = 0;
  private pitch: number = 0;
  private targetFov: number = BASE_FOV;
  readonly baseFov: number = BASE_FOV;

  constructor(entity: pc.Entity) {
    this.entity = entity;
  }

  /**
   * Set the camera's aim direction.
   * Pitch is clamped to ±89 degrees to prevent gimbal lock at the poles.
   */
  setAim(yaw: number, pitch: number): void {
    this.yaw = yaw;
    this.pitch = pc.math.clamp(pitch, PITCH_MIN, PITCH_MAX);
    this.entity.setLocalEulerAngles(this.pitch, this.yaw, 0);
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

    const currentFov: number = cam.fov;
    if (Math.abs(currentFov - this.targetFov) < 0.01) {
      cam.fov = this.targetFov;
      return;
    }

    cam.fov = pc.math.lerp(currentFov, this.targetFov, FOV_LERP_SPEED * dt);
  }
}
