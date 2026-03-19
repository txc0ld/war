import type { BattlePhase, Battle } from '@warpath/shared';

export interface BattleSlice {
  phase: BattlePhase;
  currentBattle: Battle | null;
  queueId: string | null;
  setPhase: (phase: BattlePhase) => void;
  setBattle: (battle: Battle | null) => void;
  setQueueId: (id: string | null) => void;
  reset: () => void;
}

export function createBattleSlice(
  set: (partial: Partial<BattleSlice>) => void
): BattleSlice {
  return {
    phase: 'idle',
    currentBattle: null,
    queueId: null,
    setPhase: (phase: BattlePhase) => set({ phase }),
    setBattle: (battle: Battle | null) => set({ currentBattle: battle }),
    setQueueId: (id: string | null) => set({ queueId: id }),
    reset: () =>
      set({ phase: 'idle', currentBattle: null, queueId: null }),
  };
}
