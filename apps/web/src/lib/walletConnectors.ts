export interface WalletConnectorLike {
  id: string;
}

export interface NavigatorLike {
  maxTouchPoints?: number;
  userAgent?: string;
}

export interface WalletProviderLike {
  isApexWallet?: boolean;
  isBitKeep?: boolean;
  isBlockWallet?: boolean;
  isBraveWallet?: boolean;
  isCoinbaseWallet?: boolean;
  isKuCoinWallet?: boolean;
  isMathWallet?: boolean;
  isMetaMask?: boolean;
  isOkxWallet?: boolean;
  isOKExWallet?: boolean;
  isOneInchAndroidWallet?: boolean;
  isOneInchIOSWallet?: boolean;
  isOpera?: boolean;
  isPhantom?: boolean;
  isPortal?: boolean;
  isRabby?: boolean;
  isTokenPocket?: boolean;
  isTokenary?: boolean;
  isUniswapWallet?: boolean;
  isZerion?: boolean;
  providers?: WalletProviderLike[];
  _events?: unknown;
  _state?: unknown;
}

export interface WalletConnectResolutionOptions<T extends WalletConnectorLike> {
  connectors: readonly T[];
  detectedInjectedWalletIds: ReadonlySet<string>;
  isMobile: boolean;
}

const DESKTOP_INJECTED_CONNECTOR_IDS = [
  'metaMask',
  'rabby',
  'coinbaseWallet',
  'injected',
];
const MOBILE_INJECTED_CONNECTOR_IDS = [
  'metaMask',
  'coinbaseWallet',
  'rabby',
  'injected',
];
const MOBILE_APP_SWITCH_CONNECTOR_IDS = [
  'walletConnect',
  ...MOBILE_INJECTED_CONNECTOR_IDS,
];

function isMetaMaskProvider(provider: WalletProviderLike): boolean {
  if (!provider.isMetaMask) {
    return false;
  }

  if (provider.isBraveWallet && !provider._events && !provider._state) {
    return false;
  }

  return !(
    provider.isApexWallet ||
    provider.isBitKeep ||
    provider.isBlockWallet ||
    provider.isKuCoinWallet ||
    provider.isMathWallet ||
    provider.isOkxWallet ||
    provider.isOKExWallet ||
    provider.isOneInchAndroidWallet ||
    provider.isOneInchIOSWallet ||
    provider.isOpera ||
    provider.isPhantom ||
    provider.isPortal ||
    provider.isRabby ||
    provider.isTokenPocket ||
    provider.isTokenary ||
    provider.isUniswapWallet ||
    provider.isZerion
  );
}

function collectProviders(provider?: WalletProviderLike | null): WalletProviderLike[] {
  if (!provider) {
    return [];
  }

  if (Array.isArray(provider.providers) && provider.providers.length > 0) {
    return provider.providers;
  }

  return [provider];
}

function orderConnectors<T extends WalletConnectorLike>(
  connectors: readonly T[],
  priorityIds: readonly string[]
): T[] {
  const remaining = [...connectors];
  const ordered: T[] = [];

  for (const priorityId of priorityIds) {
    const index = remaining.findIndex((connector) => connector.id === priorityId);

    if (index >= 0) {
      const connector = remaining[index];

      if (connector) {
        ordered.push(connector);
      }

      remaining.splice(index, 1);
    }
  }

  return [...ordered, ...remaining];
}

export function detectInjectedWalletIds(
  provider?: WalletProviderLike | null
): Set<string> {
  const detected = new Set<string>();
  const providers = collectProviders(provider);

  for (const candidate of providers) {
    detected.add('injected');

    if (isMetaMaskProvider(candidate)) {
      detected.add('metaMask');
    }

    if (candidate.isCoinbaseWallet) {
      detected.add('coinbaseWallet');
    }

    if (candidate.isRabby) {
      detected.add('rabby');
    }
  }

  return detected;
}

export function isMobileWalletClient(
  navigatorLike?: NavigatorLike | null
): boolean {
  if (!navigatorLike) {
    return false;
  }

  const userAgent = navigatorLike.userAgent ?? '';
  const maxTouchPoints = navigatorLike.maxTouchPoints ?? 0;

  if (/android|iphone|ipod|iemobile|mobile/i.test(userAgent)) {
    return true;
  }

  return (
    /ipad/i.test(userAgent) ||
    (/macintosh/i.test(userAgent) && maxTouchPoints > 1)
  );
}

export function resolveWalletConnectors<T extends WalletConnectorLike>({
  connectors,
  detectedInjectedWalletIds,
  isMobile,
}: WalletConnectResolutionOptions<T>): T[] {
  if (isMobile) {
    return orderConnectors(
      connectors,
      detectedInjectedWalletIds.size > 0
        ? MOBILE_INJECTED_CONNECTOR_IDS
        : MOBILE_APP_SWITCH_CONNECTOR_IDS
    );
  }

  return orderConnectors(
    connectors.filter((connector) => connector.id !== 'walletConnect'),
    DESKTOP_INJECTED_CONNECTOR_IDS
  );
}
