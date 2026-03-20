import { type ReactNode } from 'react';
import { Header } from './Header';
import { WorldMap } from '@/components/map/WorldMap';
import { GunSelector } from '@/components/wallet/GunSelector';

interface ShellProps {
  children: ReactNode;
}

export function Shell({ children }: ShellProps): ReactNode {
  return (
    <div className="site-shell">
      <div className="site-shell__map">
        <WorldMap />
      </div>
      <Header />
      <GunSelector />
      <main className="site-shell__content">{children}</main>
    </div>
  );
}
