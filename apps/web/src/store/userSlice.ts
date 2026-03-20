import type { GunMetadata } from '@warpath/shared';
import {
  applyWalletCooldown,
  readWalletCooldownExpiry,
  writeWalletCooldownExpiry,
} from '@/lib/cooldowns';

export interface UserSlice {
  address: string | null;
  guns: GunMetadata[];
  score: number;
  walletCooldownExpiresAt: number | null;
  setAddress: (address: string | null) => void;
  setGuns: (guns: GunMetadata[]) => void;
  setScore: (score: number) => void;
  refreshWalletCooldown: () => void;
  setWalletCooldown: (expiresAt?: number | null) => void;
}

export function createUserSlice(
  set: (
    partial: Partial<UserSlice> | ((state: UserSlice) => Partial<UserSlice>)
  ) => void,
  get: () => UserSlice
): UserSlice {
  return {
    address: null,
    guns: [],
    score: 0,
    walletCooldownExpiresAt: null,
    setAddress: (address: string | null) =>
      set({
        address,
        walletCooldownExpiresAt: readWalletCooldownExpiry(address),
      }),
    setGuns: (guns: GunMetadata[]) => set({ guns }),
    setScore: (score: number) => set({ score }),
    refreshWalletCooldown: () => {
      const { address } = get();
      set({ walletCooldownExpiresAt: readWalletCooldownExpiry(address) });
    },
    setWalletCooldown: (expiresAt?: number | null) => {
      const { address, guns } = get();
      const nextCooldown =
        expiresAt !== undefined
          ? expiresAt
          : applyWalletCooldown(address, guns.length);

      if (expiresAt !== undefined) {
        writeWalletCooldownExpiry(address, nextCooldown);
      }

      set({ walletCooldownExpiresAt: nextCooldown });
    },
  };
}
