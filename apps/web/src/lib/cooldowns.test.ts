import { beforeEach, describe, expect, it } from 'vitest';
import {
  applyBattleCooldowns,
  applyWalletCooldown,
  formatCooldownLabel,
  getCooldownDurationMs,
  getCooldownRemainingMs,
  readWalletCooldownExpiry,
} from './cooldowns';

function createStorageMock(): Storage {
  let store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear() {
      store = new Map<string, string>();
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

describe('wallet cooldowns', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: createStorageMock(),
      configurable: true,
      writable: true,
    });
  });

  it('uses a 15 minute cooldown for 3+ gun holders', () => {
    const now = Date.now();
    const expiresAt = applyWalletCooldown('0xabc', 3, now);

    expect(getCooldownDurationMs(3)).toBe(15 * 60 * 1000);
    expect(expiresAt).toBe(now + 15 * 60 * 1000);
    expect(readWalletCooldownExpiry('0xabc', now)).toBe(expiresAt);
    expect(formatCooldownLabel(getCooldownRemainingMs(expiresAt, now))).toBe('15M');
  });

  it('uses a 30 minute cooldown for wallets below 3 guns', () => {
    const now = Date.now();
    const expiresAt = applyWalletCooldown('0xdef', 2, now);

    expect(getCooldownDurationMs(2)).toBe(30 * 60 * 1000);
    expect(expiresAt).toBe(now + 30 * 60 * 1000);
    expect(readWalletCooldownExpiry('0xdef', now)).toBe(expiresAt);
  });

  it('applies battle cooldowns per wallet with participant gun counts', () => {
    const now = Date.now();

    applyBattleCooldowns(
      [
        { address: '0xleft', gunCount: 4 },
        { address: '0xright', gunCount: 1 },
      ],
      now
    );

    expect(readWalletCooldownExpiry('0xleft', now)).toBe(now + 15 * 60 * 1000);
    expect(readWalletCooldownExpiry('0xright', now)).toBe(now + 30 * 60 * 1000);
  });
});
