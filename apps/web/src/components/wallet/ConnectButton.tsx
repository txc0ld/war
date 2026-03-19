import { ConnectButton as RainbowConnectButton } from '@rainbow-me/rainbowkit';
import { cn } from '@/lib/cn';
import { DEMO_MODE } from '@/lib/demo';

export function ConnectButton(): React.ReactNode {
  if (DEMO_MODE) {
    return (
      <div
        className={cn(
          'rounded-full font-mono text-xs uppercase tracking-[0.24em]',
          'border border-accent-cyan/30 bg-accent-cyan/10 px-4 py-2.5',
          'text-accent-cyan shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
        )}
      >
        Demo Arsenal
      </div>
    );
  }

  return (
    <RainbowConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none' as const,
                userSelect: 'none' as const,
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    type="button"
                    className={cn(
                      'rounded-full font-mono text-sm uppercase tracking-widest',
                      'border border-accent-cyan bg-bg-primary px-6 py-3',
                      'text-accent-cyan',
                      'shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-all duration-200',
                      'hover:bg-accent-cyan/10 hover:shadow-[0_0_20px_rgba(0,240,255,0.3)]',
                      'active:scale-95'
                    )}
                  >
                    Connect Wallet
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    type="button"
                    className={cn(
                      'rounded-full font-mono text-sm uppercase tracking-widest',
                      'border border-accent-red bg-bg-primary px-6 py-3',
                      'text-accent-red',
                      'animate-pulse'
                    )}
                  >
                    Wrong Network
                  </button>
                );
              }

              return (
                  <button
                    onClick={openAccountModal}
                    type="button"
                    className={cn(
                    'rounded-full font-mono text-xs uppercase tracking-wider',
                    'border border-accent-cyan/50 bg-bg-primary px-4 py-2.5',
                    'text-accent-cyan',
                    'shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-all duration-200',
                    'hover:border-accent-cyan hover:shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                  )}
                >
                  {account.displayName}
                </button>
              );
            })()}
          </div>
        );
      }}
    </RainbowConnectButton.Custom>
  );
}
