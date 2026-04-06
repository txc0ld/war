import { useState, useEffect, useCallback, useRef } from 'react';
import { s2GetLeaderboard } from '@/lib/s2Api';
import type { S2LeaderboardEntry } from '@warpath/shared';

const POLL_INTERVAL_MS = 30_000;

interface UseS2LeaderboardResult {
  entries: S2LeaderboardEntry[];
  isLoading: boolean;
  error: string | null;
}

export function useS2Leaderboard(
  limit = 50,
  offset = 0,
): UseS2LeaderboardResult {
  const [entries, setEntries] = useState<S2LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const result = await s2GetLeaderboard(limit, offset);
      setEntries(result.entries);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch S2 leaderboard';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [limit, offset]);

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

  return { entries, isLoading, error };
}
