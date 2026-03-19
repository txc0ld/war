import type { GunMetadata } from '@warpath/shared';

export interface GameSlice {
  selectedCountry: string | null;
  selectedGun: GunMetadata | null;
  showGunSelector: boolean;
  selectCountry: (code: string) => void;
  clearCountry: () => void;
  selectGun: (gun: GunMetadata) => void;
  clearGun: () => void;
  openGunSelector: () => void;
  closeGunSelector: () => void;
}

export function createGameSlice(
  set: (partial: Partial<GameSlice>) => void
): GameSlice {
  return {
    selectedCountry: null,
    selectedGun: null,
    showGunSelector: false,
    selectCountry: (code: string) =>
      set({ selectedCountry: code, showGunSelector: true }),
    clearCountry: () =>
      set({ selectedCountry: null, showGunSelector: false }),
    selectGun: (gun: GunMetadata) =>
      set({ selectedGun: gun, showGunSelector: false }),
    clearGun: () => set({ selectedGun: null }),
    openGunSelector: () => set({ showGunSelector: true }),
    closeGunSelector: () => set({ showGunSelector: false }),
  };
}
