import { useState, useEffect } from 'react';
import type { GunMetadata } from '@warpath/shared';
import { getStatsForToken } from '@warpath/shared';

interface UseGunMetadataReturn {
  metadata: GunMetadata | null;
  isLoading: boolean;
  error: string | null;
}

export function useGunMetadata(
  tokenId: number | null,
  tokenURI: string | null
): UseGunMetadataReturn {
  const [metadata, setMetadata] = useState<GunMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tokenId === null || !tokenURI) {
      setMetadata(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    async function fetchMeta(): Promise<void> {
      try {
        const url = tokenURI!.startsWith('ipfs://')
          ? tokenURI!.replace('ipfs://', 'https://ipfs.io/ipfs/')
          : tokenURI!;

        const response = await fetch(url);
        const json = (await response.json()) as {
          name?: string;
          image?: string;
          attributes?: Array<{ trait_type?: string; value?: string }>;
        };

        if (cancelled) return;

        const traits =
          json.attributes
            ?.map((a) => a.value)
            .filter((v): v is string => !!v) ?? [];

        let image = json.image ?? '';
        if (image.startsWith('ipfs://')) {
          image = image.replace('ipfs://', 'https://ipfs.io/ipfs/');
        }

        setMetadata({
          tokenId: tokenId!,
          name: json.name ?? `Gun #${tokenId}`,
          image,
          stats: getStatsForToken(tokenId!),
          traits,
          canBattle: !traits.includes('Jammy Pasty'),
        });
      } catch (err: unknown) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Failed to fetch metadata'
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchMeta();
    return () => {
      cancelled = true;
    };
  }, [tokenId, tokenURI]);

  return { metadata, isLoading, error };
}
