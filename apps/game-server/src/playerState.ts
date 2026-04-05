import { S2_MATCH_CONFIG } from '@warpath/shared';
import type { ClientInput, PlayerState } from '@warpath/shared';

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

  private lastFireMs = -Infinity;
  private reloadStartMs = -Infinity;

  applyInput(input: ClientInput, _nowMs: number): void {
    this.aimYaw = input.aimYaw;
    this.aimPitch = input.aimPitch;
    this.stance = input.crouch ? 'crouched' : 'standing';
    this.scoped = input.scope;
    this.scopeZoom = input.scopeZoom;
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
  }
}
