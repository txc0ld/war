import { useState, useEffect, useRef, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { useSignMessage } from 'wagmi';
import { useStore } from '@/store';
import {
  createSignedQueueRequest,
  joinQueue,
  pollQueueStatus,
  getBattle,
} from '@/lib/api';
import { formatCooldownLabel, getCooldownRemainingMs } from '@/lib/cooldowns';
import { createQueueAuthMessage } from '@warpath/shared';
import { createDemoBattle, DEMO_MODE } from '@/lib/demo';

interface UseMatchmakingReturn {
  isMatching: boolean;
  error: string | null;
  startMatchmaking: () => Promise<void>;
  cancelMatchmaking: () => void;
}

const POLL_INTERVAL_MS = 2000;

export function useMatchmaking(): UseMatchmakingReturn {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const {
    selectedCountry,
    selectedGun,
    setPhase,
    setQueueId,
    setBattle,
    queueId,
    phase,
    walletCooldownExpiresAt,
  } = useStore();

  const [isMatching, setIsMatching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const demoMatchRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelledRef = useRef(false);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    if (demoMatchRef.current) {
      clearTimeout(demoMatchRef.current);
      demoMatchRef.current = null;
    }
  }, []);

  const cancelMatchmaking = useCallback(() => {
    cancelledRef.current = true;
    stopPolling();
    setIsMatching(false);
    setError(null);
    setPhase('idle');
    setQueueId(null);
  }, [stopPolling, setPhase, setQueueId]);

  const startMatchmaking = useCallback(async (): Promise<void> => {
    const walletCooldownRemaining = getCooldownRemainingMs(walletCooldownExpiresAt);

    if (!selectedCountry || !selectedGun) {
      setError('Select a country and weapon first');
      return;
    }

    if (walletCooldownRemaining > 0) {
      setError(
        `Wallet cooling down ${formatCooldownLabel(walletCooldownRemaining)}`
      );
      return;
    }

    if (!selectedGun.canBattle) {
      setError('Selected weapon unavailable');
      return;
    }

    if (!address && !DEMO_MODE) {
      setError('Connect a wallet first');
      return;
    }

    cancelledRef.current = false;
    setError(null);
    setIsMatching(true);
    setPhase('matching');

    try {
      if (DEMO_MODE) {
        demoMatchRef.current = setTimeout(() => {
          if (cancelledRef.current) {
            return;
          }

          setQueueId('demo-queue');
          setBattle(createDemoBattle(selectedGun, selectedCountry));
          setPhase('vs_reveal');
          setIsMatching(false);
          demoMatchRef.current = null;
        }, 1400);

        return;
      }

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

      if (cancelledRef.current) return;

      setQueueId(result.queueId);

      // Start polling
      pollRef.current = setInterval(async () => {
        if (cancelledRef.current) {
          stopPolling();
          return;
        }

        try {
          const status = await pollQueueStatus(result.queueId, currentAddress);

          if (cancelledRef.current) return;

          if (status.status === 'matched') {
            stopPolling();
            setPhase('vs_reveal');

            // Fetch full battle data
            const battle = await getBattle(status.battleId);
            setBattle(battle);
            setIsMatching(false);
          }
        } catch (pollErr: unknown) {
          if (!cancelledRef.current) {
            const msg =
              pollErr instanceof Error
                ? pollErr.message
                : 'Failed to check match status';
            setError(msg);
            stopPolling();
            setIsMatching(false);
            setPhase('idle');
          }
        }
      }, POLL_INTERVAL_MS);
    } catch (err: unknown) {
      if (!cancelledRef.current) {
        const msg =
          err instanceof Error ? err.message : 'Failed to join queue';
        setError(msg);
        setIsMatching(false);
        setPhase('idle');
      }
    }
  }, [
    address,
    selectedCountry,
    selectedGun,
    setPhase,
    setQueueId,
    setBattle,
    stopPolling,
    signMessageAsync,
    walletCooldownExpiresAt,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    isMatching,
    error,
    startMatchmaking,
    cancelMatchmaking,
  };
}
