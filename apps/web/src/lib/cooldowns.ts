import type { Battle } from '@warpath/shared';

const COOLDOWN_DURATION_MS = 30 * 60 * 1000;
const STORAGE_PREFIX = 'war-room.weapon-cooldowns';

export type WeaponCooldowns = Record<number, number>;

function getStorageKey(address: string): string {
  return `${STORAGE_PREFIX}.${address.toLowerCase()}`;
}

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function normalizeCooldowns(
  cooldowns: WeaponCooldowns,
  now = Date.now()
): WeaponCooldowns {
  return Object.fromEntries(
    Object.entries(cooldowns).filter(([, expiresAt]) => expiresAt > now)
  );
}

export function readWeaponCooldowns(
  address: string | null,
  now = Date.now()
): WeaponCooldowns {
  if (!address || !canUseStorage()) {
    return {};
  }

  const raw = window.localStorage.getItem(getStorageKey(address));
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as WeaponCooldowns;
    const normalized = normalizeCooldowns(parsed, now);

    if (Object.keys(normalized).length !== Object.keys(parsed).length) {
      writeWeaponCooldowns(address, normalized);
    }

    return normalized;
  } catch {
    return {};
  }
}

export function writeWeaponCooldowns(
  address: string | null,
  cooldowns: WeaponCooldowns
): void {
  if (!address || !canUseStorage()) {
    return;
  }

  const normalized = normalizeCooldowns(cooldowns);

  if (Object.keys(normalized).length === 0) {
    window.localStorage.removeItem(getStorageKey(address));
    return;
  }

  window.localStorage.setItem(getStorageKey(address), JSON.stringify(normalized));
}

export function applyWeaponCooldown(
  address: string | null,
  tokenId: number,
  now = Date.now()
): WeaponCooldowns {
  const current = readWeaponCooldowns(address, now);
  const next = {
    ...current,
    [tokenId]: now + COOLDOWN_DURATION_MS,
  };

  writeWeaponCooldowns(address, next);
  return next;
}

export function applyBattleCooldowns(
  battle: Battle,
  now = Date.now()
): void {
  applyWeaponCooldown(battle.left.address, battle.left.tokenId, now);
  applyWeaponCooldown(battle.right.address, battle.right.tokenId, now);
}

export function getCooldownRemainingMs(
  cooldowns: WeaponCooldowns,
  tokenId: number,
  now = Date.now()
): number {
  const expiresAt = cooldowns[tokenId];
  if (!expiresAt) {
    return 0;
  }

  return Math.max(0, expiresAt - now);
}

export function isWeaponOnCooldown(
  address: string | null,
  tokenId: number,
  now = Date.now()
): boolean {
  return getCooldownRemainingMs(readWeaponCooldowns(address, now), tokenId, now) > 0;
}

export function formatCooldownLabel(remainingMs: number): string {
  const totalMinutes = Math.max(1, Math.ceil(remainingMs / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours}H ${minutes.toString().padStart(2, '0')}M`;
  }

  return `${totalMinutes}M`;
}

export function getCooldownDurationMs(): number {
  return COOLDOWN_DURATION_MS;
}
