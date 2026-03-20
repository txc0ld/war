export interface TierConfigEntry {
  label: string;
  statRange: [number, number];
  accent: string;
  glow: string;
  summary: string;
}

export const TIER_CONFIG = {
  1: {
    label: 'LEGENDARY',
    statRange: [85, 100],
    accent: '#F8D56B',
    glow: 'rgba(248, 213, 107, 0.42)',
    summary: 'Ultra-rare capstone guns with the strongest stat bands in the collection.',
  },
  2: {
    label: 'EPIC',
    statRange: [72, 88],
    accent: '#7EF6FF',
    glow: 'rgba(126, 246, 255, 0.34)',
    summary: 'Premium chase pieces with high-ceiling balance and distinct visual identity.',
  },
  3: {
    label: 'RARE',
    statRange: [58, 76],
    accent: '#CCFF00',
    glow: 'rgba(204, 255, 0, 0.28)',
    summary: 'Competitive mid-high tier weapons with solid stat density and broad variety.',
  },
  4: {
    label: 'UNCOMMON',
    statRange: [45, 65],
    accent: '#56B8FF',
    glow: 'rgba(86, 184, 255, 0.24)',
    summary: 'Reliable field inventory that anchors the middle of the registry.',
  },
  5: {
    label: 'COMMON',
    statRange: [35, 55],
    accent: '#93A8BC',
    glow: 'rgba(147, 168, 188, 0.2)',
    summary: 'Mainline production guns with stable but lower total stat output.',
  },
  6: {
    label: 'WORN',
    statRange: [25, 45],
    accent: '#FF8A5B',
    glow: 'rgba(255, 138, 91, 0.22)',
    summary: 'Weathered inventory with clear tradeoffs and narrower stat ceilings.',
  },
  7: {
    label: 'SCRAP',
    statRange: [15, 35],
    accent: '#7A8897',
    glow: 'rgba(122, 136, 151, 0.18)',
    summary: 'Bottom-tier salvage frames that complete the full 101-gun registry.',
  },
} as const satisfies Record<number, TierConfigEntry>;

export type GunTierId = keyof typeof TIER_CONFIG;

export const GUN_TYPE_IDS = [
  'Spirit',
  'Future',
  'Experience and Work',
  'Jammy',
  'Ancient Gold',
  'Ancient Silver',
  'G',
  'Bridge to Peace and Harmony',
  'Good Inside',
  'Heart',
  'Fencing in My Head',
  'Glitch',
  'Shotgun',
  'Diamonds',
  'Roman',
  'Prototype',
  'Trash Gold',
  'Gamble',
  'Speaker',
  'Savage',
  'Clown',
  'Rifle',
  'Rug',
] as const;

export type GunTypeId = (typeof GUN_TYPE_IDS)[number];

export interface GunTypeMetadata {
  label: GunTypeId;
  family:
    | 'artifact'
    | 'chaos'
    | 'core'
    | 'heritage'
    | 'luxury'
    | 'mythic'
    | 'signal';
  accent: string;
  summary: string;
}

export interface RawGunRegistryEntry {
  id: number;
  name: string;
  tier: GunTierId;
  type: GunTypeId;
}

export interface GunRegistryEntry extends RawGunRegistryEntry {
  serial: string;
  slug: string;
}

export const TIER_TYPES = {
  1: ['Spirit', 'Future', 'Experience and Work', 'Jammy'],
  2: ['Ancient Gold', 'Ancient Silver', 'G'],
  3: [
    'Bridge to Peace and Harmony',
    'Good Inside',
    'Heart',
    'Fencing in My Head',
    'Glitch',
  ],
  4: ['Shotgun', 'Diamonds'],
  5: ['Roman', 'Prototype', 'Trash Gold', 'Gamble'],
  6: ['Speaker', 'Savage', 'Clown'],
  7: ['Rifle', 'Rug'],
} as const satisfies Record<GunTierId, readonly GunTypeId[]>;

export const GUN_TYPE_METADATA: Record<GunTypeId, GunTypeMetadata> = {
  Spirit: {
    label: 'Spirit',
    family: 'mythic',
    accent: '#F8D56B',
    summary: 'Iconic spiritual flagship skins reserved for the highest tier archetypes.',
  },
  Future: {
    label: 'Future',
    family: 'mythic',
    accent: '#7EF6FF',
    summary: 'Forward-looking cyber forms with clean lines and top-end polish.',
  },
  'Experience and Work': {
    label: 'Experience and Work',
    family: 'mythic',
    accent: '#B0FF72',
    summary: 'Prestige builds framed as earned legacy pieces rather than pure drops.',
  },
  Jammy: {
    label: 'Jammy',
    family: 'mythic',
    accent: '#FFD447',
    summary: 'Lucky apex variant with strong collector value and obvious meme energy.',
  },
  'Ancient Gold': {
    label: 'Ancient Gold',
    family: 'artifact',
    accent: '#F2BE5C',
    summary: 'Premium relic finish with ceremonial gold cues and older-world motifs.',
  },
  'Ancient Silver': {
    label: 'Ancient Silver',
    family: 'artifact',
    accent: '#D8E6F2',
    summary: 'Cool-toned relic finish that reads cleaner and more severe than gold.',
  },
  G: {
    label: 'G',
    family: 'artifact',
    accent: '#A68BFF',
    summary: 'Minimalist rare mark carrying the shorter emblematic G identity.',
  },
  'Bridge to Peace and Harmony': {
    label: 'Bridge to Peace and Harmony',
    family: 'signal',
    accent: '#7BF0B8',
    summary: 'Story-heavy contemplative set with softer cadence than the aggression tiers.',
  },
  'Good Inside': {
    label: 'Good Inside',
    family: 'signal',
    accent: '#66D7FF',
    summary: 'Optimistic internal-core set built around bright, readable signal motifs.',
  },
  Heart: {
    label: 'Heart',
    family: 'signal',
    accent: '#FF5A9A',
    summary: 'Emotive rare set balancing sentimentality with combat edge.',
  },
  'Fencing in My Head': {
    label: 'Fencing in My Head',
    family: 'signal',
    accent: '#FF8FB7',
    summary: 'Anxious, lyrical rare set with sharper narrative mood than the other signal types.',
  },
  Glitch: {
    label: 'Glitch',
    family: 'signal',
    accent: '#00F0FF',
    summary: 'Broken-signal cyber set that bridges tech polish with instability.',
  },
  Shotgun: {
    label: 'Shotgun',
    family: 'core',
    accent: '#FF6A3D',
    summary: 'Direct combat frame type that reads blunt, heavy, and close-quarters ready.',
  },
  Diamonds: {
    label: 'Diamonds',
    family: 'luxury',
    accent: '#C8F4FF',
    summary: 'Sharper premium finish with cold luxury cues and clean reflective styling.',
  },
  Roman: {
    label: 'Roman',
    family: 'heritage',
    accent: '#E2C38C',
    summary: 'Classical heritage line that anchors much of the common tier identity.',
  },
  Prototype: {
    label: 'Prototype',
    family: 'core',
    accent: '#8DD3FF',
    summary: 'Experimental workshop line with visible iteration and test-frame energy.',
  },
  'Trash Gold': {
    label: 'Trash Gold',
    family: 'luxury',
    accent: '#C9A86A',
    summary: 'Cheap-glamour finish that intentionally blurs prestige and scavenger styling.',
  },
  Gamble: {
    label: 'Gamble',
    family: 'chaos',
    accent: '#CCFF00',
    summary: 'Risk-coded set built around volatility and loud chance-driven flair.',
  },
  Speaker: {
    label: 'Speaker',
    family: 'chaos',
    accent: '#7AA7FF',
    summary: 'Noisy worn-tier line with audio/volume motifs and high street energy.',
  },
  Savage: {
    label: 'Savage',
    family: 'chaos',
    accent: '#FF5C5C',
    summary: 'Aggressive worn-tier line focused on raw brutality over refinement.',
  },
  Clown: {
    label: 'Clown',
    family: 'chaos',
    accent: '#FF4FD8',
    summary: 'Chaotic comic-horror set that leans into absurdity instead of elegance.',
  },
  Rifle: {
    label: 'Rifle',
    family: 'core',
    accent: '#7A8897',
    summary: 'Pure stripped-back combat framing for the lowest-tier salvage builds.',
  },
  Rug: {
    label: 'Rug',
    family: 'chaos',
    accent: '#7B5CFF',
    summary: 'Meme-coded scrap tier with deliberate low-trust, low-finish styling.',
  },
};

const RAW_GUNS: RawGunRegistryEntry[] = [
  { id: 1, name: 'Roman Switcher', tier: 5, type: 'Roman' },
  { id: 2, name: 'Addict', tier: 5, type: 'Roman' },
  { id: 3, name: 'Masonic', tier: 3, type: 'Heart' },
  { id: 4, name: 'Cybernor', tier: 3, type: 'Glitch' },
  { id: 5, name: 'Slasher', tier: 6, type: 'Savage' },
  { id: 6, name: 'Westside', tier: 6, type: 'Speaker' },
  { id: 7, name: 'Sarison', tier: 5, type: 'Gamble' },
  { id: 8, name: 'Saint Money', tier: 3, type: 'Good Inside' },
  { id: 9, name: 'Baby Pig', tier: 6, type: 'Clown' },
  { id: 10, name: "Banksy's Escape", tier: 3, type: 'Heart' },
  { id: 11, name: 'Lyra Gatekeeper', tier: 2, type: 'Ancient Gold' },
  { id: 12, name: 'Klegon Bolt', tier: 3, type: 'Glitch' },
  { id: 13, name: 'Proto1', tier: 5, type: 'Prototype' },
  { id: 14, name: 'Savage Clown', tier: 6, type: 'Clown' },
  { id: 15, name: 'Empire', tier: 2, type: 'Ancient Gold' },
  { id: 16, name: 'Baros', tier: 5, type: 'Roman' },
  { id: 17, name: 'Zante', tier: 4, type: 'Diamonds' },
  { id: 18, name: 'Zaru Time Runner', tier: 1, type: 'Experience and Work' },
  { id: 19, name: 'Sweet Tooth', tier: 6, type: 'Clown' },
  { id: 20, name: 'Prickler', tier: 7, type: 'Rifle' },
  { id: 21, name: "Punk'd", tier: 6, type: 'Savage' },
  { id: 22, name: 'Pepperoni', tier: 6, type: 'Clown' },
  { id: 23, name: 'Solidus', tier: 2, type: 'Ancient Silver' },
  { id: 24, name: 'Gambu', tier: 5, type: 'Gamble' },
  { id: 25, name: 'Cardo', tier: 5, type: 'Gamble' },
  { id: 26, name: 'Dori', tier: 3, type: 'Good Inside' },
  { id: 27, name: 'Tash Vail', tier: 4, type: 'Shotgun' },
  { id: 28, name: 'Mini Clown', tier: 6, type: 'Clown' },
  { id: 29, name: 'Bluerug', tier: 7, type: 'Rug' },
  { id: 30, name: 'Libertus', tier: 3, type: 'Bridge to Peace and Harmony' },
  { id: 31, name: 'Slayer', tier: 6, type: 'Savage' },
  { id: 32, name: 'Fudwiser', tier: 6, type: 'Speaker' },
  { id: 33, name: 'Tainter', tier: 7, type: 'Rug' },
  { id: 34, name: 'Wolfgang MK1', tier: 4, type: 'Shotgun' },
  { id: 35, name: 'Volume One', tier: 6, type: 'Speaker' },
  { id: 36, name: 'Frosaint', tier: 3, type: 'Heart' },
  { id: 37, name: 'Old Timer', tier: 5, type: 'Trash Gold' },
  { id: 38, name: 'Taken', tier: 3, type: 'Fencing in My Head' },
  { id: 39, name: 'PS LA Rome', tier: 5, type: 'Roman' },
  { id: 40, name: 'Proto 2', tier: 5, type: 'Prototype' },
  { id: 41, name: 'Zlinger', tier: 4, type: 'Diamonds' },
  { id: 42, name: 'Cargo', tier: 5, type: 'Trash Gold' },
  { id: 43, name: 'Hellfire', tier: 2, type: 'Ancient Gold' },
  { id: 44, name: 'Saru', tier: 5, type: 'Roman' },
  { id: 45, name: 'Sally', tier: 6, type: 'Clown' },
  { id: 46, name: 'Cosy', tier: 3, type: 'Good Inside' },
  { id: 47, name: 'Proto 3', tier: 5, type: 'Prototype' },
  { id: 48, name: 'Moving On', tier: 3, type: 'Bridge to Peace and Harmony' },
  { id: 49, name: 'Chromo', tier: 3, type: 'Glitch' },
  { id: 50, name: 'Pusia Runner', tier: 1, type: 'Experience and Work' },
  { id: 51, name: 'Garatum', tier: 2, type: 'Ancient Silver' },
  { id: 52, name: 'Jacker', tier: 6, type: 'Savage' },
  { id: 53, name: '3 Port', tier: 4, type: 'Shotgun' },
  { id: 54, name: 'The Seer', tier: 1, type: 'Spirit' },
  { id: 55, name: 'Calamatus', tier: 2, type: 'G' },
  { id: 56, name: 'Crug', tier: 7, type: 'Rug' },
  { id: 57, name: 'Vilus', tier: 3, type: 'Glitch' },
  { id: 58, name: 'Diamondo', tier: 4, type: 'Diamonds' },
  { id: 59, name: 'Carson', tier: 5, type: 'Gamble' },
  { id: 60, name: 'Oneshot', tier: 4, type: 'Shotgun' },
  { id: 61, name: 'Tabaku', tier: 6, type: 'Speaker' },
  { id: 62, name: 'Jammy Ba*tard', tier: 1, type: 'Jammy' },
  { id: 63, name: 'Inside', tier: 3, type: 'Good Inside' },
  { id: 64, name: 'Mac', tier: 4, type: 'Shotgun' },
  { id: 65, name: 'Sint', tier: 3, type: 'Heart' },
  { id: 66, name: 'Barato', tier: 5, type: 'Trash Gold' },
  { id: 67, name: 'Scrimbar', tier: 7, type: 'Rifle' },
  { id: 68, name: 'Unknown', tier: 7, type: 'Rifle' },
  { id: 69, name: 'Pepe', tier: 3, type: 'Glitch' },
  { id: 70, name: 'Beater', tier: 6, type: 'Savage' },
  { id: 71, name: 'Dogo', tier: 6, type: 'Clown' },
  { id: 72, name: 'Lander', tier: 5, type: 'Gamble' },
  { id: 73, name: 'City Night', tier: 3, type: 'Fencing in My Head' },
  { id: 74, name: 'Volume 2', tier: 6, type: 'Speaker' },
  { id: 75, name: 'Marilas', tier: 2, type: 'Ancient Silver' },
  { id: 76, name: 'Decodeus', tier: 3, type: 'Glitch' },
  { id: 77, name: 'Glass', tier: 4, type: 'Diamonds' },
  { id: 78, name: 'Tokyo Drip', tier: 1, type: 'Future' },
  { id: 79, name: 'Flyer', tier: 5, type: 'Prototype' },
  { id: 80, name: 'Ethorodox', tier: 2, type: 'G' },
  { id: 81, name: 'Mason', tier: 3, type: 'Heart' },
  { id: 82, name: 'Slider', tier: 7, type: 'Rifle' },
  { id: 83, name: 'Spikey', tier: 6, type: 'Savage' },
  { id: 84, name: 'Nailer', tier: 7, type: 'Rifle' },
  { id: 85, name: 'Within', tier: 3, type: 'Good Inside' },
  { id: 86, name: 'Buzzer', tier: 6, type: 'Speaker' },
  { id: 87, name: 'Clapper', tier: 5, type: 'Trash Gold' },
  { id: 88, name: 'Pointer', tier: 7, type: 'Rug' },
  { id: 89, name: 'Softly', tier: 3, type: 'Bridge to Peace and Harmony' },
  { id: 90, name: 'Lazaru', tier: 1, type: 'Spirit' },
  { id: 91, name: 'Trinity', tier: 2, type: 'Ancient Gold' },
  { id: 92, name: 'Cage', tier: 4, type: 'Shotgun' },
  { id: 93, name: 'Tri', tier: 5, type: 'Gamble' },
  { id: 94, name: 'Clawbot', tier: 3, type: 'Glitch' },
  { id: 95, name: 'Undyor', tier: 3, type: 'Fencing in My Head' },
  { id: 96, name: 'Futeum MK0', tier: 1, type: 'Future' },
  { id: 97, name: 'Leron', tier: 5, type: 'Roman' },
  { id: 98, name: 'Spinicus', tier: 2, type: 'G' },
  { id: 99, name: 'Royal Basil', tier: 2, type: 'Ancient Gold' },
  { id: 100, name: 'Heart of Freedom', tier: 1, type: 'Spirit' },
  { id: 101, name: 'Connection', tier: 3, type: 'Heart' },
];

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export const GUNS: GunRegistryEntry[] = RAW_GUNS.map((gun) => ({
  ...gun,
  serial: `WP-${String(gun.id).padStart(3, '0')}`,
  slug: `${slugify(gun.name)}-wp-${String(gun.id).padStart(3, '0')}`,
}));

export const REGISTRY_SIZE = GUNS.length;
export const TIER_ORDER = [1, 2, 3, 4, 5, 6, 7] as const;

export const GUNS_BY_ID = new Map<number, GunRegistryEntry>(
  GUNS.map((gun) => [gun.id, gun])
);

export const GUNS_BY_TIER = TIER_ORDER.reduce(
  (registry, tier) => {
    registry[tier] = GUNS.filter((gun) => gun.tier === tier);
    return registry;
  },
  {} as Record<GunTierId, GunRegistryEntry[]>
);

export const GUNS_BY_TYPE = GUN_TYPE_IDS.reduce(
  (registry, type) => {
    registry[type] = GUNS.filter((gun) => gun.type === type);
    return registry;
  },
  {} as Record<GunTypeId, GunRegistryEntry[]>
);

export function getTierLabel(tier: GunTierId): string {
  return TIER_CONFIG[tier].label;
}

export function getTierMeta(tier: GunTierId): TierConfigEntry {
  return TIER_CONFIG[tier];
}

export function getTypeMeta(type: GunTypeId): GunTypeMetadata {
  return GUN_TYPE_METADATA[type];
}
