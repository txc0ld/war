// packages/shared/src/s2Types.ts

export interface SniperMetadata {
  tokenId: number;
  name: string;
  image: string;
  skin: string;
  scopeReticle: string;
  killEffect: string;
  tracerColor: string;
  inspectAnimation: string;
}

export interface S2PlayerStats {
  address: string;
  score: number;
  elo: number;
  wins: number;
  losses: number;
  headshotKills: number;
  totalKills: number;
  sniperCount: number;
}

export interface S2LeaderboardEntry extends S2PlayerStats {
  rank: number;
  headshotPct: number;
  winStreak: number;
  displayName: string | null;
  ensName: string | null;
}

export interface S2RoundResult {
  round: number;
  winner: 0 | 1 | null;
  killerHeadshot: boolean;
  player0Hp: number;
  player1Hp: number;
  durationMs: number;
}

export type S2BattleStatus = 'pending' | 'active' | 'resolved' | 'failed';

export interface S2BattleFighter {
  address: string;
  tokenId: number;
  name: string;
  skin: string;
  scopeReticle: string;
  killEffect: string;
  tracerColor: string;
}

interface S2BattleBase {
  id: string;
  status: S2BattleStatus;
  roomId: string | null;
  left: S2BattleFighter;
  right: S2BattleFighter;
  createdAt: string;
  resolvedAt: string | null;
}

export interface S2ResolvedBattle extends S2BattleBase {
  status: 'resolved';
  winner: 'left' | 'right';
  leftScore: number;
  rightScore: number;
  roundsWonLeft: number;
  roundsWonRight: number;
  rounds: S2RoundResult[];
}

export interface S2PendingBattle extends S2BattleBase {
  status: 'pending' | 'active';
  winner: null;
  leftScore: null;
  rightScore: null;
  roundsWonLeft: null;
  roundsWonRight: null;
  rounds: null;
}

export interface S2FailedBattle extends S2BattleBase {
  status: 'failed';
  winner: null;
  leftScore: null;
  rightScore: null;
  roundsWonLeft: null;
  roundsWonRight: null;
  rounds: null;
}

export type S2Battle = S2ResolvedBattle | S2PendingBattle | S2FailedBattle;

export interface S2QueueAuthPayload {
  tokenId: number;
  issuedAt: string;
}

export interface S2QueueRequest extends S2QueueAuthPayload {
  message: string;
  signature: `0x${string}`;
}

export interface S2QueueJoinResponse {
  queueId: string;
  status: 'queued';
  statusToken: string;
}

export interface S2QueueStatusRequest {
  queueId: string;
  statusToken: string;
}

interface S2QueueStatusBase {
  queueId: string;
}

export interface S2QueueStatusWaiting extends S2QueueStatusBase {
  status: 'waiting';
  expiresAt: string;
}

export interface S2QueueStatusExpired extends S2QueueStatusBase {
  status: 'expired';
  expiredAt: string;
}

export interface S2QueueStatusCancelled extends S2QueueStatusBase {
  status: 'cancelled';
  cancelledAt: string;
}

export interface S2QueueStatusMatched extends S2QueueStatusBase {
  status: 'matched';
  battleId: string;
  battleStatus: S2BattleStatus;
  roomId: string | null;
  gameServerUrl: string | null;
  roomToken: string | null;
  opponent: {
    address: string;
    tokenId: number;
  };
}

export type S2QueueStatus =
  | S2QueueStatusWaiting
  | S2QueueStatusExpired
  | S2QueueStatusCancelled
  | S2QueueStatusMatched;

export interface S2QueueCancelAuthPayload {
  queueId: string;
  issuedAt: string;
}

export interface S2QueueCancelRequest extends S2QueueCancelAuthPayload {
  message: string;
  signature: `0x${string}`;
}

export interface S2QueueCancelResponse {
  queueId: string;
  status: 'cancelled';
  cancelledAt: string;
}

export interface S2SnipersResponse {
  snipers: SniperMetadata[];
}

export interface S2KillfeedEntry {
  battleId: string;
  winnerAddress: string;
  loserAddress: string;
  winnerTokenId: number;
  loserTokenId: number;
  winnerSniperName: string;
  loserSniperName: string;
  winnerImageUrl: string;
  loserImageUrl: string;
  headshot: boolean;
  winnerProfile: {
    displayName: string | null;
    ensName: string | null;
    avatarUrl: string | null;
  };
  loserProfile: {
    displayName: string | null;
    ensName: string | null;
    avatarUrl: string | null;
  };
  resolvedAt: string;
}

export interface S2KillfeedResponse {
  entries: S2KillfeedEntry[];
}

export interface S2MatchResult {
  winner: 0 | 1;
  rounds: S2RoundResult[];
  leftScore: number;
  rightScore: number;
}

export interface S2GameServerMatchReport {
  battleId: string;
  secret: string;
  result: S2MatchResult;
}
