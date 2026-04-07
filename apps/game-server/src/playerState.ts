import { S2_MATCH_CONFIG } from '@warpath/shared';
import type { ClientInput, PlayerState } from '@warpath/shared';

const TICK_DT_S = 1 / S2_MATCH_CONFIG.TICK_RATE;

export class MutablePlayerState {
  aimYaw = 0;
  aimPitch = 0;
  stance: 'standing' | 'crouched' = 'standing';
  scoped = false;
  scopeZoom: 1 | 2 = 1;
  hp: number = S2_MATCH_CONFIG.PLAYER_HP;
  ammo: number = S2_MATCH_CONFIG.MAGAZINE_SIZE;
  reloading = false;
  alive = true;

  // ── World position ──
  x = 0;
  y = 0;
  z = 0;

  private lastFireMs = -Infinity;
  private reloadStartMs = -Infinity;

  /**
   * Apply per-tick input. Movement is integrated using the configured tick
   * rate so the speed is frame-rate independent on the server, where ticks
   * are fixed at S2_MATCH_CONFIG.TICK_RATE.
   *
   * Movement is in player-local space rotated by the player's facingYaw +
   * aimYaw — i.e. W moves "forward" relative to where you're looking.
   */
  applyInput(input: ClientInput, _nowMs: number, facingYaw: number): void {
    this.aimYaw = input.aimYaw;
    this.aimPitch = input.aimPitch;
    this.stance = input.crouch ? 'crouched' : 'standing';
    this.scoped = input.scope;
    this.scopeZoom = input.scopeZoom;

    if (!this.alive) return;

    // ── WASD intent → world-space velocity ──
    let forward = 0;
    let strafe = 0;
    if (input.moveForward) forward += 1;
    if (input.moveBackward) forward -= 1;
    if (input.moveRight) strafe += 1;
    if (input.moveLeft) strafe -= 1;

    if (forward === 0 && strafe === 0) return;

    // Pick base speed by stance + scope state
    let speed: number = this.stance === 'crouched'
      ? S2_MATCH_CONFIG.CROUCH_MOVE_SPEED
      : S2_MATCH_CONFIG.MOVE_SPEED;
    if (this.scoped) speed = S2_MATCH_CONFIG.SCOPED_MOVE_SPEED;

    // Normalize diagonal so a player isn't faster going NE than N
    const len = Math.hypot(forward, strafe);
    forward /= len;
    strafe /= len;

    // Rotate intent into world space using facingYaw + aimYaw.
    //
    // Derived from PlayCanvas's actual entity.forward / entity.right at a
    // given Y rotation:
    //   forward(yaw) = (-sin(yaw), 0, -cos(yaw))   ← camera looks -Z at yaw=0
    //   right(yaw)   = ( cos(yaw), 0, -sin(yaw))   ← player's right is +X at yaw=0
    //
    //   worldDx = forward * forward.x + strafe * right.x
    //           = -forward * sin(yaw) + strafe * cos(yaw)
    //   worldDz = forward * forward.z + strafe * right.z
    //           = -forward * cos(yaw) - strafe * sin(yaw)
    //
    // facingYaw is supplied in radians from positions.ts. aimYaw arrives
    // from the client in DEGREES (because the client hands it directly to
    // setLocalEulerAngles, which takes degrees). Convert aimYaw to radians
    // before adding so the trig functions get a consistent unit.
    const totalYaw = facingYaw + this.aimYaw * (Math.PI / 180);
    const sin = Math.sin(totalYaw);
    const cos = Math.cos(totalYaw);

    const worldDx = -forward * sin + strafe * cos;
    const worldDz = -forward * cos - strafe * sin;

    const distance = speed * TICK_DT_S;
    let nextX = this.x + worldDx * distance;
    let nextZ = this.z + worldDz * distance;

    // Soft arena bounds — clamp to the playable rectangle
    nextX = Math.max(
      -S2_MATCH_CONFIG.ARENA_HALF_WIDTH,
      Math.min(S2_MATCH_CONFIG.ARENA_HALF_WIDTH, nextX)
    );
    nextZ = Math.max(
      S2_MATCH_CONFIG.ARENA_MIN_Z,
      Math.min(S2_MATCH_CONFIG.ARENA_MAX_Z, nextZ)
    );

    this.x = nextX;
    this.z = nextZ;
  }

  canFire(nowMs: number): boolean {
    return (
      this.alive &&
      !this.reloading &&
      this.ammo > 0 &&
      nowMs - this.lastFireMs >= S2_MATCH_CONFIG.BOLT_CYCLE_MS
    );
  }

  fire(nowMs: number): void {
    this.ammo--;
    this.lastFireMs = nowMs;
  }

  startReload(nowMs: number): void {
    if (this.ammo >= S2_MATCH_CONFIG.MAGAZINE_SIZE) return;
    this.reloading = true;
    this.reloadStartMs = nowMs;
  }

  updateReload(nowMs: number): void {
    if (this.reloading && nowMs - this.reloadStartMs >= S2_MATCH_CONFIG.RELOAD_DURATION_MS) {
      this.reloading = false;
      this.ammo = S2_MATCH_CONFIG.MAGAZINE_SIZE;
    }
  }

  takeDamage(amount: number): void {
    this.hp = Math.max(0, this.hp - amount);
    if (this.hp <= 0) this.alive = false;
  }

  /** Set the player's spawn position at round start. */
  setPosition(x: number, y: number, z: number): void {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  snapshot(): PlayerState {
    return {
      aimYaw: this.aimYaw,
      aimPitch: this.aimPitch,
      stance: this.stance,
      scoped: this.scoped,
      hp: this.hp,
      ammo: this.ammo,
      reloading: this.reloading,
      alive: this.alive,
      x: this.x,
      y: this.y,
      z: this.z,
    };
  }

  reset(): void {
    this.hp = S2_MATCH_CONFIG.PLAYER_HP;
    this.ammo = S2_MATCH_CONFIG.MAGAZINE_SIZE;
    this.reloading = false;
    this.alive = true;
    this.lastFireMs = -Infinity;
    this.reloadStartMs = -Infinity;
    this.aimYaw = 0;
    this.aimPitch = 0;
    this.stance = 'standing';
    this.scoped = false;
    this.scopeZoom = 1;
    this.x = 0;
    this.y = 0;
    this.z = 0;
  }
}
