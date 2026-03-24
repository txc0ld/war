const AUDIO_MUTED_STORAGE_KEY = 'warpath-audio-muted';

const listeners = new Set<() => void>();
let storageSyncAttached = false;

function notifyListeners(): void {
  listeners.forEach((listener) => listener());
}

function attachStorageSync(): void {
  if (storageSyncAttached || typeof window === 'undefined') {
    return;
  }

  window.addEventListener('storage', (event) => {
    if (event.key === null || event.key === AUDIO_MUTED_STORAGE_KEY) {
      notifyListeners();
    }
  });
  storageSyncAttached = true;
}

export function getAudioMutedSnapshot(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.localStorage.getItem(AUDIO_MUTED_STORAGE_KEY) === '1';
}

export function getServerAudioMutedSnapshot(): boolean {
  return false;
}

export function subscribeToAudioPreference(listener: () => void): () => void {
  attachStorageSync();
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function setAudioMuted(muted: boolean): boolean {
  if (typeof window === 'undefined') {
    return muted;
  }

  const current = getAudioMutedSnapshot();
  if (current === muted) {
    return muted;
  }

  if (muted) {
    window.localStorage.setItem(AUDIO_MUTED_STORAGE_KEY, '1');
  } else {
    window.localStorage.removeItem(AUDIO_MUTED_STORAGE_KEY);
  }

  notifyListeners();
  return muted;
}

export function toggleAudioMuted(): boolean {
  return setAudioMuted(!getAudioMutedSnapshot());
}

export function applyAudioPreference(audio: HTMLAudioElement): HTMLAudioElement {
  audio.muted = getAudioMutedSnapshot();
  return audio;
}
