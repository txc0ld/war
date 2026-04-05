import { describe, expect, it } from 'vitest';
import { checkHit, aimToDirection } from '../hitDetection';
import type { Vec3 } from '@warpath/shared';

describe('aimToDirection', () => {
  it('facing +Z with zero aim gives forward vector', () => {
    const dir = aimToDirection(0, 0, 0);
    expect(dir.x).toBeCloseTo(0, 5);
    expect(dir.y).toBeCloseTo(0, 5);
    expect(dir.z).toBeCloseTo(1, 5);
  });

  it('facing +Z with 90° yaw gives +X vector', () => {
    const dir = aimToDirection(0, Math.PI / 2, 0);
    expect(dir.x).toBeCloseTo(1, 5);
    expect(dir.y).toBeCloseTo(0, 5);
    expect(dir.z).toBeCloseTo(0, 5);
  });

  it('facing +Z with positive pitch aims upward', () => {
    const dir = aimToDirection(0, 0, Math.PI / 4);
    expect(dir.y).toBeGreaterThan(0);
    expect(dir.z).toBeGreaterThan(0);
  });
});

describe('checkHit', () => {
  // Player 0 at origin facing +Z, Player 1 at (0, 0, 50) facing -Z
  const shooter: Vec3 = { x: 0, y: 0, z: 0 };
  const target: Vec3 = { x: 0, y: 0, z: 50 };
  const shooterFacing = 0; // facing +Z

  it('headshot when aiming directly at standing head', () => {
    // Both at same height, level aim → ray from eye (1.65) to target eye (1.65) = head hit
    const result = checkHit(shooter, shooterFacing, 'standing', 0, 0, target, 'standing');
    expect(result.hit).toBe(true);
    if (result.hit) expect(result.zone).toBe('head');
  });

  it('body shot when aiming at torso', () => {
    // Aim slightly down to hit body (y~1.0 at 50m)
    const pitch = Math.atan2(1.0 - 1.65, 50);
    const result = checkHit(shooter, shooterFacing, 'standing', 0, pitch, target, 'standing');
    expect(result.hit).toBe(true);
    if (result.hit) expect(result.zone).toBe('body');
  });

  it('miss when aiming completely off target', () => {
    const result = checkHit(shooter, shooterFacing, 'standing', Math.PI / 4, 0, target, 'standing');
    expect(result.hit).toBe(false);
  });

  it('crouched target has lower head position — level aim misses', () => {
    // Standing shooter eye at 1.65, level aim → ray stays at y=1.65
    // Crouched target head center at 1.1, radius 0.13 → top at 1.23
    // 1.65 > 1.23 → miss
    const result = checkHit(shooter, shooterFacing, 'standing', 0, 0, target, 'crouched');
    expect(result.hit).toBe(false);
  });

  it('crouched target can be hit with adjusted aim', () => {
    const pitch = Math.atan2(1.1 - 1.65, 50);
    const result = checkHit(shooter, shooterFacing, 'standing', 0, pitch, target, 'crouched');
    expect(result.hit).toBe(true);
    if (result.hit) expect(result.zone).toBe('head');
  });

  it('crouched shooter has lower eye position', () => {
    // Crouched shooter eye at y=1.1, aim level → ray at 1.1 hits standing body (range 0–1.5)
    const result = checkHit(shooter, shooterFacing, 'crouched', 0, 0, target, 'standing');
    expect(result.hit).toBe(true);
    if (result.hit) expect(result.zone).toBe('body');
  });
});
