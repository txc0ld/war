import { createQueueAuthMessage } from '@warpath/shared';
import type { QueueAuthPayload, QueueRequest } from '@warpath/shared';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface ApiError {
  error: string;
}

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({ error: res.statusText }))) as ApiError;
    throw new Error(body.error || `API error: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// Queue
interface QueueResponse {
  queueId: string;
  status: 'queued';
}

interface QueueStatusWaiting {
  status: 'waiting';
}

interface QueueStatusMatched {
  status: 'matched';
  battleId: string;
  opponent: {
    address: string;
    tokenId: number;
    country: string;
  };
}

type QueueStatus = QueueStatusWaiting | QueueStatusMatched;

export function joinQueue(
  payload: QueueRequest
): Promise<QueueResponse> {
  return request<QueueResponse>('/api/battles/queue', {
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

export function pollQueueStatus(
  queueId: string,
  address: string
): Promise<QueueStatus> {
  return request<QueueStatus>(
    `/api/battles/queue/${queueId}?address=${encodeURIComponent(address)}`
  );
}

// Battle
import type { Battle } from '@warpath/shared';

export function getBattle(battleId: string): Promise<Battle> {
  return request<Battle>(`/api/battles/${battleId}`);
}

// Leaderboard
import type { LeaderboardEntry } from '@warpath/shared';

interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  total: number;
}

export function getLeaderboard(
  limit = 50,
  offset = 0
): Promise<LeaderboardResponse> {
  return request<LeaderboardResponse>(
    `/api/leaderboard?limit=${limit}&offset=${offset}`
  );
}

// Guns
import type { GunMetadata } from '@warpath/shared';

interface GunsResponse {
  guns: GunMetadata[];
}

export function getGuns(address: string): Promise<GunsResponse> {
  return request<GunsResponse>(`/api/guns/${address}`);
}
