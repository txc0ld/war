import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';
import { DEMO_MODE } from '@/lib/demo';

const alchemyId = import.meta.env.VITE_ALCHEMY_ID;
const transports = {
  [mainnet.id]: http(
    alchemyId
      ? `https://eth-mainnet.g.alchemy.com/v2/${alchemyId}`
      : undefined
  ),
};

const liveConfig = createConfig({
  chains: [mainnet],
  connectors: [injected()],
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
