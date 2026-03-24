import {
  applyAudioPreference,
  subscribeToAudioPreference,
} from './audioPreferences';

type MapCueName = 'hover' | 'selection';

const MAP_CUE_PATHS: Record<MapCueName, string> = {
  hover: '/assets/maphover.mp3',
  selection: '/assets/mapselection.mp3',
};

const MAP_CUE_VOLUME = 0.15;
const mapAudioPool = new Map<MapCueName, HTMLAudioElement>();

function syncMapAudioPreference(): void {
  mapAudioPool.forEach((audio) => {
    applyAudioPreference(audio);
  });
}

function getMapCueAudio(name: MapCueName): HTMLAudioElement | null {
  if (typeof window === 'undefined') {
    return null;
  }

  let audio = mapAudioPool.get(name);
  if (!audio) {
    audio = new Audio(MAP_CUE_PATHS[name]);
    audio.preload = 'auto';
    audio.loop = false;
    audio.volume = MAP_CUE_VOLUME;
    applyAudioPreference(audio);
    mapAudioPool.set(name, audio);
  }

  return audio;
}

if (typeof window !== 'undefined') {
  subscribeToAudioPreference(() => {
    syncMapAudioPreference();
  });
}

export function prepareMapAudio(): void {
  (Object.keys(MAP_CUE_PATHS) as MapCueName[]).forEach((name) => {
    getMapCueAudio(name);
  });
}

export function playMapCue(name: MapCueName): void {
  const audio = getMapCueAudio(name);
  if (!audio) {
    return;
  }

  audio.loop = false;
  audio.volume = MAP_CUE_VOLUME;
  applyAudioPreference(audio);
  audio.pause();
  audio.currentTime = 0;
  void audio.play().catch(() => {});
}
