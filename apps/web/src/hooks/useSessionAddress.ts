import { useAccount } from 'wagmi';
import { DEMO_MODE } from '@/lib/demo';
import { useStore } from '@/store';

export function useSessionAddress(): string | null {
  const demoAddress = useStore((state) => state.address);
  const { address, isConnected } = useAccount();

  if (DEMO_MODE) {
    return demoAddress;
  }

  return isConnected && address ? address : null;
}
