import { useCallback } from 'react';
import { useStore } from '@/store';
import { getBattle } from '@/lib/api';
import type { Battle, BattlePhase } from '@warpath/shared';

interface UseBattleReturn {
  phase: BattlePhase;
  battle: Battle | null;
  setPhase: (phase: BattlePhase) => void;
  loadBattle: (battleId: string) => Promise<void>;
  reset: () => void;
}

export function useBattle(): UseBattleReturn {
  const { phase, currentBattle, setPhase, setBattle, reset } = useStore();

  const loadBattle = useCallback(
    async (battleId: string): Promise<void> => {
      const battle = await getBattle(battleId);
      setBattle(battle);
    },
    [setBattle]
  );

  return {
    phase,
    battle: currentBattle,
    setPhase,
    loadBattle,
    reset,
  };
}
