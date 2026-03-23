import { useEffect } from 'react';
import { prepareSiteAudio, startSiteAudio } from '@/lib/siteAudio';

const AMBIENT_AUDIO_START_EVENTS: Array<keyof WindowEventMap> = [
  'pointerdown',
  'touchstart',
  'keydown',
];

export function AmbientAudio(): null {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    let disposed = false;

    const removeStartListeners = () => {
      AMBIENT_AUDIO_START_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, handleStartAttempt);
      });
    };

    const handleStartAttempt = () => {
      void startSiteAudio().then((started) => {
        if (started && !disposed) {
          removeStartListeners();
        }
      });
    };

    prepareSiteAudio();
    handleStartAttempt();
    AMBIENT_AUDIO_START_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, handleStartAttempt, { passive: true });
    });

    return () => {
      disposed = true;
      removeStartListeners();
    };
  }, []);

  return null;
}
