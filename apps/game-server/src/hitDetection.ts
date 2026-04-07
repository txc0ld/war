import { HITBOX, S2_MATCH_CONFIG } from '@warpath/shared';
import type { Vec3, HitResult } from '@warpath/shared';

// facingYaw is supplied in RADIANS (from positions.ts).
// aimYaw / aimPitch arrive from the client in DEGREES (because the client
// hands them straight to PlayCanvas's setLocalEulerAngles, which takes
// degrees). Convert before doing any trig so the units match.
export function aimToDirection(facingYaw: number, aimYaw: number, aimPitch: number): Vec3 {
  const totalYaw = facingYaw + aimYaw * (Math.PI / 180);
  const pitchRad = aimPitch * (Math.PI / 180);
  return {
    x: Math.sin(totalYaw) * Math.cos(pitchRad),
    y: Math.sin(pitchRad),
    z: Math.cos(totalYaw) * Math.cos(pitchRad),
  };
}

function raySphereIntersect(origin: Vec3, dir: Vec3, center: Vec3, radius: number): boolean {
  const ocX = origin.x - center.x;
  const ocY = origin.y - center.y;
  const ocZ = origin.z - center.z;
  const a = dir.x * dir.x + dir.y * dir.y + dir.z * dir.z;
  const b = 2 * (ocX * dir.x + ocY * dir.y + ocZ * dir.z);
  const c = ocX * ocX + ocY * ocY + ocZ * ocZ - radius * radius;
  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return false;
  const sqrtD = Math.sqrt(discriminant);
  const t1 = (-b - sqrtD) / (2 * a);
  const t2 = (-b + sqrtD) / (2 * a);
  return t1 > 0 || t2 > 0;
}

function rayAABBIntersect(origin: Vec3, dir: Vec3, min: Vec3, max: Vec3): boolean {
  let tMin = -Infinity;
  let tMax = Infinity;
  for (const axis of ['x', 'y', 'z'] as const) {
    if (Math.abs(dir[axis]) < 1e-8) {
      if (origin[axis] < min[axis] || origin[axis] > max[axis]) return false;
    } else {
      const t1 = (min[axis] - origin[axis]) / dir[axis];
      const t2 = (max[axis] - origin[axis]) / dir[axis];
      const tNear = Math.min(t1, t2);
      const tFar = Math.max(t1, t2);
      tMin = Math.max(tMin, tNear);
      tMax = Math.min(tMax, tFar);
      if (tMin > tMax || tMax < 0) return false;
    }
  }
  return tMin > 0 || tMax > 0;
}

export function checkHit(
  shooterPos: Vec3,
  shooterFacingYaw: number,
  shooterStance: 'standing' | 'crouched',
  aimYaw: number,
  aimPitch: number,
  targetPos: Vec3,
  targetStance: 'standing' | 'crouched',
): HitResult {
  const shooterEyeY =
    shooterStance === 'crouched' ? HITBOX.CROUCHED_EYE_Y : HITBOX.STANDING_EYE_Y;
  const origin: Vec3 = { x: shooterPos.x, y: shooterPos.y + shooterEyeY, z: shooterPos.z };
  const dir = aimToDirection(shooterFacingYaw, aimYaw, aimPitch);

  // Check head (sphere) — headshot priority
  const headCenterY =
    targetStance === 'crouched'
      ? HITBOX.CROUCHED_HEAD_CENTER_Y
      : HITBOX.STANDING_HEAD_CENTER_Y;
  const headRadius =
    targetStance === 'crouched'
      ? HITBOX.CROUCHED_HEAD_RADIUS
      : HITBOX.STANDING_HEAD_RADIUS;
  const headCenter: Vec3 = { x: targetPos.x, y: targetPos.y + headCenterY, z: targetPos.z };

  if (raySphereIntersect(origin, dir, headCenter, headRadius)) {
    return { hit: true, zone: 'head', damage: S2_MATCH_CONFIG.HEADSHOT_DAMAGE };
  }

  // Check body (AABB)
  const bodyTop =
    targetStance === 'crouched' ? HITBOX.CROUCHED_BODY_MAX_Y : HITBOX.STANDING_BODY_MAX_Y;
  const bodyMin: Vec3 = {
    x: targetPos.x - HITBOX.BODY_HALF_WIDTH,
    y: targetPos.y + HITBOX.STANDING_BODY_MIN_Y,
    z: targetPos.z - HITBOX.BODY_HALF_DEPTH,
  };
  const bodyMax: Vec3 = {
    x: targetPos.x + HITBOX.BODY_HALF_WIDTH,
    y: targetPos.y + bodyTop,
    z: targetPos.z + HITBOX.BODY_HALF_DEPTH,
  };

  if (rayAABBIntersect(origin, dir, bodyMin, bodyMax)) {
    return { hit: true, zone: 'body', damage: S2_MATCH_CONFIG.BODY_DAMAGE };
  }

  return { hit: false };
}
