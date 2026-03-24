import {
  applyAudioPreference,
  getAudioMutedSnapshot,
  subscribeToAudioPreference,
} from './audioPreferences';

const WEBSITE_AUDIO_PATH = '/assets/Website.mp3';
const WEBSITE_AUDIO_VOLUME = 0.05;

let siteAudio: HTMLAudioElement | null = null;

function syncSiteAudioPreference(): void {
  if (!siteAudio) {
    return;
  }

  applyAudioPreference(siteAudio);
}

function getSiteAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!siteAudio) {
    siteAudio = new Audio(WEBSITE_AUDIO_PATH);
    siteAudio.preload = 'auto';
    siteAudio.loop = true;
    siteAudio.volume = WEBSITE_AUDIO_VOLUME;
    applyAudioPreference(siteAudio);
  }

  return siteAudio;
}

if (typeof window !== 'undefined') {
  subscribeToAudioPreference(() => {
    syncSiteAudioPreference();
  });
}

export function prepareSiteAudio(): void {
  getSiteAudio();
}

export async function startSiteAudio(): Promise<boolean> {
  const audio = getSiteAudio();
  if (!audio) {
    return false;
  }

  audio.loop = true;
  audio.volume = WEBSITE_AUDIO_VOLUME;
  applyAudioPreference(audio);

  if (!audio.paused || getAudioMutedSnapshot()) {
    return true;
  }

  try {
    await audio.play();
    return true;
  } catch {
    return false;
  }
}
