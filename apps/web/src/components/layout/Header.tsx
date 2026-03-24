import { useSyncExternalStore } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ConnectButton } from '@/components/wallet/ConnectButton';
import { ProfilePanel } from '@/components/profile/ProfilePanel';
import {
  getAudioMutedSnapshot,
  getServerAudioMutedSnapshot,
  subscribeToAudioPreference,
  toggleAudioMuted,
} from '@/lib/audioPreferences';
import { startSiteAudio } from '@/lib/siteAudio';
import { useStore } from '@/store';

export function Header(): React.ReactNode {
  const navigate = useNavigate();
  const location = useLocation();
  const phase = useStore((state) => state.phase);
  const audioMuted = useSyncExternalStore(
    subscribeToAudioPreference,
    getAudioMutedSnapshot,
    getServerAudioMutedSnapshot
  );
  const isHome = location.pathname === '/';
  const isLeaderboard = location.pathname === '/leaderboard';
  const isKillfeed = location.pathname === '/killfeed';
  const isChat = location.pathname === '/chat';
  const hideForBattlePhase = location.pathname === '/' && phase !== 'idle';

  if (hideForBattlePhase) {
    return null;
  }

  const handleAudioToggle = () => {
    const muted = toggleAudioMuted();
    if (!muted) {
      void startSiteAudio();
    }
  };

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <div className="site-header__topline">
          <button
            type="button"
            className="site-logo"
            aria-label="War Room home"
            onClick={() => navigate('/')}
          >
            <img
              src="/branding/header.png"
              alt="WAR ROOM"
              className="site-logo__image"
            />
          </button>

          <div className="site-header__wallet">
            <ProfilePanel />
            <button
              type="button"
              className="site-header__audio-toggle"
              aria-label={audioMuted ? 'Unmute audio' : 'Mute audio'}
              aria-pressed={audioMuted}
              onClick={handleAudioToggle}
            >
              <span className="site-header__audio-toggle-label">Audio</span>
              <span className="site-header__audio-toggle-value">
                {audioMuted ? 'Off' : 'On'}
              </span>
            </button>
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
          <button
            type="button"
            className={`site-nav__button ${isKillfeed ? 'site-nav__button--active' : ''}`}
            onClick={() => navigate('/killfeed')}
          >
            Killfeed
          </button>
          <button
            type="button"
            className={`site-nav__button ${isChat ? 'site-nav__button--active' : ''}`}
            onClick={() => navigate('/chat')}
          >
            Comms
          </button>
        </nav>
      </div>
    </header>
  );
}
