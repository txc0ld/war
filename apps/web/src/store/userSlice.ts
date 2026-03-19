import type { GunMetadata } from '@warpath/shared';

export interface UserSlice {
  address: string | null;
  guns: GunMetadata[];
  score: number;
  setAddress: (address: string | null) => void;
  setGuns: (guns: GunMetadata[]) => void;
  setScore: (score: number) => void;
}

export function createUserSlice(
  set: (partial: Partial<UserSlice>) => void
): UserSlice {
  return {
    address: null,
    guns: [],
    score: 0,
    setAddress: (address: string | null) => set({ address }),
    setGuns: (guns: GunMetadata[]) => set({ guns }),
    setScore: (score: number) => set({ score }),
  };
}
