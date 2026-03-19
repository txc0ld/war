import { type ReactNode } from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { mainnet, base } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  RainbowKitProvider,
  darkTheme,
  getDefaultConfig,
} from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { DEMO_MODE } from '@/lib/demo';

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'placeholder';
const alchemyId = import.meta.env.VITE_ALCHEMY_ID;
const transports = {
  [mainnet.id]: http(
    alchemyId
      ? `https://eth-mainnet.g.alchemy.com/v2/${alchemyId}`
      : undefined
  ),
  [base.id]: http(
    alchemyId
      ? `https://base-mainnet.g.alchemy.com/v2/${alchemyId}`
      : undefined
  ),
};

const demoConfig = createConfig({
  chains: [mainnet, base],
  connectors: [],
  transports,
});

const queryClient = new QueryClient();

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps): ReactNode {
  if (DEMO_MODE) {
    return (
      <WagmiProvider config={demoConfig}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </WagmiProvider>
    );
  }

  const liveConfig = getDefaultConfig({
    appName: 'WAR PATH',
    projectId,
    chains: [mainnet, base],
    transports,
  });

  return (
    <WagmiProvider config={liveConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#00F0FF',
            accentColorForeground: '#000000',
            borderRadius: 'none',
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
