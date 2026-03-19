import { GN_CONTRACT_ADDRESS, GN_ABI } from '@warpath/shared';

export { GN_CONTRACT_ADDRESS, GN_ABI };

export const CONTRACT_CONFIG = {
  address: GN_CONTRACT_ADDRESS,
  abi: GN_ABI,
} as const;
