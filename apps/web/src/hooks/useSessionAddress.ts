import { useAccount } from 'wagmi';

export function useSessionAddress(): string | null {
  const { address, isConnected } = useAccount();

  return isConnected && address ? address : null;
}
