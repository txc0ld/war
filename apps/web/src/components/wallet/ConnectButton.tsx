import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { getProfile } from '@/lib/api';
import {
  detectInjectedWalletIds,
  isMobileWalletClient,
  resolveWalletConnectors,
} from '@/lib/walletConnectors';

function shortenAddress(value: string): string {
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

export function ConnectButton(): React.ReactNode {
  const { address, isConnected, isConnecting } = useAccount();
  const { connectAsync, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const profileQuery = useQuery({
    queryKey: ['profile', address],
    queryFn: async () => {
      if (!address) {
        return null;
      }

      return getProfile(address);
    },
    enabled: isConnected && !!address,
    staleTime: 30_000,
  });

  const connectorState = useMemo(() => {
    const detectedInjectedWalletIds =
      typeof window !== 'undefined'
        ? detectInjectedWalletIds(
            (window as Window & { ethereum?: unknown }).ethereum as
              | Parameters<typeof detectInjectedWalletIds>[0]
              | undefined
          )
        : new Set<string>();
    const isMobile =
      typeof navigator !== 'undefined' && isMobileWalletClient(navigator);

    return {
      availableConnectors: resolveWalletConnectors({
        connectors,
        detectedInjectedWalletIds,
        isMobile,
      }),
      detectedInjectedWalletIds,
      isMobile,
    };
  }, [connectors]);

  const { availableConnectors } = connectorState;
  const preferredConnector = availableConnectors[0] ?? null;

  const handleConnect = useCallback(async () => {
    if (!preferredConnector) {
      return;
    }

    try {
      await connectAsync({ connector: preferredConnector });
    } catch (connectError) {
      const message =
        connectError instanceof Error
          ? connectError.message
          : String(connectError);

      if (/user rejected/i.test(message)) {
        return;
      }

      throw connectError;
    }
  }, [connectAsync, preferredConnector]);

  const handleDisconnect = useCallback(() => {
    disconnect();
  }, [disconnect]);

  const identityLabel =
    profileQuery.data?.displayName?.trim() ||
    profileQuery.data?.ensName?.trim() ||
    (address ? shortenAddress(address) : null);

  if (isConnected && address) {
    return (
      <button
        type="button"
        className="warpath-button warpath-button--outline"
        onClick={handleDisconnect}
      >
        {identityLabel}
      </button>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        className="warpath-button"
        onClick={handleConnect}
        disabled={isConnecting || isPending || !preferredConnector}
      >
        {isConnecting || isPending ? 'CONNECTING…' : 'CONNECT WALLET'}
      </button>
      {!preferredConnector ? (
        <p className="m-0 text-center text-sm text-[#ff4f4f]">
          No supported wallet connector is configured for this browser.
        </p>
      ) : null}
      {error && !/user rejected/i.test(error.message) ? (
        <p className="m-0 text-center text-sm text-[#ff4f4f]">{error.message}</p>
      ) : null}
    </div>
  );
}
