import {
  createS2QueueAuthMessage,
  createS2QueueCancelMessage,
  type S2Battle,
  type S2KillfeedResponse,
  type S2LeaderboardEntry,
  type S2QueueAuthPayload,
  type S2QueueCancelAuthPayload,
  type S2QueueCancelRequest,
  type S2QueueCancelResponse,
  type S2QueueJoinResponse,
  type S2QueueRequest,
  type S2QueueStatus,
  type S2QueueStatusRequest,
  type S2SnipersResponse,
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

// ---------------------------------------------------------------------------
// Queue
// ---------------------------------------------------------------------------

export function s2JoinQueue(payload: S2QueueRequest): Promise<S2QueueJoinResponse> {
  return request<S2QueueJoinResponse>('/api/s2/battles/queue', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function createS2SignedQueueRequest(
  payload: S2QueueAuthPayload,
  signature: `0x${string}`
): S2QueueRequest {
  return {
    ...payload,
    message: createS2QueueAuthMessage(payload),
    signature,
  };
}

export function s2PollQueueStatus(
  queueId: string,
  statusToken: string
): Promise<S2QueueStatus> {
  const payload: S2QueueStatusRequest = { queueId, statusToken };
  return request<S2QueueStatus>(`/api/s2/battles/queue/${queueId}/status`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function s2CancelQueue(
  payload: S2QueueCancelRequest
): Promise<S2QueueCancelResponse> {
  return request<S2QueueCancelResponse>(
    `/api/s2/battles/queue/${payload.queueId}/cancel`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
}

export function createS2SignedCancelRequest(
  payload: S2QueueCancelAuthPayload,
  signature: `0x${string}`
): S2QueueCancelRequest {
  return {
    ...payload,
    message: createS2QueueCancelMessage(payload),
    signature,
  };
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

export function s2GetBattle(battleId: string): Promise<S2Battle> {
  return request<S2Battle>(`/api/s2/battles/${battleId}`);
}

interface S2LeaderboardResponse {
  entries: S2LeaderboardEntry[];
  total: number;
}

export function s2GetLeaderboard(
  limit = 50,
  offset = 0
): Promise<S2LeaderboardResponse> {
  return request<S2LeaderboardResponse>(
    `/api/s2/leaderboard?limit=${limit}&offset=${offset}`
  );
}

export function s2GetPlayerStats(address: string): Promise<S2LeaderboardEntry> {
  return request<S2LeaderboardEntry>(`/api/s2/leaderboard/${address}`);
}

export function s2GetSnipers(address: string): Promise<S2SnipersResponse> {
  return request<S2SnipersResponse>(`/api/s2/snipers/${address}`);
}

export function s2GetKillfeed(limit = 25): Promise<S2KillfeedResponse> {
  return request<S2KillfeedResponse>(`/api/s2/killfeed?limit=${limit}`);
}
