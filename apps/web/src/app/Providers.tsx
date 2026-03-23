import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { injected, walletConnect } from 'wagmi/connectors';
import { CHAIN_IDS } from '@warpath/shared';
import { getTargetChain } from '@/lib/chains';
import { base, mainnet } from 'wagmi/chains';

const alchemyId = import.meta.env.VITE_ALCHEMY_ID?.trim();
const walletConnectProjectId =
  import.meta.env.VITE_WALLETCONNECT_PROJECT_ID?.trim();
const configuredSiteUrl =
  import.meta.env.VITE_SITE_URL?.trim() || 'https://www.glocksandnode.xyz';
const siteUrl =
  typeof window !== 'undefined'
    ? window.location.origin
    : configuredSiteUrl;
const targetChain = getTargetChain();
const alchemyRpcUrl = alchemyId
  ? targetChain.id === CHAIN_IDS.BASE
    ? `https://base-mainnet.g.alchemy.com/v2/${alchemyId}`
    : `https://eth-mainnet.g.alchemy.com/v2/${alchemyId}`
  : undefined;
const transports = {
  [mainnet.id]: http(
    alchemyId ? `https://eth-mainnet.g.alchemy.com/v2/${alchemyId}` : undefined
  ),
  [base.id]: http(
    alchemyId ? `https://base-mainnet.g.alchemy.com/v2/${alchemyId}` : undefined
  ),
} as const;

const walletConnectFeaturedWalletIds = [
  'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
  'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa', // Coinbase Wallet / Base
  '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
  '18388be9ac2d02726dbac9777c96efaac06d744b2f6d580fccdd4127a6d01fd1', // Rabby
] as const;

const liveConnectors = [
  injected({
    shimDisconnect: true,
    target: 'metaMask',
  }),
  injected({
    shimDisconnect: true,
    target: 'coinbaseWallet',
  }),
  injected({
    shimDisconnect: true,
    target: {
      id: 'rabby',
      name: 'Rabby',
      provider: 'isRabby',
    },
  }),
  injected({
    shimDisconnect: true,
  }),
  ...(walletConnectProjectId
    ? [
        walletConnect({
          projectId: walletConnectProjectId,
          showQrModal: true,
          metadata: {
            name: 'WAR ROOM',
            description: 'Glocks + Nodes',
            url: siteUrl,
            icons: [`${siteUrl}/branding/header.png`],
          },
          qrModalOptions: {
            enableExplorer: true,
            explorerRecommendedWalletIds: [
              ...walletConnectFeaturedWalletIds,
            ],
            themeMode: 'dark',
            themeVariables: {
              '--wcm-accent-color': '#00BDFE',
              '--wcm-background-color': '#0a0d13',
              '--wcm-overlay-background-color': 'rgba(0, 0, 0, 0.78)',
              '--wcm-font-family': '"Plus Jakarta Sans", sans-serif',
            },
          },
        }),
      ]
    : []),
];

const liveConfig = createConfig({
  chains: [targetChain],
  connectors: liveConnectors,
  transports,
  multiInjectedProviderDiscovery: true,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps): ReactNode {
  return (
    <WagmiProvider config={liveConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
