import type { Battle, GunMetadata, LeaderboardEntry } from '@warpath/shared';
import { getStatsForToken, resolveBattle } from '@warpath/shared';

export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';
export const DEMO_PLAYER_ADDRESS =
  '0xdecaf00000000000000000000000000000beef' as const;

function createGunArt(label: string, accent: string, secondary: string): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#041018" />
          <stop offset="100%" stop-color="#02060a" />
        </linearGradient>
        <linearGradient id="metal" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="${accent}" />
          <stop offset="100%" stop-color="${secondary}" />
        </linearGradient>
      </defs>
      <rect width="320" height="240" rx="24" fill="url(#bg)" />
      <circle cx="250" cy="58" r="42" fill="${accent}" opacity="0.18" />
      <path d="M40 132 H208 L240 110 H278 V132 H256 V150 H224 L202 176 H128 V162 H86 L64 188 H40 Z" fill="url(#metal)" />
      <rect x="100" y="88" width="56" height="30" rx="8" fill="${secondary}" opacity="0.9" />
      <rect x="156" y="96" width="18" height="16" rx="4" fill="#d8f7ff" opacity="0.35" />
      <text x="40" y="214" fill="#eff8ff" font-family="JetBrains Mono, monospace" font-size="20" letter-spacing="3">${label}</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function createDemoGun(
  tokenId: number,
  name: string,
  accent: string,
  secondary: string,
  traits: string[] = []
): GunMetadata {
  return {
    tokenId,
    name,
    image: createGunArt(name, accent, secondary),
    stats: getStatsForToken(tokenId),
    traits,
    canBattle: !traits.includes('Jammy Pasty'),
  };
}

export const DEMO_GUNS: GunMetadata[] = [
  createDemoGun(9101, 'Atlas Vector', '#00F0FF', '#66C8FF'),
  createDemoGun(9102, 'Signal Runner', '#CCFF00', '#7AFF7A'),
  createDemoGun(9103, 'Night Relay', '#FF6A3D', '#FFB56A'),
  createDemoGun(9104, 'Prism Array', '#FF4FD8', '#7D8BFF'),
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
    gun: createDemoGun(9201, 'Helios Drift', '#00E0B8', '#4AFFD7'),
  },
  {
    address: '0x8ad0c0000000000000000000000000000000c002',
    gun: createDemoGun(9202, 'Carbon Echo', '#79A8FF', '#B9D7FF'),
  },
  {
    address: '0x8ad0c0000000000000000000000000000000c003',
    gun: createDemoGun(9203, 'Copper Bloom', '#FF7B54', '#FFD36E'),
  },
  {
    address: '0x8ad0c0000000000000000000000000000000c004',
    gun: createDemoGun(9204, 'Halo Static', '#A06EFF', '#6EE7FF'),
  },
];

export function createDemoBattle(
  selectedGun: GunMetadata,
  selectedCountry: string
): Battle {
  const index =
    selectedCountry.split('').reduce((sum, character) => sum + character.charCodeAt(0), 0) %
    DEMO_OPPONENTS.length;
  const opponent = DEMO_OPPONENTS[index]!;
  const seed = `demo-${selectedCountry}-${selectedGun.tokenId}-${opponent.gun.tokenId}`;
  const result = resolveBattle(selectedGun.stats, opponent.gun.stats, seed);

  return {
    id: `demo-${selectedCountry.toLowerCase()}-${selectedGun.tokenId}-${opponent.gun.tokenId}`,
    left: {
      address: DEMO_PLAYER_ADDRESS,
      tokenId: selectedGun.tokenId,
      stats: selectedGun.stats,
      imageUrl: selectedGun.image,
    },
    right: {
      address: opponent.address,
      tokenId: opponent.gun.tokenId,
      stats: opponent.gun.stats,
      imageUrl: opponent.gun.image,
    },
    result,
    resolvedAt: new Date().toISOString(),
  };
}
