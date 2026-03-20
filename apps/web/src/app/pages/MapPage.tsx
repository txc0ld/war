import { GameOverlay } from '@/components/battle/GameOverlay';
import { ConnectButton } from '@/components/wallet/ConnectButton';
import { useSessionAddress } from '@/hooks/useSessionAddress';
import { Shell } from '@/components/layout/Shell';

function ConnectScreen(): React.ReactNode {
  return (
    <section className="connect-screen">
      <div className="connect-screen__inner">
        <h1 className="connect-screen__title">WAR ROOM</h1>
        <p className="connect-screen__subtitle">GLOCKS &amp; NODES</p>
        <ConnectButton />
      </div>
    </section>
  );
}

export default function MapPage(): React.ReactNode {
  const sessionAddress = useSessionAddress();

  if (!sessionAddress) {
    return <ConnectScreen />;
  }

  return (
    <Shell>
      <GameOverlay />
    </Shell>
  );
}
