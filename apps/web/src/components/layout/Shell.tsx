import { type ReactNode } from 'react';
import { Header } from './Header';
import { WorldMap } from '@/components/map/WorldMap';
import { GunSelector } from '@/components/wallet/GunSelector';

interface ShellProps {
  children: ReactNode;
}

export function Shell({ children }: ShellProps): ReactNode {
  return (
    <div className="relative min-h-screen bg-bg-primary">
      <div className="fixed inset-0">
        <WorldMap />
      </div>
      <Header />
      <GunSelector />
      <div className="pointer-events-none relative z-20">{children}</div>
    </div>
  );
}
