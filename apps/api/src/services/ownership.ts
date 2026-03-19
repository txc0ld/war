import { getAddress } from 'viem';
import { GN_ABI, GN_CONTRACT_ADDRESS } from '@warpath/shared';
import { publicClient } from '../lib/contract';

export async function verifyTokenOwnership(
  address: `0x${string}`,
  tokenId: number
): Promise<boolean> {
  try {
    const owner = await publicClient.readContract({
      address: GN_CONTRACT_ADDRESS,
      abi: GN_ABI,
      functionName: 'ownerOf',
      args: [BigInt(tokenId)],
    });

    return getAddress(owner) === getAddress(address);
  } catch {
    return false;
  }
}
