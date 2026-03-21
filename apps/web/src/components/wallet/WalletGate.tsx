import { type ReactNode } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from './ConnectButton';
import { useGuns } from '@/hooks/useGuns';
import { GlitchText } from '@/components/ui/GlitchText';
import { cn } from '@/lib/cn';
import { DEMO_MODE } from '@/lib/demo';

interface WalletGateProps {
  children: ReactNode;
}

export function WalletGate({ children }: WalletGateProps): ReactNode {
  const { isConnected, isConnecting } = useAccount();
  const { guns, isLoading, error } = useGuns();

  if (DEMO_MODE) {
    return <>{children}</>;
  }

  if (!isConnected) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg-primary">
        <img
          src="/assets/map.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-20"
        />
        <div className="relative z-10 flex flex-col items-center gap-8">
          <h1 className="font-mono text-4xl font-bold uppercase tracking-[0.3em] text-accent-neon md:text-6xl">
            WAR ROOM
          </h1>
          <p className="font-mono text-sm uppercase tracking-wider text-text-muted">
            Connect your wallet to enter
          </p>
          <ConnectButton />
          {isConnecting && (
            <p className="font-mono text-xs text-text-dim">Connecting...</p>
          )}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-primary">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin border-2 border-accent-cyan border-t-transparent" />
          <p className="font-mono text-sm uppercase tracking-wider text-text-muted">
            Scanning arsenal...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-primary">
        <div className="flex flex-col items-center gap-4">
          <p className="font-mono text-sm uppercase tracking-wider text-accent-red">
            Error loading weapons
          </p>
          <p className="max-w-md text-center font-mono text-xs text-text-dim">
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (guns.length === 0) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg-primary">
        <img
          src="/assets/map.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-10"
        />
        <div className="relative z-10 flex flex-col items-center gap-8">
          <GlitchText
            text="NO WEAPONS DETECTED"
            className="text-2xl text-accent-red md:text-4xl"
          />
          <p className="max-w-md text-center font-mono text-sm text-text-muted">
            You need a Glocks &amp; Nodes NFT to enter the war zone.
          </p>
          <a
            href="https://opensea.io/collection/glocks-and-nodes"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'font-mono text-sm uppercase tracking-widest',
              'border border-accent-neon bg-bg-primary px-6 py-3',
              'text-accent-neon',
              'transition-all duration-200',
              'hover:bg-accent-neon/10 hover:shadow-[0_0_20px_rgba(0,189,254,0.3)]'
            )}
          >
            Get Armed on OpenSea
          </a>
          <div className="mt-4">
            <ConnectButton />
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
