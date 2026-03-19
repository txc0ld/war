export interface GunStats {
  damage: number;
  dodge: number;
  speed: number;
}

export interface GunMetadata {
  tokenId: number;
  name: string;
  image: string;
  stats: GunStats;
  traits: string[];
  canBattle: boolean;
}

export interface Gun {
  tokenId: number;
  owner: string;
  metadata: GunMetadata;
}

export interface Player {
  address: string;
  score: number;
  wins: number;
  losses: number;
  gunCount: number;
}

export interface LeaderboardEntry extends Player {
  rank: number;
}

export interface BattleRound {
  tick: number;
  leftHp: number;
  rightHp: number;
  leftStatsDisplay: GunStats;
  rightStatsDisplay: GunStats;
  event: 'hit_left' | 'hit_right' | 'dodge_left' | 'dodge_right' | 'both_hit';
}

export interface BattleResult {
  winner: 'left' | 'right';
  leftHpRemaining: number;
  rightHpRemaining: number;
  rounds: BattleRound[];
}

export interface BattleFighter {
  address: string;
  tokenId: number;
  stats: GunStats;
  imageUrl: string;
}

export interface Battle {
  id: string;
  left: BattleFighter;
  right: BattleFighter;
  result: BattleResult;
  resolvedAt: string;
}

export type BattlePhase =
  | 'idle'
  | 'selecting'
  | 'matching'
  | 'vs_reveal'
  | 'fighting'
  | 'result_win'
  | 'result_loss'
  | 'spectating';

export interface Country {
  code: string;
  name: string;
  path: string;
}

export interface Location {
  country: string;
  x: number;
  y: number;
}

export interface QueueEntry {
  id: string;
  address: string;
  tokenId: number;
  country: string;
  status: 'waiting' | 'matched' | 'expired';
  battleId: string | null;
}

export interface MapState {
  selectedCountry: string | null;
  activeBattleLocations: Location[];
}

export interface QueueAuthPayload {
  tokenId: number;
  country: string;
  issuedAt: string;
}

export interface QueueRequest extends QueueAuthPayload {
  message: string;
  signature: `0x${string}`;
}
