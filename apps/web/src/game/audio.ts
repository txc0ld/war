// apps/web/src/game/audio.ts
// In-game audio manager for the Deadshot sniper duel.
// Uses HTMLAudioElement with a clone-to-play pattern for overlapping one-shots.
// Respects the global mute preference from audioPreferences.ts.

import { getAudioMutedSnapshot, subscribeToAudioPreference } from '../lib/audioPreferences.js';

export type SoundId =
  | 'gunshot'
  | 'bolt_cycle'
  | 'bullet_crack'
  | 'scope_in'
  | 'scope_out'
  | 'reload'
  | 'hit_received'
  | 'ambient';

export const SOUND_PATHS: Record<SoundId, string> = {
  gunshot: '/assets/s2/gunshot.mp3',
  bolt_cycle: '/assets/s2/bolt-cycle.mp3',
  bullet_crack: '/assets/s2/bullet-crack.mp3',
  scope_in: '/assets/s2/scope-in.mp3',
  scope_out: '/assets/s2/scope-out.mp3',
  reload: '/assets/s2/reload.mp3',
  hit_received: '/assets/s2/hit-received.mp3',
  ambient: '/assets/s2/ambient.mp3',
};

const VOLUMES: Record<SoundId, number> = {
  gunshot: 0.5,
  bolt_cycle: 0.35,
  bullet_crack: 0.3,
  scope_in: 0.25,
  scope_out: 0.25,
  reload: 0.3,
  hit_received: 0.4,
  ambient: 0.08,
};

export class AudioManager {
  #sources: Map<SoundId, HTMLAudioElement> = new Map();
  #ambient: HTMLAudioElement | null = null;
  #muted: boolean;
  #unsubscribe: (() => void) | null = null;
  #destroyed = false;

  constructor() {
    this.#muted = getAudioMutedSnapshot();

    this.#unsubscribe = subscribeToAudioPreference(() => {
      this.#muted = getAudioMutedSnapshot();
      if (this.#ambient !== null) {
        this.#ambient.muted = this.#muted;
      }
    });

    // Preload all one-shot sounds
    for (const [id, path] of Object.entries(SOUND_PATHS) as Array<[SoundId, string]>) {
      if (id === 'ambient') continue;
      try {
        const audio = new Audio(path);
        audio.preload = 'auto';
        audio.volume = VOLUMES[id];
        this.#sources.set(id, audio);
      } catch {
        // Audio failed to create — will no-op on play
      }
    }
  }

  play(id: SoundId): void {
    if (this.#destroyed || this.#muted) return;
    if (id === 'ambient') {
      this.startAmbient();
      return;
    }
    const source = this.#sources.get(id);
    if (source === undefined) return;
    try {
      const clone = source.cloneNode(false) as HTMLAudioElement;
      clone.volume = VOLUMES[id];
      clone.play().catch(() => {});
    } catch {
      // Clone failed — silent fail
    }
  }

  startAmbient(): void {
    if (this.#destroyed) return;
    if (this.#ambient !== null) return;
    try {
      const audio = new Audio(SOUND_PATHS.ambient);
      audio.loop = true;
      audio.volume = VOLUMES.ambient;
      audio.muted = this.#muted;
      audio.play().catch(() => {});
      this.#ambient = audio;
    } catch {
      // Audio creation failed
    }
  }

  stopAmbient(): void {
    if (this.#ambient !== null) {
      this.#ambient.pause();
      this.#ambient = null;
    }
  }

  setMuted(muted: boolean): void {
    this.#muted = muted;
    if (this.#ambient !== null) {
      this.#ambient.muted = muted;
    }
  }

  destroy(): void {
    if (this.#destroyed) return;
    this.#destroyed = true;
    this.stopAmbient();
    this.#sources.clear();
    if (this.#unsubscribe !== null) {
      this.#unsubscribe();
      this.#unsubscribe = null;
    }
  }
}
