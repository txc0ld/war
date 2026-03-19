import { useLocation, useNavigate } from 'react-router-dom';
import { ConnectButton } from '@/components/wallet/ConnectButton';
import { DEMO_MODE } from '@/lib/demo';

export function Header(): React.ReactNode {
  const navigate = useNavigate();
  const location = useLocation();
  const isLeaderboard = location.pathname === '/leaderboard';

  return (
    <header className="fixed left-0 right-0 top-0 z-50 px-4 py-3 md:px-6 md:py-4">
      <div className="mx-auto flex w-full max-w-[1480px] items-center justify-between rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(7,19,27,0.92)_0%,rgba(4,10,16,0.74)_100%)] px-5 py-3 shadow-[0_28px_90px_rgba(0,0,0,0.34)] backdrop-blur-xl md:px-6">
        <div className="flex items-center gap-6">
          <h1 className="font-mono text-lg font-bold uppercase tracking-[0.25em] text-accent-neon drop-shadow-[0_0_20px_rgba(204,255,0,0.16)] md:text-xl">
            WAR PATH
          </h1>
          <nav className="hidden items-center gap-2 md:flex">
            <button
              onClick={() => navigate('/')}
              className="rounded-full border border-transparent px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.24em] text-text-dim transition-all hover:border-white/10 hover:bg-white/[0.03] hover:text-accent-cyan"
            >
              Home
            </button>
            <button
              onClick={() => navigate(isLeaderboard ? '/' : '/leaderboard')}
              className="rounded-full border border-transparent px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.24em] text-text-dim transition-all hover:border-white/10 hover:bg-white/[0.03] hover:text-accent-cyan"
            >
              {isLeaderboard ? 'Back to Map' : 'Leaderboard'}
            </button>
            {DEMO_MODE && (
              <span className="rounded-full border border-accent-cyan/25 bg-accent-cyan/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.24em] text-accent-cyan shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                Demo Mode
              </span>
            )}
          </nav>
        </div>
        <div className="relative pl-4 before:absolute before:bottom-0 before:left-0 before:top-0 before:w-px before:bg-white/10">
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}
