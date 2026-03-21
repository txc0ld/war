import { useCallback } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { DEMO_MODE, DEMO_PLAYER_ADDRESS } from '@/lib/demo';
import { useStore } from '@/store';

function shortenAddress(value: string): string {
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

export function ConnectButton(): React.ReactNode {
  const { address, isConnected, isConnecting } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { address: demoAddress, setAddress } = useStore();

  const handleConnect = useCallback(() => {
    if (DEMO_MODE) {
      setAddress(DEMO_PLAYER_ADDRESS);
      return;
    }

    const hasInjectedProvider =
      typeof window !== 'undefined' && 'ethereum' in window;
    const connector =
      (hasInjectedProvider
        ? connectors.find((candidate) => candidate.id === 'injected')
        : undefined) ??
      connectors.find((candidate) => candidate.id === 'walletConnect') ??
      connectors[0];

    if (connector) {
      connect({ connector });
    }
  }, [connect, connectors, setAddress]);

  const handleDisconnect = useCallback(() => {
    if (DEMO_MODE) {
      setAddress(null);
      return;
    }

    disconnect();
  }, [disconnect, setAddress]);

  const activeAddress = DEMO_MODE ? demoAddress : address;
  const connected = DEMO_MODE ? Boolean(demoAddress) : isConnected;

  if (connected && activeAddress) {
    return (
      <button
        type="button"
        className="warpath-button warpath-button--outline"
        onClick={handleDisconnect}
      >
        {shortenAddress(activeAddress)}
      </button>
    );
  }

  return (
    <button
      type="button"
      className="warpath-button"
      onClick={handleConnect}
      disabled={isConnecting || isPending}
    >
      {isConnecting || isPending ? 'CONNECTING…' : 'CONNECT WALLET'}
    </button>
  );
}
