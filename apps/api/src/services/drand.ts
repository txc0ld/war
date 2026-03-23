import {
  fetchBeacon,
  HttpCachingChain,
  HttpChainClient,
} from 'drand-client';
import { BATTLE_CONFIG, DRAND_QUICKNET } from '@warpath/shared';

const DRAND_OPTIONS = {
  disableBeaconVerification: false,
  noCache: true,
  chainVerificationParams: {
    chainHash: DRAND_QUICKNET.chainHash,
    publicKey: DRAND_QUICKNET.publicKey,
  },
} as const;

export class DrandRoundUnavailableError extends Error {
  constructor(public readonly round: number) {
    super(`Drand round ${round} is not available yet`);
    this.name = 'DrandRoundUnavailableError';
  }
}

export function roundAtTime(unixTimestampSeconds: number): number {
  return (
    Math.floor(
      (unixTimestampSeconds - DRAND_QUICKNET.genesisTime) /
        DRAND_QUICKNET.periodSeconds
    ) + 1
  );
}

export function timeOfRound(round: number): number {
  return (
    DRAND_QUICKNET.genesisTime + (round - 1) * DRAND_QUICKNET.periodSeconds
  );
}

export function futureRound(nowMs = Date.now()): number {
  const futureSeconds =
    Math.floor(nowMs / 1000) + BATTLE_CONFIG.FUTURE_DRAND_OFFSET_SECONDS;
  return roundAtTime(futureSeconds);
}

export function estimatedResolveTimeIso(round: number): string {
  return new Date(timeOfRound(round) * 1000).toISOString();
}

function normalizeHex(value: string): string {
  return value.startsWith('0x') ? value.toLowerCase() : value.toLowerCase();
}

async function fetchBeaconFromRelay(round: number, relay: string) {
  const chain = new HttpCachingChain(
    `${relay}/${DRAND_QUICKNET.chainHash}`,
    DRAND_OPTIONS
  );
  const client = new HttpChainClient(chain, DRAND_OPTIONS);
  return fetchBeacon(client, round);
}

async function fetchRawBeaconFromRelay(round: number, relay: string) {
  const response = await fetch(
    `${relay}/${DRAND_QUICKNET.chainHash}/public/${round}`,
    {
      signal: AbortSignal.timeout(5_000),
    }
  );

  if (response.status === 404) {
    throw new DrandRoundUnavailableError(round);
  }

  if (!response.ok) {
    throw new Error(`Drand relay ${relay} returned ${response.status}`);
  }

  return (await response.json()) as {
    round: number;
    randomness: string;
    signature: string;
  };
}

export async function fetchVerifiedDrandRound(round: number): Promise<{
  round: number;
  randomness: string;
  signature: string;
  relaysChecked: string[];
}> {
  const relaysChecked: string[] = [];
  let lastError: unknown;

  for (const relay of DRAND_QUICKNET.relays) {
    try {
      const verifiedBeacon = await fetchBeaconFromRelay(round, relay);
      const randomness = normalizeHex(verifiedBeacon.randomness);
      const signature = normalizeHex(verifiedBeacon.signature);

      relaysChecked.push(relay);

      for (const secondary of DRAND_QUICKNET.relays) {
        if (secondary === relay) {
          continue;
        }

        try {
          const secondaryBeacon = await fetchRawBeaconFromRelay(round, secondary);
          if (
            normalizeHex(secondaryBeacon.randomness) === randomness &&
            normalizeHex(secondaryBeacon.signature) === signature
          ) {
            relaysChecked.push(secondary);
          }
        } catch (secondaryError) {
          if (secondaryError instanceof DrandRoundUnavailableError) {
            throw secondaryError;
          }
        }
      }

      return {
        round,
        randomness,
        signature,
        relaysChecked: Array.from(new Set(relaysChecked)),
      };
    } catch (error) {
      lastError = error;
      if (error instanceof DrandRoundUnavailableError) {
        throw error;
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`Failed to fetch drand round ${round}`);
}
