import {
  createGlobalChatMessage,
  createChatSessionMessage,
  createProfileUpdateMessage,
  createQueueAuthMessage,
  createQueueCancelMessage,
  type Battle,
  type BattleProof,
  type BattleReplay,
  type ChatMessageEntry,
  type ChatCreateRequest,
  type ChatMessagesResponse,
  type ChatSessionPayload,
  type ChatSessionRequest,
  type ChatSessionResponse,
  type GunsResponse,
  type KillfeedResponse,
  type LeaderboardEntry,
  type Profile,
  type ProfileUpdatePayload,
  type ProfileUpdateRequest,
  type QueueAuthPayload,
  type QueueCancelAuthPayload,
  type QueueCancelRequest,
  type QueueCancelResponse,
  type QueueJoinResponse,
  type QueueRequest,
  type QueueStatusRequest,
  type QueueStatus,
} from '@warpath/shared';

const runtimeOrigin =
  typeof window !== 'undefined' ? window.location.origin : null;
const configuredApiBase = import.meta.env.VITE_API_URL?.trim();
const API_BASE_URL =
  runtimeOrigin && !import.meta.env.DEV
    ? runtimeOrigin
    : configuredApiBase ?? runtimeOrigin ?? 'http://localhost:3001';

interface ApiError {
  error: string;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const headers = new Headers(options?.headers);

  if (options?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({ error: res.statusText }))) as ApiError;
    throw new Error(body.error || `API error: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export function joinQueue(payload: QueueRequest): Promise<QueueJoinResponse> {
  return request<QueueJoinResponse>('/api/battles/queue', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function createSignedQueueRequest(
  payload: QueueAuthPayload,
  signature: `0x${string}`
): QueueRequest {
  return {
    ...payload,
    message: createQueueAuthMessage(payload),
    signature,
  };
}

export function cancelQueue(payload: QueueCancelRequest): Promise<QueueCancelResponse> {
  return request<QueueCancelResponse>(`/api/battles/queue/${payload.queueId}/cancel`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function createSignedQueueCancelRequest(
  payload: QueueCancelAuthPayload,
  signature: `0x${string}`
): QueueCancelRequest {
  return {
    ...payload,
    message: createQueueCancelMessage(payload),
    signature,
  };
}

export function pollQueueStatus(
  queueId: string,
  statusToken: string
): Promise<QueueStatus> {
  const payload: QueueStatusRequest = { queueId, statusToken };
  return request<QueueStatus>(`/api/battles/queue/${queueId}/status`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getBattle(battleId: string): Promise<Battle> {
  return request<Battle>(`/api/battles/${battleId}`);
}

export function getBattleProof(battleId: string): Promise<BattleProof> {
  return request<BattleProof>(`/api/battles/${battleId}/proof`);
}

export function getBattleReplay(battleId: string): Promise<BattleReplay> {
  return request<BattleReplay>(`/api/battles/${battleId}/replay`);
}

interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  total: number;
}

export function getLeaderboard(
  limit = 50,
  offset = 0
): Promise<LeaderboardResponse> {
  return request<LeaderboardResponse>(`/api/leaderboard?limit=${limit}&offset=${offset}`);
}

export function getGuns(address: string): Promise<GunsResponse> {
  return request<GunsResponse>(`/api/guns/${address}`);
}

export function getKillfeed(limit = 25): Promise<KillfeedResponse> {
  return request<KillfeedResponse>(`/api/killfeed?limit=${limit}`);
}

export function getGlobalChat(limit = 50): Promise<ChatMessagesResponse> {
  return request<ChatMessagesResponse>(`/api/chat?limit=${limit}`);
}

export function createSignedChatSessionRequest(
  payload: ChatSessionPayload,
  signature: `0x${string}`
): ChatSessionRequest {
  return {
    ...payload,
    message: createChatSessionMessage(payload),
    signature,
  };
}

export function issueChatSession(
  payload: ChatSessionRequest
): Promise<ChatSessionResponse> {
  return request<ChatSessionResponse>('/api/chat/session', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function postGlobalChat(
  payload: ChatCreateRequest
): Promise<ChatMessageEntry> {
  return request<ChatMessageEntry>('/api/chat', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getProfile(address: string): Promise<Profile> {
  return request<Profile>(`/api/profiles/${address}`);
}

export function createSignedProfileUpdateRequest(
  payload: ProfileUpdatePayload,
  signature: `0x${string}`
): ProfileUpdateRequest {
  return {
    ...payload,
    message: createProfileUpdateMessage(payload),
    signature,
  };
}

export function saveProfile(
  payload: ProfileUpdateRequest
): Promise<Profile> {
  return request<Profile>(`/api/profiles/${payload.address}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
