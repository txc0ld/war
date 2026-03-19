import { mainnet, base } from 'wagmi/chains';
import { CHAIN_IDS } from '@warpath/shared';

export function getTargetChain(): typeof mainnet | typeof base {
  const chainId = Number(
    import.meta.env.VITE_TARGET_CHAIN ?? CHAIN_IDS.MAINNET
  );
  return chainId === CHAIN_IDS.BASE ? base : mainnet;
}

export { mainnet, base };
