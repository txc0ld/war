import { keccak256, encodePacked } from 'viem';

function deterministicRandom(seed: string, index: number): number {
  const hash = keccak256(
    encodePacked(['string', 'uint256'], [seed, BigInt(index)])
  );
  const slice = hash.slice(2, 10);
  return parseInt(slice, 16) / 0xffffffff;
}

export function createDeterministicRandom(seed: string): (index: number) => number {
  return (index: number) => deterministicRandom(seed, index);
}

export function createSecureBattleSeed(context: string): string {
  const entropy = new Uint32Array(4);
  globalThis.crypto.getRandomValues(entropy);

  return keccak256(
    encodePacked(
      ['string', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256'],
      [
        context,
        BigInt(entropy[0] ?? 0),
        BigInt(entropy[1] ?? 0),
        BigInt(entropy[2] ?? 0),
        BigInt(entropy[3] ?? 0),
        BigInt(Date.now()),
      ]
    )
  );
}
