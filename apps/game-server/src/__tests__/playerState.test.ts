import { describe, expect, it } from 'vitest';
import { MutablePlayerState } from '../playerState';
import { S2_MATCH_CONFIG } from '@warpath/shared';
import type { ClientInput } from '@warpath/shared';

const defaultInput: ClientInput = {
  aimYaw: 0, aimPitch: 0, fire: false, scope: false,
  scopeZoom: 1, crouch: false, reload: false,
  moveForward: false, moveBackward: false, moveLeft: false, moveRight: false,
  timestamp: 0,
};

describe('MutablePlayerState', () => {
  it('initializes with full HP and ammo', () => {
    const player = new MutablePlayerState();
    const snap = player.snapshot();
    expect(snap.hp).toBe(S2_MATCH_CONFIG.PLAYER_HP);
    expect(snap.ammo).toBe(S2_MATCH_CONFIG.MAGAZINE_SIZE);
    expect(snap.alive).toBe(true);
    expect(snap.stance).toBe('standing');
    expect(snap.reloading).toBe(false);
  });

  it('applies aim and stance from input', () => {
    const player = new MutablePlayerState();
    player.applyInput({ ...defaultInput, aimYaw: 0.5, aimPitch: -0.2, crouch: true }, 100, 0);
    const snap = player.snapshot();
    expect(snap.aimYaw).toBe(0.5);
    expect(snap.aimPitch).toBe(-0.2);
    expect(snap.stance).toBe('crouched');
  });

  it('can fire when ammo available and bolt cycle elapsed', () => {
    const player = new MutablePlayerState();
    expect(player.canFire(0)).toBe(true);
    player.fire(0);
    expect(player.snapshot().ammo).toBe(S2_MATCH_CONFIG.MAGAZINE_SIZE - 1);
    expect(player.canFire(100)).toBe(false);
    expect(player.canFire(S2_MATCH_CONFIG.BOLT_CYCLE_MS)).toBe(true);
  });

  it('cannot fire with zero ammo', () => {
    const player = new MutablePlayerState();
    for (let i = 0; i < S2_MATCH_CONFIG.MAGAZINE_SIZE; i++) {
      player.fire(i * S2_MATCH_CONFIG.BOLT_CYCLE_MS);
    }
    expect(player.snapshot().ammo).toBe(0);
    expect(player.canFire(100_000)).toBe(false);
  });

  it('reloads ammo after reload duration', () => {
    const player = new MutablePlayerState();
    player.fire(0);
    expect(player.snapshot().ammo).toBe(S2_MATCH_CONFIG.MAGAZINE_SIZE - 1);
    player.startReload(100);
    expect(player.snapshot().reloading).toBe(true);
    expect(player.canFire(100)).toBe(false);
    player.updateReload(100 + S2_MATCH_CONFIG.RELOAD_DURATION_MS - 1);
    expect(player.snapshot().reloading).toBe(true);
    player.updateReload(100 + S2_MATCH_CONFIG.RELOAD_DURATION_MS);
    expect(player.snapshot().reloading).toBe(false);
    expect(player.snapshot().ammo).toBe(S2_MATCH_CONFIG.MAGAZINE_SIZE);
  });

  it('takes damage and dies at zero HP', () => {
    const player = new MutablePlayerState();
    player.takeDamage(55);
    expect(player.snapshot().hp).toBe(45);
    expect(player.snapshot().alive).toBe(true);
    player.takeDamage(55);
    expect(player.snapshot().hp).toBe(0);
    expect(player.snapshot().alive).toBe(false);
  });

  it('resets all state for a new round', () => {
    const player = new MutablePlayerState();
    player.takeDamage(50);
    player.fire(0);
    player.applyInput({ ...defaultInput, crouch: true }, 100, 0);
    player.reset();
    const snap = player.snapshot();
    expect(snap.hp).toBe(S2_MATCH_CONFIG.PLAYER_HP);
    expect(snap.ammo).toBe(S2_MATCH_CONFIG.MAGAZINE_SIZE);
    expect(snap.alive).toBe(true);
    expect(snap.stance).toBe('standing');
    expect(snap.reloading).toBe(false);
  });

  it('does not start reload when magazine is full', () => {
    const player = new MutablePlayerState();
    player.startReload(0);
    expect(player.snapshot().reloading).toBe(false);
  });
});
