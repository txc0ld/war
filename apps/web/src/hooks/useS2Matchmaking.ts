import { useCallback, useEffect, useRef, useState } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import {
  createS2QueueAuthMessage,
  createS2QueueCancelMessage,
} from '@warpath/shared';
import { useStore } from '@/store';
import {
  s2JoinQueue,
  s2PollQueueStatus,
  s2CancelQueue,
  createS2SignedQueueRequest,
  createS2SignedCancelRequest,
} from '@/lib/s2Api';
import type { S2MatchInfo } from '@/store/s2Slice';

export interface UseS2MatchmakingReturn {
  isMatching: boolean;
  error: string | null;
  statusDetail: string;
  canCancel: boolean;
  startMatchmaking: () => Promise<void>;
  cancelMatchmaking: () => Promise<void>;
}

const POLL_INTERVAL_MS = 2000;
const DEFAULT_STATUS_DETAIL = 'Scanning for an opposing sniper...';

export function useS2Matchmaking(): UseS2MatchmakingReturn {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const {
    s2SelectedSniper,
    s2QueueId,
    s2QueueStatusToken,
    setS2Phase,
    setS2Queue,
    setS2Match,
    resetS2,
  } = useStore();

  const [isMatching, setIsMatching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusDetail, setStatusDetail] = useState(DEFAULT_STATUS_DETAIL);
  const [canCancel, setCanCancel] = useState(true);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelledRef = useRef(false);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const resetToIdle = useCallback(() => {
    stopPolling();
    setIsMatching(false);
    setCanCancel(true);
    setStatusDetail(DEFAULT_STATUS_DETAIL);
    setS2Phase('idle');
    setS2Queue(null, null);
  }, [setS2Phase, setS2Queue, stopPolling]);

  const startPollingLoop = useCallback(
    (activeQueueId: string, activeStatusToken: string) => {
      stopPolling();

      pollRef.current = setInterval(async () => {
        if (cancelledRef.current) {
          stopPolling();
          return;
        }

        try {
          const status = await s2PollQueueStatus(activeQueueId, activeStatusToken);

          if (cancelledRef.current) {
            return;
          }

          if (status.status === 'waiting') {
            setCanCancel(true);
            setStatusDetail(DEFAULT_STATUS_DETAIL);
            return;
          }

          if (status.status === 'matched') {
            const { roomId, gameServerUrl, roomToken } = status;

            if (!roomId || !gameServerUrl || !roomToken) {
              setCanCancel(false);
              setStatusDetail('Waiting for game server...');
              return;
            }

            stopPolling();
            setCanCancel(false);

            const matchInfo: S2MatchInfo = {
              battleId: status.battleId,
              roomId,
              roomToken,
              gameServerUrl,
              opponentAddress: status.opponent.address,
              opponentTokenId: status.opponent.tokenId,
            };

            setS2Match(matchInfo);
            setS2Phase('countdown');
            setIsMatching(false);
            return;
          }

          // status === 'expired' | 'cancelled'
          stopPolling();
          setError(
            status.status === 'expired'
              ? 'Queue expired before a match was found'
              : 'Queue cancelled'
          );
          resetToIdle();
        } catch (pollErr: unknown) {
          if (!cancelledRef.current) {
            setError(
              pollErr instanceof Error
                ? pollErr.message
                : 'Failed to check match status'
            );
            resetToIdle();
          }
        }
      }, POLL_INTERVAL_MS);
    },
    [resetToIdle, setS2Match, setS2Phase, stopPolling]
  );

  const performQueueCancellation = useCallback(
    async (activeQueueId: string, activeStatusToken: string) => {
      stopPolling();

      try {
        const issuedAt = new Date().toISOString();
        const payload = {
          queueId: activeQueueId,
          issuedAt,
        } as const;
        const signature = await signMessageAsync({
          message: createS2QueueCancelMessage(payload),
        });
        await s2CancelQueue(createS2SignedCancelRequest(payload, signature));

        setCanCancel(true);
        setStatusDetail(DEFAULT_STATUS_DETAIL);
        setError(null);
        resetToIdle();
      } catch (cancelErr: unknown) {
        // Cancellation failed — restore matching state and resume polling
        cancelledRef.current = false;
        setError(
          cancelErr instanceof Error
            ? cancelErr.message
            : 'Failed to cancel queue'
        );
        setS2Phase('matching');
        setS2Queue(activeQueueId, activeStatusToken);
        setIsMatching(true);
        setCanCancel(true);
        startPollingLoop(activeQueueId, activeStatusToken);
      }
    },
    [
      resetToIdle,
      setS2Phase,
      setS2Queue,
      signMessageAsync,
      startPollingLoop,
      stopPolling,
    ]
  );

  const cancelMatchmaking = useCallback(async (): Promise<void> => {
    cancelledRef.current = true;

    if (!address || !s2QueueId || !s2QueueStatusToken) {
      setError(null);
      resetToIdle();
      return;
    }

    await performQueueCancellation(s2QueueId, s2QueueStatusToken);
  }, [address, performQueueCancellation, s2QueueId, s2QueueStatusToken, resetToIdle]);

  const startMatchmaking = useCallback(async (): Promise<void> => {
    if (!s2SelectedSniper) {
      setError('Select a sniper first');
      return;
    }

    if (!address) {
      setError('Connect a wallet first');
      return;
    }

    try {
      const issuedAt = new Date().toISOString();
      const authPayload = {
        tokenId: s2SelectedSniper.tokenId,
        issuedAt,
      } as const;
      const signature = await signMessageAsync({
        message: createS2QueueAuthMessage(authPayload),
      });

      cancelledRef.current = false;
      setError(null);
      setIsMatching(true);
      setCanCancel(true);
      setStatusDetail(DEFAULT_STATUS_DETAIL);
      setS2Phase('matching');

      const result = await s2JoinQueue(
        createS2SignedQueueRequest(authPayload, signature)
      );

      setS2Queue(result.queueId, result.statusToken);

      if (cancelledRef.current) {
        await performQueueCancellation(result.queueId, result.statusToken);
        return;
      }

      startPollingLoop(result.queueId, result.statusToken);
    } catch (err: unknown) {
      if (!cancelledRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to join queue');
        resetToIdle();
      }
    }
  }, [
    address,
    performQueueCancellation,
    resetToIdle,
    s2SelectedSniper,
    setS2Phase,
    setS2Queue,
    signMessageAsync,
    startPollingLoop,
  ]);

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    isMatching,
    error,
    statusDetail,
    canCancel,
    startMatchmaking,
    cancelMatchmaking,
  };
}
