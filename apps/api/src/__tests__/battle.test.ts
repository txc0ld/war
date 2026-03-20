import { beforeEach, describe, expect, it, vi } from 'vitest';

const battleStore = {
  row: null as
    | {
        id: string;
        leftAddress: string;
        leftToken: number;
        rightAddress: string;
        rightToken: number;
        winner: 'left' | 'right';
        leftHp: number;
        rightHp: number;
        roundsJson: Array<Record<string, unknown>>;
        resolvedAt: Date;
      }
    | null,
};

vi.mock('drizzle-orm', () => ({
  eq: () => true,
}));

vi.mock('../db/schema', () => ({
  battles: { id: 'id' },
}));

vi.mock('../db/client', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => (battleStore.row ? [battleStore.row] : []),
        }),
      }),
    }),
  },
}));

vi.mock('../services/guns', () => ({
  getGunMetadataByTokenId: async (tokenId: number) => ({
    tokenId,
    name: `Gun #${tokenId}`,
    image: `https://cdn.warroom.gg/guns/${tokenId}.png`,
    stats: { damage: 10, dodge: 10, speed: 10 },
    traits: [],
    canBattle: true,
  }),
}));

describe('battle service', () => {
  beforeEach(() => {
    battleStore.row = null;
  });

  it('returns a battle payload with fighter image urls', async () => {
    battleStore.row = {
      id: 'battle-1',
      leftAddress: '0xleft',
      leftToken: 11,
      rightAddress: '0xright',
      rightToken: 12,
      winner: 'left',
      leftHp: 14,
      rightHp: 0,
      roundsJson: [{ tick: 0, leftHp: 100, rightHp: 80, event: 'hit_right' }],
      resolvedAt: new Date('2026-03-19T00:00:00.000Z'),
    };

    const { getBattle } = await import('../services/battle');
    const battle = await getBattle('battle-1');

    expect(battle).not.toBeNull();
    expect(battle?.left.imageUrl).toBe('https://cdn.warroom.gg/guns/11.png');
    expect(battle?.right.imageUrl).toBe('https://cdn.warroom.gg/guns/12.png');
    expect(battle?.result.winner).toBe('left');
  });

  it('returns null when the battle is missing', async () => {
    const { getBattle } = await import('../services/battle');

    await expect(getBattle('missing-battle')).resolves.toBeNull();
  });
});
