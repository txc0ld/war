import { useCallback, useEffect, useRef, useState } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import {
  createQueueAuthMessage,
  createQueueCancelMessage,
  type QueueStatus,
} from '@warpath/shared';
import { useStore } from '@/store';
import {
  cancelQueue,
  createSignedQueueCancelRequest,
  createSignedQueueRequest,
  getBattle,
  joinQueue,
  pollQueueStatus,
} from '@/lib/api';
import { formatCooldownLabel, getCooldownRemainingMs } from '@/lib/cooldowns';

interface UseMatchmakingReturn {
  isMatching: boolean;
  error: string | null;
  statusDetail: string;
  canCancel: boolean;
  startMatchmaking: () => Promise<void>;
  cancelMatchmaking: () => Promise<void>;
}

const POLL_INTERVAL_MS = 2000;
const DEFAULT_STATUS_DETAIL = 'Scanning open sectors for an opposing bracket.';

function parseCooldownExpiry(expiresAt: string | null): number | null {
  if (!expiresAt) {
    return null;
  }

  const timestamp = Date.parse(expiresAt);
  return Number.isNaN(timestamp) ? null : timestamp;
}

function formatResolveDetail(status: Extract<QueueStatus, { status: 'matched' }>): string {
  const roundLabel =
    status.targetRound != null ? `drand round ${status.targetRound}` : 'future drand round';
  const resolveAt = status.estimatedResolveTime
    ? new Date(status.estimatedResolveTime).toLocaleString()
    : null;

  return resolveAt
    ? `Opponent locked. Awaiting ${roundLabel} scheduled for ${resolveAt}.`
    : `Opponent locked. Awaiting ${roundLabel}.`;
}

export function useMatchmaking(): UseMatchmakingReturn {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const {
    selectedCountry,
    selectedGun,
    setPhase,
    setQueueId,
    setQueueStatusToken,
    setBattle,
    queueId,
    queueStatusToken,
    walletCooldownExpiresAt,
    setWalletCooldown,
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
    setPhase('idle');
    setQueueId(null);
    setQueueStatusToken(null);
  }, [setPhase, setQueueId, setQueueStatusToken, stopPolling]);

  const applyCooldownFromStatus = useCallback(
    (status: Pick<QueueStatus, 'cooldown'>) => {
      setWalletCooldown(parseCooldownExpiry(status.cooldown.expiresAt));
    },
    [setWalletCooldown]
  );

  const startPollingLoop = useCallback(
    (activeQueueId: string, activeStatusToken: string) => {
      stopPolling();

      pollRef.current = setInterval(async () => {
        if (cancelledRef.current) {
          stopPolling();
          return;
        }

        try {
          const status = await pollQueueStatus(activeQueueId, activeStatusToken);

          if (cancelledRef.current) {
            return;
          }

          applyCooldownFromStatus(status);

          if (status.status === 'waiting') {
            setCanCancel(true);
            setStatusDetail(DEFAULT_STATUS_DETAIL);
            return;
          }

          if (status.status === 'matched') {
            if (status.battleStatus !== 'resolved') {
              setCanCancel(false);
              setStatusDetail(formatResolveDetail(status));
              return;
            }

            stopPolling();
            setCanCancel(false);
            setPhase('vs_reveal');
            const battle = await getBattle(status.battleId);
            setBattle(battle);
            setIsMatching(false);
            return;
          }

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
    [applyCooldownFromStatus, resetToIdle, setBattle, setPhase, stopPolling]
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
          message: createQueueCancelMessage(payload),
        });
        const result = await cancelQueue(
          createSignedQueueCancelRequest(payload, signature)
        );

        setWalletCooldown(parseCooldownExpiry(result.cooldown.expiresAt));
        setCanCancel(true);
        setStatusDetail(DEFAULT_STATUS_DETAIL);
        setError(null);
        resetToIdle();
      } catch (cancelErr: unknown) {
        cancelledRef.current = false;
        setError(
          cancelErr instanceof Error
            ? cancelErr.message
            : 'Failed to cancel queue'
        );
        setPhase('matching');
        setQueueId(activeQueueId);
        setQueueStatusToken(activeStatusToken);
        setIsMatching(true);
        setCanCancel(true);
        startPollingLoop(activeQueueId, activeStatusToken);
      }
    },
    [
      resetToIdle,
      setPhase,
      setQueueId,
      setQueueStatusToken,
      setWalletCooldown,
      signMessageAsync,
      startPollingLoop,
      stopPolling,
    ]
  );

  const cancelMatchmaking = useCallback(async (): Promise<void> => {
    cancelledRef.current = true;

    if (!address || !queueId || !queueStatusToken) {
      setError(null);
      resetToIdle();
      return;
    }

    await performQueueCancellation(queueId, queueStatusToken);
  }, [address, performQueueCancellation, queueId, queueStatusToken, resetToIdle]);

  const startMatchmaking = useCallback(async (): Promise<void> => {
    const walletCooldownRemaining = getCooldownRemainingMs(walletCooldownExpiresAt);

    if (!selectedCountry || !selectedGun) {
      setError('Select a country and weapon first');
      return;
    }

    if (walletCooldownRemaining > 0) {
      setError(`Wallet cooling down ${formatCooldownLabel(walletCooldownRemaining)}`);
      return;
    }

    if (!selectedGun.canBattle) {
      setError('Selected weapon unavailable');
      return;
    }

    if (!address) {
      setError('Connect a wallet first');
      return;
    }

    cancelledRef.current = false;
    setError(null);
    setIsMatching(true);
    setCanCancel(true);
    setStatusDetail(DEFAULT_STATUS_DETAIL);
    setPhase('matching');

    try {
      const currentAddress = address;
      if (!currentAddress) {
        throw new Error('Connect a wallet first');
      }

      const issuedAt = new Date().toISOString();
      const authPayload = {
        tokenId: selectedGun.tokenId,
        country: selectedCountry,
        issuedAt,
      } as const;
      const result = await joinQueue(
        createSignedQueueRequest(
          authPayload,
          await signMessageAsync({
            message: createQueueAuthMessage(authPayload),
          })
        )
      );

      setWalletCooldown(parseCooldownExpiry(result.cooldown.expiresAt));
      setQueueId(result.queueId);
      setQueueStatusToken(result.statusToken);

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
    selectedCountry,
    selectedGun,
    setPhase,
    setQueueId,
    setQueueStatusToken,
    setWalletCooldown,
    signMessageAsync,
    startPollingLoop,
    walletCooldownExpiresAt,
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
