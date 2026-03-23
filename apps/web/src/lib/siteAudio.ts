const WEBSITE_AUDIO_PATH = '/assets/Website.mp3';
const WEBSITE_AUDIO_VOLUME = 0.05;

let siteAudio: HTMLAudioElement | null = null;

function getSiteAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!siteAudio) {
    siteAudio = new Audio(WEBSITE_AUDIO_PATH);
    siteAudio.preload = 'auto';
    siteAudio.loop = true;
    siteAudio.volume = WEBSITE_AUDIO_VOLUME;
  }

  return siteAudio;
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

  if (!audio.paused) {
    return true;
  }

  try {
    await audio.play();
    return true;
  } catch {
    return false;
  }
}
