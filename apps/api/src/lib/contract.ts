import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';

const rpcUrl = process.env['RPC_URL'] ?? undefined;

export const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(rpcUrl),
});
