import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getAudioMutedSnapshot,
  setAudioMuted,
  subscribeToAudioPreference,
  toggleAudioMuted,
} from './audioPreferences';

function createStorageMock(): Storage {
  let store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear() {
      store = new Map<string, string>();
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

describe('audio preferences', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: createStorageMock(),
      configurable: true,
      writable: true,
    });
  });

  it('defaults to unmuted', () => {
    expect(getAudioMutedSnapshot()).toBe(false);
  });

  it('persists mute toggles in localStorage', () => {
    expect(toggleAudioMuted()).toBe(true);
    expect(getAudioMutedSnapshot()).toBe(true);

    expect(toggleAudioMuted()).toBe(false);
    expect(getAudioMutedSnapshot()).toBe(false);
  });

  it('notifies subscribers when the mute state changes', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToAudioPreference(listener);

    setAudioMuted(true);
    setAudioMuted(false);
    unsubscribe();
    setAudioMuted(true);

    expect(listener).toHaveBeenCalledTimes(2);
  });
});
