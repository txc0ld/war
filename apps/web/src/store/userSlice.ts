import type { GunMetadata } from '@warpath/shared';
import {
  applyWeaponCooldown,
  readWeaponCooldowns,
  writeWeaponCooldowns,
  type WeaponCooldowns,
} from '@/lib/cooldowns';

export interface UserSlice {
  address: string | null;
  guns: GunMetadata[];
  score: number;
  weaponCooldowns: WeaponCooldowns;
  setAddress: (address: string | null) => void;
  setGuns: (guns: GunMetadata[]) => void;
  setScore: (score: number) => void;
  refreshWeaponCooldowns: () => void;
  setWeaponCooldown: (tokenId: number, expiresAt?: number) => void;
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
    weaponCooldowns: {},
    setAddress: (address: string | null) =>
      set({
        address,
        weaponCooldowns: readWeaponCooldowns(address),
      }),
    setGuns: (guns: GunMetadata[]) => set({ guns }),
    setScore: (score: number) => set({ score }),
    refreshWeaponCooldowns: () => {
      const { address } = get();
      set({ weaponCooldowns: readWeaponCooldowns(address) });
    },
    setWeaponCooldown: (tokenId: number, expiresAt?: number) => {
      const { address, weaponCooldowns } = get();
      const nextCooldowns =
        expiresAt !== undefined
          ? {
              ...weaponCooldowns,
              [tokenId]: expiresAt,
            }
          : applyWeaponCooldown(address, tokenId);

      if (expiresAt !== undefined) {
        writeWeaponCooldowns(address, nextCooldowns);
      }

      set({ weaponCooldowns: nextCooldowns });
    },
  };
}
