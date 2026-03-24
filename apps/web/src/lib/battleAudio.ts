import {
  applyAudioPreference,
  subscribeToAudioPreference,
} from './audioPreferences';

type BattleCueName =
  | 'enterBattle'
  | 'battle'
  | 'fight'
  | 'winner'
  | 'loser';

const BATTLE_CUE_PATHS: Record<BattleCueName, string> = {
  enterBattle: '/assets/Enterbattle.mp3',
  battle: '/assets/Battle.mp3',
  fight: '/assets/Fight.mp3',
  winner: '/assets/Winner.mp3',
  loser: '/assets/Loser.mp3',
};

const battleAudioPool = new Map<BattleCueName, HTMLAudioElement>();
let battleAudioUnlocked = false;

function syncBattleAudioPreference(): void {
  battleAudioPool.forEach((audio) => {
    applyAudioPreference(audio);
  });
}

function getBattleCueAudio(name: BattleCueName): HTMLAudioElement | null {
  if (typeof window === 'undefined') {
    return null;
  }

  let audio = battleAudioPool.get(name);
  if (!audio) {
    audio = new Audio(BATTLE_CUE_PATHS[name]);
    audio.preload = 'auto';
    audio.loop = false;
    applyAudioPreference(audio);
    battleAudioPool.set(name, audio);
  }

  return audio;
}

if (typeof window !== 'undefined') {
  subscribeToAudioPreference(() => {
    syncBattleAudioPreference();
  });
}

export function prepareBattleAudio(): void {
  (Object.keys(BATTLE_CUE_PATHS) as BattleCueName[]).forEach((name) => {
    getBattleCueAudio(name);
  });
}

export function unlockBattleAudio(): void {
  if (battleAudioUnlocked || typeof window === 'undefined') {
    return;
  }

  prepareBattleAudio();

  for (const name of Object.keys(BATTLE_CUE_PATHS) as BattleCueName[]) {
    const audio = getBattleCueAudio(name);
    if (!audio) {
      continue;
    }

    const previousMuted = audio.muted;
    audio.muted = true;
    audio.currentTime = 0;
    void audio.play().then(() => {
      audio.pause();
      audio.currentTime = 0;
      audio.muted = previousMuted;
    }).catch(() => {
      audio.muted = previousMuted;
    });
  }

  battleAudioUnlocked = true;
}

export function playBattleCue(
  name: BattleCueName,
  options?: { loop?: boolean }
): void {
  const audio = getBattleCueAudio(name);
  if (!audio) {
    return;
  }

  audio.loop = options?.loop ?? false;
  applyAudioPreference(audio);
  audio.pause();
  audio.currentTime = 0;
  void audio.play().catch(() => {});
}

export function stopBattleCue(name: BattleCueName): void {
  const audio = getBattleCueAudio(name);
  if (!audio) {
    return;
  }

  audio.pause();
  audio.currentTime = 0;
}
