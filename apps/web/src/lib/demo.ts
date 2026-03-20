import type { Battle, GunMetadata, LeaderboardEntry } from '@warpath/shared';
import { GUNS_BY_ID } from '@/data/guns';
import { getCountrySide } from '@/data/countries';
import { isWeaponOnCooldown } from './cooldowns';
import { createSecureBattleSeed } from './rng';
import { generateStats, resolveWeightedBattle } from './stats';

export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';
export const DEMO_PLAYER_ADDRESS =
  '0xdecaf00000000000000000000000000000beef' as const;

function createDemoGun(tokenId: number, gunCount = 1): GunMetadata {
  const gun = GUNS_BY_ID.get(tokenId);
  if (!gun) {
    throw new Error(`Unknown demo gun ${tokenId}`);
  }

  return {
    tokenId,
    name: gun.name,
    image: '/guns/placeholder.gif',
    stats: generateStats(tokenId, gun.tier),
    traits: [gun.type, gun.tier.toString(), `${gunCount} GUN HOLDER`],
    canBattle: true,
  };
}

export const DEMO_GUNS: GunMetadata[] = [
  createDemoGun(54, 4),
  createDemoGun(78, 4),
  createDemoGun(62, 4),
  createDemoGun(100, 4),
];

export const DEMO_LEADERBOARD: LeaderboardEntry[] = [
  {
    rank: 1,
    address: '0x8ad0c0000000000000000000000000000000c001',
    score: 2840,
    wins: 42,
    losses: 9,
    gunCount: 3,
  },
  {
    rank: 2,
    address: '0x8ad0c0000000000000000000000000000000c004',
    score: 2715,
    wins: 38,
    losses: 11,
    gunCount: 2,
  },
  {
    rank: 3,
    address: DEMO_PLAYER_ADDRESS,
    score: 2630,
    wins: 35,
    losses: 12,
    gunCount: 4,
  },
  {
    rank: 4,
    address: '0x8ad0c0000000000000000000000000000000c002',
    score: 2510,
    wins: 31,
    losses: 14,
    gunCount: 2,
  },
  {
    rank: 5,
    address: '0x8ad0c0000000000000000000000000000000c003',
    score: 2445,
    wins: 28,
    losses: 16,
    gunCount: 1,
  },
];

const DEMO_OPPONENTS = [
  {
    address: '0x8ad0c0000000000000000000000000000000c001',
    gun: createDemoGun(15, 2),
    gunCount: 2,
  },
  {
    address: '0x8ad0c0000000000000000000000000000000c002',
    gun: createDemoGun(43, 1),
    gunCount: 1,
  },
  {
    address: '0x8ad0c0000000000000000000000000000000c003',
    gun: createDemoGun(75, 2),
    gunCount: 2,
  },
  {
    address: '0x8ad0c0000000000000000000000000000000c004',
    gun: createDemoGun(91, 3),
    gunCount: 3,
  },
];

export function createDemoBattle(
  selectedGun: GunMetadata,
  selectedCountry: string
): Battle {
  const seededIndex =
    selectedCountry
      .split('')
      .reduce((sum, character) => sum + character.charCodeAt(0), 0) %
    DEMO_OPPONENTS.length;
  const availableOpponents = DEMO_OPPONENTS.filter(
    (entry) => !isWeaponOnCooldown(entry.address, entry.gun.tokenId)
  );
  const pool = availableOpponents.length > 0 ? availableOpponents : DEMO_OPPONENTS;
  const opponent = pool[seededIndex % pool.length]!;
  const playerSide = getCountrySide(selectedCountry) ?? 'left';
  const seed = createSecureBattleSeed(
    `demo-${selectedCountry}-${selectedGun.tokenId}-${opponent.gun.tokenId}`
  );

  const result =
    playerSide === 'left'
      ? resolveWeightedBattle(
          selectedGun.stats,
          opponent.gun.stats,
          DEMO_GUNS.length,
          opponent.gunCount,
          seed
        )
      : resolveWeightedBattle(
          opponent.gun.stats,
          selectedGun.stats,
          opponent.gunCount,
          DEMO_GUNS.length,
          seed
        );

  return {
    id: `demo-${selectedCountry.toLowerCase()}-${selectedGun.tokenId}-${opponent.gun.tokenId}`,
    left:
      playerSide === 'left'
        ? {
            address: DEMO_PLAYER_ADDRESS,
            tokenId: selectedGun.tokenId,
            stats: selectedGun.stats,
            imageUrl: selectedGun.image,
          }
        : {
            address: opponent.address,
            tokenId: opponent.gun.tokenId,
            stats: opponent.gun.stats,
            imageUrl: opponent.gun.image,
          },
    right:
      playerSide === 'right'
        ? {
            address: DEMO_PLAYER_ADDRESS,
            tokenId: selectedGun.tokenId,
            stats: selectedGun.stats,
            imageUrl: selectedGun.image,
          }
        : {
            address: opponent.address,
            tokenId: opponent.gun.tokenId,
            stats: opponent.gun.stats,
            imageUrl: opponent.gun.image,
          },
    result,
    resolvedAt: new Date().toISOString(),
  };
}
