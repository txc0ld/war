// apps/web/src/game/__tests__/audio.test.ts
// Unit tests for AudioManager — sound playback, muting, ambient loop, and
// cleanup lifecycle.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { SoundId } from '../audio.js';

// ── Mock audioPreferences before importing AudioManager ──────────────────────

let mockMuted = false;
const mockListeners = new Set<() => void>();

vi.mock('../../lib/audioPreferences.js', () => ({
  getAudioMutedSnapshot: () => mockMuted,
  subscribeToAudioPreference: (listener: () => void) => {
    mockListeners.add(listener);
    return () => {
      mockListeners.delete(listener);
    };
  },
}));

// ── Mock HTMLAudioElement ────────────────────────────────────────────────────

interface MockAudio {
  src: string;
  preload: string;
  volume: number;
  muted: boolean;
  loop: boolean;
  play: ReturnType<typeof vi.fn>;
  pause: ReturnType<typeof vi.fn>;
  cloneNode: ReturnType<typeof vi.fn>;
}

let audioInstances: MockAudio[];

function createMockAudio(src?: string): MockAudio {
  const instance: MockAudio = {
    src: src ?? '',
    preload: '',
    volume: 1,
    muted: false,
    loop: false,
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
    cloneNode: vi.fn(),
  };
  // cloneNode returns a fresh mock that shares the same shape
  instance.cloneNode.mockImplementation(() => {
    const clone = createMockAudio(instance.src);
    audioInstances.push(clone);
    return clone;
  });
  audioInstances.push(instance);
  return instance;
}

// Replace the global Audio constructor with our mock factory
const OriginalAudio = globalThis.Audio;
beforeEach(() => {
  audioInstances = [];
  mockMuted = false;
  mockListeners.clear();
  globalThis.Audio = vi.fn((src?: string) => createMockAudio(src)) as unknown as typeof Audio;
});

afterEach(() => {
  globalThis.Audio = OriginalAudio;
});

// ── Import AudioManager after mocks are in place ────────────────────────────

// Dynamic import isn't needed — vi.mock is hoisted. Regular import works.
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
const { AudioManager, SOUND_PATHS } = await import('../audio.js');

// ── Tests ────────────────────────────────────────────────────────────────────

describe('AudioManager', () => {
  let mgr: InstanceType<typeof AudioManager>;

  beforeEach(() => {
    mgr = new AudioManager();
  });

  afterEach(() => {
    mgr.destroy();
  });

  // ── Construction ──────────────────────────────────────────────────────────

  it('creates without errors', () => {
    expect(mgr).toBeDefined();
  });

  it('preloads one-shot sources (all sounds except ambient)', () => {
    // Audio constructor is called once per non-ambient sound during construction.
    // 7 one-shot sounds: gunshot, bolt_cycle, bullet_crack, scope_in, scope_out,
    // reload, hit_received.
    const soundIds = Object.keys(SOUND_PATHS) as SoundId[];
    const oneShotCount = soundIds.filter((id) => id !== 'ambient').length;
    // Each Audio() call in the constructor creates one instance
    expect(oneShotCount).toBe(7);
    // Verify Audio was called for preloading (at least 7 times)
    expect(
      audioInstances.filter((a) => a.src !== SOUND_PATHS.ambient).length,
    ).toBeGreaterThanOrEqual(7);
  });

  // ── SOUND_PATHS completeness ──────────────────────────────────────────────

  it('has entries for all expected sound IDs', () => {
    const expected: SoundId[] = [
      'gunshot',
      'bolt_cycle',
      'bullet_crack',
      'scope_in',
      'scope_out',
      'reload',
      'hit_received',
      'ambient',
    ];
    for (const id of expected) {
      expect(SOUND_PATHS[id]).toBeDefined();
      expect(typeof SOUND_PATHS[id]).toBe('string');
      expect(SOUND_PATHS[id].length).toBeGreaterThan(0);
    }
  });

  // ── play() ────────────────────────────────────────────────────────────────

  it('play() clones the source and calls play on the clone', () => {
    mgr.play('gunshot');

    // Find the clone (the last instance created by cloneNode)
    const clones = audioInstances.filter(
      (a) => a.src === SOUND_PATHS.gunshot && a.play.mock.calls.length > 0,
    );
    expect(clones.length).toBeGreaterThanOrEqual(1);
  });

  it('play() does nothing when muted', () => {
    mgr.setMuted(true);

    const countBefore = audioInstances.length;
    mgr.play('gunshot');
    // No new clone should have been created
    expect(audioInstances.length).toBe(countBefore);
  });

  it('play("ambient") delegates to startAmbient', () => {
    mgr.play('ambient');

    // Should have created an ambient Audio instance with loop = true
    const ambientInstances = audioInstances.filter((a) => a.loop === true);
    expect(ambientInstances.length).toBe(1);
  });

  // ── setMuted ──────────────────────────────────────────────────────────────

  it('setMuted(true) prevents playback', () => {
    mgr.setMuted(true);

    const countBefore = audioInstances.length;
    mgr.play('bolt_cycle');
    mgr.play('reload');
    // No clones created
    expect(audioInstances.length).toBe(countBefore);
  });

  it('setMuted(false) re-enables playback', () => {
    mgr.setMuted(true);
    mgr.setMuted(false);

    mgr.play('gunshot');
    const clones = audioInstances.filter(
      (a) => a.src === SOUND_PATHS.gunshot && a.play.mock.calls.length > 0,
    );
    expect(clones.length).toBeGreaterThanOrEqual(1);
  });

  it('setMuted updates ambient muted property', () => {
    mgr.startAmbient();
    const ambient = audioInstances.find((a) => a.loop === true);
    expect(ambient).toBeDefined();

    mgr.setMuted(true);
    expect(ambient!.muted).toBe(true);

    mgr.setMuted(false);
    expect(ambient!.muted).toBe(false);
  });

  // ── Ambient ───────────────────────────────────────────────────────────────

  it('startAmbient creates a looping audio element', () => {
    mgr.startAmbient();

    const ambient = audioInstances.find((a) => a.loop === true);
    expect(ambient).toBeDefined();
    expect(ambient!.play).toHaveBeenCalled();
  });

  it('startAmbient is idempotent (only one ambient at a time)', () => {
    mgr.startAmbient();
    mgr.startAmbient();
    mgr.startAmbient();

    const ambients = audioInstances.filter((a) => a.loop === true);
    expect(ambients.length).toBe(1);
  });

  it('stopAmbient pauses and clears the ambient audio', () => {
    mgr.startAmbient();
    const ambient = audioInstances.find((a) => a.loop === true);
    expect(ambient).toBeDefined();

    mgr.stopAmbient();
    expect(ambient!.pause).toHaveBeenCalled();

    // Starting again should create a new instance
    mgr.startAmbient();
    const ambients = audioInstances.filter((a) => a.loop === true);
    expect(ambients.length).toBe(2); // old (paused) + new
  });

  it('stopAmbient is safe to call when no ambient is playing', () => {
    expect(() => mgr.stopAmbient()).not.toThrow();
  });

  // ── Global mute preference subscription ───────────────────────────────────

  it('responds to global audio preference changes', () => {
    mgr.startAmbient();
    const ambient = audioInstances.find((a) => a.loop === true);
    expect(ambient).toBeDefined();

    // Simulate external mute toggle
    mockMuted = true;
    for (const listener of mockListeners) listener();

    expect(ambient!.muted).toBe(true);
  });

  // ── destroy ───────────────────────────────────────────────────────────────

  it('destroy stops ambient and clears sources', () => {
    mgr.startAmbient();
    const ambient = audioInstances.find((a) => a.loop === true);

    mgr.destroy();

    expect(ambient!.pause).toHaveBeenCalled();
  });

  it('play is a no-op after destroy', () => {
    mgr.destroy();

    const countBefore = audioInstances.length;
    mgr.play('gunshot');
    expect(audioInstances.length).toBe(countBefore);
  });

  it('startAmbient is a no-op after destroy', () => {
    mgr.destroy();

    const loopCountBefore = audioInstances.filter((a) => a.loop === true).length;
    mgr.startAmbient();
    expect(audioInstances.filter((a) => a.loop === true).length).toBe(loopCountBefore);
  });

  it('double destroy is safe', () => {
    mgr.destroy();
    expect(() => mgr.destroy()).not.toThrow();
  });

  it('destroy unsubscribes from audio preference listener', () => {
    expect(mockListeners.size).toBe(1);
    mgr.destroy();
    expect(mockListeners.size).toBe(0);
  });
});
