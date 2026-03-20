import { useLocation, useNavigate } from 'react-router-dom';
import { ConnectButton } from '@/components/wallet/ConnectButton';
import { DEMO_MODE } from '@/lib/demo';

export function Header(): React.ReactNode {
  const navigate = useNavigate();
  const location = useLocation();
  const isLeaderboard = location.pathname === '/leaderboard';

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <div className="site-header__brand">
          <button
            type="button"
            className="site-logo"
            onClick={() => navigate('/')}
          >
            WAR PATH
          </button>

          <nav className="site-nav" aria-label="Primary">
            <button
              type="button"
              className="site-nav__button"
              onClick={() => navigate('/')}
            >
              Home
            </button>
            <button
              type="button"
              className="site-nav__button"
              onClick={() => navigate(isLeaderboard ? '/' : '/leaderboard')}
            >
              {isLeaderboard ? 'Map' : 'Leaderboard'}
            </button>
            {DEMO_MODE && <span className="site-nav__mode">Demo Mode</span>}
          </nav>
        </div>

        <div className="site-header__wallet">
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}
