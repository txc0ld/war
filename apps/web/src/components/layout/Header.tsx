import { useLocation, useNavigate } from 'react-router-dom';
import { ConnectButton } from '@/components/wallet/ConnectButton';
import { DEMO_MODE } from '@/lib/demo';

export function Header(): React.ReactNode {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';
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
