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

export type BattleStatus = 'committed' | 'resolving' | 'resolved' | 'failed';

export interface BattleCommitPreimage {
  engineVersion: string;
  leftAddress: string;
  leftTokenId: number;
  leftStats: GunStats;
  leftArsenalBonus: boolean;
  rightAddress: string;
  rightTokenId: number;
  rightStats: GunStats;
  rightArsenalBonus: boolean;
  targetRound: number;
}

export interface DrandProof {
  chainHash: string;
  publicKey: string;
  round: number;
  randomness: string;
  signature: string;
  relaysChecked: string[];
}

export interface BattleProof {
  engineVersion: string;
  commitHash: `0x${string}`;
  preimage: BattleCommitPreimage;
  drand: DrandProof;
  battleSeed: `0x${string}`;
  result: BattleResult;
}

export interface BattleProofVerification {
  verified: boolean;
  commitHashValid: boolean;
  battleSeedValid: boolean;
  resultValid: boolean;
  recomputedCommitHash: `0x${string}`;
  recomputedBattleSeed: `0x${string}`;
  recomputedResult: BattleResult;
}

export interface BattleFighter {
  address: string;
  tokenId: number;
  name: string;
  stats: GunStats;
  imageUrl: string;
  arsenalBonus: boolean;
}

interface BattleEnvelopeBase {
  id: string;
  status: BattleStatus;
  engineVersion: string;
  commitHash: `0x${string}` | null;
  targetRound: number | null;
  estimatedResolveTime: string | null;
  committedAt: string | null;
  resolvedAt: string | null;
  proofAvailable: boolean;
  left: BattleFighter;
  right: BattleFighter;
}

export interface ResolvedBattle extends BattleEnvelopeBase {
  status: 'resolved';
  result: BattleResult;
}

export interface PendingBattle extends BattleEnvelopeBase {
  status: 'committed' | 'resolving';
  result: null;
}

export interface FailedBattle extends BattleEnvelopeBase {
  status: 'failed';
  result: null;
  resolutionError: string;
}

export type Battle = ResolvedBattle | PendingBattle | FailedBattle;

export interface BattleReplay {
  battleId: string;
  status: BattleStatus;
  rounds: BattleResult['rounds'] | null;
  winner: 'left' | 'right' | null;
  resolvedAt: string | null;
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
  status: 'waiting' | 'matched' | 'expired' | 'cancelled';
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

export interface QueueCancelAuthPayload {
  queueId: string;
  issuedAt: string;
}

export interface QueueCancelRequest extends QueueCancelAuthPayload {
  message: string;
  signature: `0x${string}`;
}

export interface WalletCooldown {
  expiresAt: string | null;
  remainingMs: number;
  gunCount: number;
}

export interface QueueJoinResponse {
  queueId: string;
  status: 'queued';
  statusToken: string;
  cooldown: WalletCooldown;
}

export interface QueueStatusRequest {
  queueId: string;
  statusToken: string;
}

interface QueueStatusBase {
  queueId: string;
  cooldown: WalletCooldown;
}

export interface QueueStatusWaiting extends QueueStatusBase {
  status: 'waiting';
  expiresAt: string;
}

export interface QueueStatusExpired extends QueueStatusBase {
  status: 'expired';
  expiredAt: string;
}

export interface QueueStatusCancelled extends QueueStatusBase {
  status: 'cancelled';
  cancelledAt: string;
}

export interface QueueStatusMatched extends QueueStatusBase {
  status: 'matched';
  battleId: string;
  battleStatus: BattleStatus;
  commitHash: `0x${string}` | null;
  targetRound: number | null;
  estimatedResolveTime: string | null;
  opponent: {
    address: string;
    tokenId: number;
    country: string;
  };
}

export type QueueStatus =
  | QueueStatusWaiting
  | QueueStatusExpired
  | QueueStatusCancelled
  | QueueStatusMatched;

export interface QueueCancelResponse {
  queueId: string;
  status: 'cancelled';
  cancelledAt: string;
  cooldown: WalletCooldown;
}

export interface GunsResponse {
  guns: GunMetadata[];
  cooldown: WalletCooldown;
}

export interface Profile {
  address: string;
  displayName: string | null;
  ensName: string | null;
  avatarUrl: string | null;
  statusMessage: string | null;
  showBattleResults: boolean;
  showChatPresence: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface ProfileUpdatePayload {
  address: string;
  displayName: string | null;
  avatarUrl: string | null;
  statusMessage: string | null;
  showBattleResults: boolean;
  showChatPresence: boolean;
  issuedAt: string;
}

export interface ProfileUpdateRequest extends ProfileUpdatePayload {
  message: string;
  signature: `0x${string}`;
}

export interface ChatMessagePayload {
  body: string;
  issuedAt: string;
}

export interface ChatSessionPayload {
  address: string;
  issuedAt: string;
}

export interface ChatSessionRequest extends ChatSessionPayload {
  message: string;
  signature: `0x${string}`;
}

export interface ChatSessionResponse {
  address: string;
  token: string;
  expiresAt: string;
}

export interface ChatMessageRequest extends ChatMessagePayload {
  message: string;
  signature: `0x${string}`;
}

export interface ChatCreateRequest {
  address: string;
  body: string;
}

export interface ChatMessageEntry {
  id: string;
  address: string;
  body: string;
  createdAt: string;
  profile: Pick<Profile, 'displayName' | 'ensName' | 'avatarUrl' | 'showChatPresence'>;
}

export interface ChatMessagesResponse {
  messages: ChatMessageEntry[];
}

export interface KillfeedEntry {
  battleId: string;
  winnerAddress: string;
  loserAddress: string;
  winnerTokenId: number;
  loserTokenId: number;
  winnerGunName: string;
  loserGunName: string;
  winnerImageUrl: string;
  loserImageUrl: string;
  winnerProfile: Pick<Profile, 'displayName' | 'ensName' | 'avatarUrl' | 'showBattleResults'>;
  loserProfile: Pick<Profile, 'displayName' | 'ensName' | 'avatarUrl' | 'showBattleResults'>;
  resolvedAt: string;
}

export interface KillfeedResponse {
  entries: KillfeedEntry[];
}
