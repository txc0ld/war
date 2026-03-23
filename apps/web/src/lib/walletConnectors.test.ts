import { describe, expect, it } from 'vitest';
import {
  detectInjectedWalletIds,
  isMobileWalletClient,
  resolveWalletConnectors,
  type WalletConnectorLike,
  type WalletProviderLike,
} from './walletConnectors';

const connectors: WalletConnectorLike[] = [
  { id: 'metaMask' },
  { id: 'rabby' },
  { id: 'coinbaseWallet' },
  { id: 'injected' },
  { id: 'walletConnect' },
];

describe('injected wallet detection', () => {
  it('detects MetaMask without mistaking Rabby-style providers for MetaMask', () => {
    const provider: WalletProviderLike = {
      providers: [{ isMetaMask: true }, { isMetaMask: true, isRabby: true }],
    };

    const detected = detectInjectedWalletIds(provider);

    expect([...detected]).toEqual(['injected', 'metaMask', 'rabby']);
  });

  it('detects Coinbase Wallet and Rabby providers', () => {
    const provider: WalletProviderLike = {
      providers: [{ isCoinbaseWallet: true }, { isRabby: true }],
    };

    const detected = detectInjectedWalletIds(provider);

    expect([...detected]).toEqual(['injected', 'coinbaseWallet', 'rabby']);
  });
});

describe('wallet connector routing', () => {
  it('prefers injected extensions on desktop when they exist', () => {
    const ordered = resolveWalletConnectors({
      connectors,
      detectedInjectedWalletIds: new Set(['injected', 'metaMask', 'rabby']),
      isMobile: false,
    });

    expect(ordered.map((connector) => connector.id).slice(0, 4)).toEqual([
      'metaMask',
      'rabby',
      'coinbaseWallet',
      'injected',
    ]);
  });

  it('prefers injected-compatible connectors on mobile without SDK fallbacks', () => {
    const ordered = resolveWalletConnectors({
      connectors,
      detectedInjectedWalletIds: new Set(),
      isMobile: true,
    });

    expect(ordered.map((connector) => connector.id).slice(0, 5)).toEqual([
      'walletConnect',
      'metaMask',
      'coinbaseWallet',
      'rabby',
      'injected',
    ]);
  });

  it('removes WalletConnect from desktop priority so extensions stay first', () => {
    const ordered = resolveWalletConnectors({
      connectors,
      detectedInjectedWalletIds: new Set(),
      isMobile: false,
    });

    expect(ordered.map((connector) => connector.id)).not.toContain(
      'walletConnect'
    );
  });

  it('prefers injected wallet browsers on mobile when already inside one', () => {
    const ordered = resolveWalletConnectors({
      connectors,
      detectedInjectedWalletIds: new Set(['injected', 'metaMask']),
      isMobile: true,
    });

    expect(ordered.map((connector) => connector.id).slice(0, 4)).toEqual([
      'metaMask',
      'coinbaseWallet',
      'rabby',
      'injected',
    ]);
  });
});

describe('mobile wallet client detection', () => {
  it('detects standard mobile user agents', () => {
    expect(
      isMobileWalletClient({
        userAgent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
      })
    ).toBe(true);
  });

  it('detects iPad desktop mode via touch points', () => {
    expect(
      isMobileWalletClient({
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15',
        maxTouchPoints: 5,
      })
    ).toBe(true);
  });

  it('leaves desktop browsers as desktop', () => {
    expect(
      isMobileWalletClient({
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15',
        maxTouchPoints: 0,
      })
    ).toBe(false);
  });
});
