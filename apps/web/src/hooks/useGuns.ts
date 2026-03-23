import { useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import type { GunMetadata, GunsResponse } from '@warpath/shared';
import { getGuns } from '@/lib/api';
import { useSessionAddress } from './useSessionAddress';
import { useStore } from '@/store';
import { getCooldownRemainingMs } from '@/lib/cooldowns';

interface UseGunsReturn {
  guns: GunMetadata[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useGuns(): UseGunsReturn {
  const { address, isConnected } = useAccount();
  const sessionAddress = useSessionAddress();
  const walletCooldownExpiresAt = useStore((state) => state.walletCooldownExpiresAt);
  const setGuns = useStore((state) => state.setGuns);
  const setWalletCooldown = useStore((state) => state.setWalletCooldown);
  const query = useQuery({
    queryKey: ['guns', address],
    queryFn: async () => {
      if (!address) {
        return {
          guns: [] as GunMetadata[],
          cooldown: {
            expiresAt: null,
            remainingMs: 0,
            gunCount: 0,
          },
        } satisfies GunsResponse;
      }

      return getGuns(address);
    },
    enabled: isConnected && !!address,
    staleTime: 60_000,
  });

  const refetch = useCallback(() => {
    void query.refetch();
  }, [query]);

  const applyCooldowns = useCallback(
    (guns: GunMetadata[]): GunMetadata[] => {
      const isWalletCoolingDown =
        getCooldownRemainingMs(walletCooldownExpiresAt) > 0;

      return guns.map((gun) => ({
        ...gun,
        canBattle: gun.canBattle && !isWalletCoolingDown,
      }));
    },
    [walletCooldownExpiresAt]
  );

  useEffect(() => {
    if (!sessionAddress) {
      setGuns([]);
      return;
    }

    setGuns(query.data?.guns ?? []);
    const expiresAt = query.data?.cooldown.expiresAt
      ? Date.parse(query.data.cooldown.expiresAt)
      : null;
    setWalletCooldown(Number.isNaN(expiresAt ?? Number.NaN) ? null : expiresAt);
  }, [query.data, sessionAddress, setGuns, setWalletCooldown]);

  return {
    guns: sessionAddress ? applyCooldowns(query.data?.guns ?? []) : query.data?.guns ?? [],
    isLoading: query.isLoading || query.isFetching,
    error: query.error instanceof Error ? query.error.message : null,
    refetch,
  };
}
