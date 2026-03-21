import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';
import { DEMO_MODE } from '@/lib/demo';

const alchemyId = import.meta.env.VITE_ALCHEMY_ID;
const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;
const transports = {
  [mainnet.id]: http(
    alchemyId
      ? `https://eth-mainnet.g.alchemy.com/v2/${alchemyId}`
      : undefined
  ),
};

const liveConnectors = [
  ...(walletConnectProjectId
    ? [
        walletConnect({
          projectId: walletConnectProjectId,
          showQrModal: true,
          metadata: {
            name: 'War Room',
            description: 'War Room NFT battle arena',
            url:
              typeof window !== 'undefined'
                ? window.location.origin
                : 'https://the-warroom.vercel.app',
            icons: ['https://the-warroom.vercel.app/favicon.svg'],
          },
        }),
      ]
    : []),
  injected(),
];

const liveConfig = createConfig({
  chains: [mainnet],
  connectors: liveConnectors,
  transports,
});

const demoConfig = createConfig({
  chains: [mainnet],
  connectors: [],
  transports,
});

const queryClient = new QueryClient();

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps): ReactNode {
  return (
    <WagmiProvider config={DEMO_MODE ? demoConfig : liveConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
