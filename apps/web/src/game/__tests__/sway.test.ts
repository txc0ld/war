import { describe, it, expect } from 'vitest';
import { computeSway, SWAY_CONFIG } from '../camera.js';

describe('computeSway', () => {
  it('returns zero sway when not scoped', () => {
    const result = computeSway(1.0, false, 'standing', 1);
    expect(result.yawOffset).toBe(0);
    expect(result.pitchOffset).toBe(0);
  });

  it('returns non-zero sway when scoped and time > 0', () => {
    const result = computeSway(1.0, true, 'standing', 1);
    expect(result.yawOffset).not.toBe(0);
    expect(result.pitchOffset).not.toBe(0);
  });

  it('crouched sway amplitude is smaller than standing', () => {
    const standing = computeSway(1.5, true, 'standing', 1);
    const crouched = computeSway(1.5, true, 'crouched', 1);
    expect(Math.abs(crouched.yawOffset)).toBeLessThan(Math.abs(standing.yawOffset));
    expect(Math.abs(crouched.pitchOffset)).toBeLessThan(Math.abs(standing.pitchOffset));
  });

  it('higher zoom produces larger sway', () => {
    // Use a time where sin values are not zero
    const zoom1 = computeSway(0.75, true, 'standing', 1);
    const zoom2 = computeSway(0.75, true, 'standing', 2);
    expect(Math.abs(zoom2.yawOffset)).toBeGreaterThan(Math.abs(zoom1.yawOffset));
  });

  it('sway is zero at time zero', () => {
    const result = computeSway(0, true, 'standing', 1);
    expect(result.yawOffset).toBe(0);
    expect(result.pitchOffset).toBe(0);
  });

  it('sway amplitude stays within configured maximum', () => {
    const maxAmp = SWAY_CONFIG.BASE_AMPLITUDE * SWAY_CONFIG.ZOOM_MULTIPLIER_2X;
    for (let t = 0; t < 20; t += 0.1) {
      const result = computeSway(t, true, 'standing', 2);
      expect(Math.abs(result.yawOffset)).toBeLessThanOrEqual(maxAmp + 0.001);
      expect(Math.abs(result.pitchOffset)).toBeLessThanOrEqual(maxAmp + 0.001);
    }
  });
});
