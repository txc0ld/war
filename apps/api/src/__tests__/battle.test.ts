import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  BATTLE_ENGINE_VERSION,
  createBattleCommitmentHash,
  createBattleSeed,
  getStatsForToken,
  resolveBattle,
} from '@warpath/shared';

const LEFT_ADDRESS = '0x0000000000000000000000000000000000000011';
const RIGHT_ADDRESS = '0x0000000000000000000000000000000000000012';

const battleStore = {
  row: null as
    | {
        id: string;
        status: 'committed' | 'resolved' | 'failed' | 'resolving';
        engineVersion: string;
        commitHash: `0x${string}` | null;
        commitPreimageJson: Record<string, unknown> | null;
        drandRound: number | null;
        drandRandomness: string | null;
        drandSignature: string | null;
        battleSeed: `0x${string}` | null;
        leftAddress: string;
        leftToken: number;
        rightAddress: string;
        rightToken: number;
        winner: 'left' | 'right' | null;
        leftHp: number | null;
        rightHp: number | null;
        roundsJson: Array<Record<string, unknown>> | null;
        committedAt: Date;
        resolvedAt: Date | null;
        updatedAt: Date;
        resolutionError: string | null;
      }
    | null,
};
const mockGetBattleResultsVisibilityByAddress = vi.fn();

vi.mock('drizzle-orm', () => ({
  eq: () => true,
  and: (...conditions: Array<boolean>) => conditions.every(Boolean),
  lt: () => true,
  or: (...conditions: Array<boolean>) => conditions.some(Boolean),
  sql: (_strings: TemplateStringsArray, ...values: unknown[]) => ({
    __sql: true,
    values,
  }),
}));

vi.mock('../db/schema', () => ({
  battles: {
    id: 'id',
    status: 'status',
    updatedAt: 'updatedAt',
  },
  players: {
    address: 'address',
    gunCount: 'gunCount',
    score: 'score',
    wins: 'wins',
    losses: 'losses',
    updatedAt: 'updatedAt',
  },
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
    update: () => ({
      set: () => ({
        where: () => ({
          returning: async () => [],
        }),
      }),
    }),
    transaction: async (callback: (tx: unknown) => Promise<unknown>) =>
      callback({
        update: () => ({
          set: () => ({
            where: () => ({
              returning: async () => [],
            }),
          }),
        }),
        select: () => ({
          from: () => ({
            where: () => ({
              limit: async () => [],
            }),
          }),
        }),
      }),
  },
}));

vi.mock('../services/guns', () => ({
  getGunMetadataByTokenId: async (tokenId: number) => ({
    tokenId,
    name: tokenId === 11 ? 'Lyra gatekeeper' : tokenId === 12 ? 'Klegon bolt' : `Gun #${tokenId}`,
    image: `https://cdn.warroom.gg/guns/${tokenId}.png`,
    stats: { damage: 10, dodge: 10, speed: 10 },
    traits: [],
    canBattle: true,
  }),
}));

vi.mock('../services/profiles', () => ({
  getBattleResultsVisibilityByAddress: mockGetBattleResultsVisibilityByAddress,
}));

describe('battle service', () => {
  beforeEach(() => {
    battleStore.row = null;
    mockGetBattleResultsVisibilityByAddress.mockReset();
    mockGetBattleResultsVisibilityByAddress.mockResolvedValue(
      new Map<string, boolean>()
    );
  });

  it('returns a battle payload with fighter image urls', async () => {
    const leftStats = getStatsForToken(11);
    const rightStats = getStatsForToken(12);
    const preimage = {
      engineVersion: BATTLE_ENGINE_VERSION,
      leftAddress: LEFT_ADDRESS,
      leftTokenId: 11,
      leftStats,
      leftArsenalBonus: true,
      rightAddress: RIGHT_ADDRESS,
      rightTokenId: 12,
      rightStats,
      rightArsenalBonus: false,
      targetRound: 12345,
    };
    const commitHash = createBattleCommitmentHash(preimage);
    const battleSeed = createBattleSeed(
      commitHash,
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    );
    const result = resolveBattle(leftStats, rightStats, battleSeed, {
      leftArsenalBonus: true,
      rightArsenalBonus: false,
    });

    battleStore.row = {
      id: 'battle-1',
      status: 'resolved',
      engineVersion: BATTLE_ENGINE_VERSION,
      commitHash,
      commitPreimageJson: preimage,
      drandRound: 12345,
      drandRandomness:
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      drandSignature: '0xsignature',
      battleSeed,
      leftAddress: LEFT_ADDRESS,
      leftToken: 11,
      rightAddress: RIGHT_ADDRESS,
      rightToken: 12,
      winner: result.winner,
      leftHp: result.leftHpRemaining,
      rightHp: result.rightHpRemaining,
      roundsJson: result.rounds as unknown as Array<Record<string, unknown>>,
      committedAt: new Date('2026-03-19T00:00:00.000Z'),
      resolvedAt: new Date('2026-03-19T00:00:10.000Z'),
      updatedAt: new Date('2026-03-19T00:00:10.000Z'),
      resolutionError: null,
    };

    const { getBattle, getBattleProof } = await import('../services/battle');
    const battle = await getBattle('battle-1');
    const proof = await getBattleProof('battle-1');

    expect(battle).not.toBeNull();
    expect(battle?.status).toBe('resolved');
    expect(battle?.left.name).toBe('Lyra gatekeeper');
    expect(battle?.right.name).toBe('Klegon bolt');
    expect(battle?.left.imageUrl).toBe('https://cdn.warroom.gg/guns/11.png');
    expect(battle?.right.imageUrl).toBe('https://cdn.warroom.gg/guns/12.png');
    expect(battle?.result?.winner).toBe(result.winner);
    expect(proof?.commitHash).toBe(commitHash);
    expect(proof?.battleSeed).toBe(battleSeed);
  });

  it('returns null when the battle is missing', async () => {
    const { getBattle } = await import('../services/battle');

    await expect(getBattle('missing-battle')).resolves.toBeNull();
  });

  it('does not return a public battle payload when battle results are hidden', async () => {
    const leftStats = getStatsForToken(11);
    const rightStats = getStatsForToken(12);
    const preimage = {
      engineVersion: BATTLE_ENGINE_VERSION,
      leftAddress: LEFT_ADDRESS,
      leftTokenId: 11,
      leftStats,
      leftArsenalBonus: false,
      rightAddress: RIGHT_ADDRESS,
      rightTokenId: 12,
      rightStats,
      rightArsenalBonus: false,
      targetRound: 12345,
    };
    const commitHash = createBattleCommitmentHash(preimage);
    const battleSeed = createBattleSeed(
      commitHash,
      'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
    );
    const result = resolveBattle(leftStats, rightStats, battleSeed);

    battleStore.row = {
      id: 'battle-private',
      status: 'resolved',
      engineVersion: BATTLE_ENGINE_VERSION,
      commitHash,
      commitPreimageJson: preimage,
      drandRound: 12345,
      drandRandomness:
        'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      drandSignature: '0xsignature',
      battleSeed,
      leftAddress: LEFT_ADDRESS,
      leftToken: 11,
      rightAddress: RIGHT_ADDRESS,
      rightToken: 12,
      winner: result.winner,
      leftHp: result.leftHpRemaining,
      rightHp: result.rightHpRemaining,
      roundsJson: result.rounds as unknown as Array<Record<string, unknown>>,
      committedAt: new Date('2026-03-19T00:00:00.000Z'),
      resolvedAt: new Date('2026-03-19T00:00:10.000Z'),
      updatedAt: new Date('2026-03-19T00:00:10.000Z'),
      resolutionError: null,
    };
    mockGetBattleResultsVisibilityByAddress.mockResolvedValue(
      new Map([
        [LEFT_ADDRESS, false],
        [RIGHT_ADDRESS, true],
      ])
    );

    const { getBattle, getBattleProof, getBattleReplay } = await import('../services/battle');

    await expect(getBattle('battle-private')).resolves.toBeNull();
    await expect(getBattleProof('battle-private')).resolves.toBeNull();
    await expect(getBattleReplay('battle-private')).rejects.toMatchObject({
      statusCode: 404,
      code: 'BATTLE_NOT_FOUND',
    });
  });
});
