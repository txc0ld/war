import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import type { GunMetadata } from '@warpath/shared';
import { getGuns } from '@/lib/api';
import { DEMO_GUNS, DEMO_MODE } from '@/lib/demo';
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
  const weaponCooldowns = useStore((state) => state.weaponCooldowns);
  const query = useQuery({
    queryKey: ['guns', address],
    queryFn: async () => {
      if (!address) {
        return [] as GunMetadata[];
      }

      const response = await getGuns(address);
      return response.guns;
    },
    enabled: isConnected && !!address,
    staleTime: 60_000,
  });

  const refetch = useCallback(() => {
    if (DEMO_MODE) {
      return;
    }

    void query.refetch();
  }, [query]);

  const applyCooldowns = useCallback(
    (guns: GunMetadata[]): GunMetadata[] =>
      guns.map((gun) => ({
        ...gun,
        canBattle:
          gun.canBattle &&
          getCooldownRemainingMs(weaponCooldowns, gun.tokenId) === 0,
      })),
    [weaponCooldowns]
  );

  if (DEMO_MODE) {
    return {
      guns: sessionAddress ? applyCooldowns(DEMO_GUNS) : DEMO_GUNS,
      isLoading: false,
      error: null,
      refetch,
    };
  }

  return {
    guns: sessionAddress ? applyCooldowns(query.data ?? []) : query.data ?? [],
    isLoading: query.isLoading || query.isFetching,
    error: query.error instanceof Error ? query.error.message : null,
    refetch,
  };
}
