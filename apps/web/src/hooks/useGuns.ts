import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import type { GunMetadata } from '@warpath/shared';
import { getGuns } from '@/lib/api';
import { DEMO_GUNS, DEMO_MODE } from '@/lib/demo';

interface UseGunsReturn {
  guns: GunMetadata[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useGuns(): UseGunsReturn {
  const { address, isConnected } = useAccount();
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

  if (DEMO_MODE) {
    return {
      guns: DEMO_GUNS,
      isLoading: false,
      error: null,
      refetch,
    };
  }

  return {
    guns: query.data ?? [],
    isLoading: query.isLoading || query.isFetching,
    error: query.error instanceof Error ? query.error.message : null,
    refetch,
  };
}
