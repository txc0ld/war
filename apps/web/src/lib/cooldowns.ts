const SHORT_COOLDOWN_DURATION_MS = 15 * 60 * 1000;
const STANDARD_COOLDOWN_DURATION_MS = 30 * 60 * 1000;
const STORAGE_PREFIX = 'war-room.wallet-cooldowns';

function getStorageKey(address: string): string {
  return `${STORAGE_PREFIX}.${address.toLowerCase()}`;
}

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function normalizeExpiry(expiresAt: number | null, now = Date.now()): number | null {
  if (!expiresAt || expiresAt <= now) {
    return null;
  }

  return expiresAt;
}

export function getCooldownDurationMs(gunCount: number): number {
  return gunCount >= 3
    ? SHORT_COOLDOWN_DURATION_MS
    : STANDARD_COOLDOWN_DURATION_MS;
}

export function readWalletCooldownExpiry(
  address: string | null,
  now = Date.now()
): number | null {
  if (!address || !canUseStorage()) {
    return null;
  }

  const raw = window.localStorage.getItem(getStorageKey(address));
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as { expiresAt?: number };
    const normalized = normalizeExpiry(parsed.expiresAt ?? null, now);

    if (!normalized) {
      window.localStorage.removeItem(getStorageKey(address));
    }

    return normalized;
  } catch {
    window.localStorage.removeItem(getStorageKey(address));
    return null;
  }
}

export function writeWalletCooldownExpiry(
  address: string | null,
  expiresAt: number | null
): void {
  if (!address || !canUseStorage()) {
    return;
  }

  const normalized = normalizeExpiry(expiresAt);

  if (!normalized) {
    window.localStorage.removeItem(getStorageKey(address));
    return;
  }

  window.localStorage.setItem(
    getStorageKey(address),
    JSON.stringify({ expiresAt: normalized })
  );
}

export function applyWalletCooldown(
  address: string | null,
  gunCount: number,
  now = Date.now()
): number | null {
  if (!address) {
    return null;
  }

  const expiresAt = now + getCooldownDurationMs(gunCount);
  writeWalletCooldownExpiry(address, expiresAt);
  return expiresAt;
}

export function applyBattleCooldowns(
  participants: Array<{ address: string | null; gunCount: number }>,
  now = Date.now()
): void {
  participants.forEach(({ address, gunCount }) => {
    applyWalletCooldown(address, gunCount, now);
  });
}

export function getCooldownRemainingMs(
  expiresAt: number | null,
  now = Date.now()
): number {
  if (!expiresAt) {
    return 0;
  }

  return Math.max(0, expiresAt - now);
}

export function isWalletOnCooldown(
  address: string | null,
  now = Date.now()
): boolean {
  return getCooldownRemainingMs(readWalletCooldownExpiry(address, now), now) > 0;
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
