import { useLocation, useNavigate } from 'react-router-dom';
import { ConnectButton } from '@/components/wallet/ConnectButton';
import { DEMO_MODE } from '@/lib/demo';
import { useStore } from '@/store';

export function Header(): React.ReactNode {
  const navigate = useNavigate();
  const location = useLocation();
  const phase = useStore((state) => state.phase);
  const isHome = location.pathname === '/';
  const isLeaderboard = location.pathname === '/leaderboard';
  const hideForBattlePhase = location.pathname === '/' && phase !== 'idle';

  if (hideForBattlePhase) {
    return null;
  }

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <div className="site-header__topline">
          <button
            type="button"
            className="site-logo"
            onClick={() => navigate('/')}
          >
            WAR ROOM
          </button>

          <div className="site-header__wallet">
            <ConnectButton />
          </div>
        </div>

        <nav className="site-nav" aria-label="Primary">
          <button
            type="button"
            className={`site-nav__button ${isHome ? 'site-nav__button--active' : ''}`}
            onClick={() => navigate('/')}
          >
            Home
          </button>
          <button
            type="button"
            className={`site-nav__button ${isLeaderboard ? 'site-nav__button--active' : ''}`}
            onClick={() => navigate('/leaderboard')}
          >
            Leaderboard
          </button>
          {DEMO_MODE ? <span className="site-nav__mode">Demo Mode</span> : null}
        </nav>
      </div>
    </header>
  );
}
