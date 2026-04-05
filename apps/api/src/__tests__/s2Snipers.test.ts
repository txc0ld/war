import { describe, expect, it, vi } from 'vitest';

vi.mock('../db/client', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    onConflictDoUpdate: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../lib/contract', () => ({
  publicClient: {
    readContract: vi.fn(),
  },
}));

import { parseSniperMetadata } from '../services/s2Snipers';

describe('parseSniperMetadata', () => {
  it('extracts cosmetic attributes from NFT metadata JSON', () => {
    const raw = {
      name: 'Arctic Hunter',
      image: 'ipfs://Qm.../arctic.png',
      attributes: [
        { trait_type: 'skin', value: 'Arctic Camo' },
        { trait_type: 'scope_reticle', value: 'Mil-dot' },
        { trait_type: 'kill_effect', value: 'Ember Burst' },
        { trait_type: 'tracer_color', value: '#FF4444' },
        { trait_type: 'inspect_animation', value: 'Spin' },
      ],
    };

    const result = parseSniperMetadata(42, raw);

    expect(result).toEqual({
      tokenId: 42,
      name: 'Arctic Hunter',
      image: 'https://ipfs.io/ipfs/Qm.../arctic.png',
      skin: 'Arctic Camo',
      scopeReticle: 'Mil-dot',
      killEffect: 'Ember Burst',
      tracerColor: '#FF4444',
      inspectAnimation: 'Spin',
    });
  });

  it('uses defaults for missing attributes', () => {
    const raw = {
      name: 'Basic Sniper',
      image: 'https://example.com/sniper.png',
      attributes: [],
    };

    const result = parseSniperMetadata(1, raw);

    expect(result.skin).toBe('default');
    expect(result.scopeReticle).toBe('crosshair');
    expect(result.killEffect).toBe('default');
    expect(result.tracerColor).toBe('#FFFFFF');
    expect(result.inspectAnimation).toBe('default');
  });
});
