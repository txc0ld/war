import { useState, useEffect, useCallback, useRef } from 'react';
import { getLeaderboard } from '@/lib/api';
import type { LeaderboardEntry } from '@warpath/shared';

const POLL_INTERVAL_MS = 30_000;

interface UseLeaderboardResult {
  entries: LeaderboardEntry[];
  total: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useLeaderboard(
  limit?: number,
  offset?: number,
): UseLeaderboardResult {
  const normalizedLimit = limit ?? 50;
  const normalizedOffset = offset ?? 0;
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const result = await getLeaderboard(normalizedLimit, normalizedOffset);
      setEntries(result.entries);
      setTotal(result.total);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch leaderboard';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [normalizedLimit, normalizedOffset]);

  useEffect(() => {
    setIsLoading(true);
    void fetchData();

    intervalRef.current = setInterval(() => {
      void fetchData();
    }, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetchData]);

  const refetch = useCallback(() => {
    setIsLoading(true);
    void fetchData();
  }, [fetchData]);

  return { entries, total, isLoading, error, refetch };
}
