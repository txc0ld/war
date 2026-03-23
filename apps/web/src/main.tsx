import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import './styles/globals.css';

const CHUNK_RELOAD_KEY = 'warpath:chunk-reload-once';

if (typeof window !== 'undefined') {
  const recoverFromChunkError = () => {
    if (window.sessionStorage.getItem(CHUNK_RELOAD_KEY) === '1') {
      return;
    }

    window.sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
    window.location.reload();
  };

  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    recoverFromChunkError();
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const message =
      reason instanceof Error ? reason.message : String(reason ?? '');

    if (
      message.includes('Failed to fetch dynamically imported module') ||
      message.includes('Importing a module script failed')
    ) {
      recoverFromChunkError();
    }
  });

  window.setTimeout(() => {
    window.sessionStorage.removeItem(CHUNK_RELOAD_KEY);
  }, 10_000);
}

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
);
