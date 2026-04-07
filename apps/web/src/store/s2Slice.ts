import type { SniperMetadata } from '@warpath/shared';

export type S2Phase =
  | 'idle'
  | 'selecting'
  | 'matching'
  | 'countdown'
  | 'playing'
  | 'result';

export interface S2MatchInfo {
  battleId: string;
  roomId: string;
  roomToken: string;
  gameServerUrl: string;
  opponentAddress: string;
  opponentTokenId: number;
}

export interface S2ResultInfo {
  winner: 0 | 1;
  finalScore: [number, number];
  playerIndex: 0 | 1;
}

export interface S2Slice {
  s2Phase: S2Phase;
  s2SelectedSniper: SniperMetadata | null;
  s2Snipers: SniperMetadata[];
  s2SnipersLoading: boolean;
  s2QueueId: string | null;
  s2QueueStatusToken: string | null;
  s2Match: S2MatchInfo | null;
  s2Result: S2ResultInfo | null;
  showArmory: boolean;

  setS2Phase: (phase: S2Phase) => void;
  setS2SelectedSniper: (sniper: SniperMetadata | null) => void;
  setS2Snipers: (snipers: SniperMetadata[], loading: boolean) => void;
  setS2Queue: (queueId: string | null, statusToken: string | null) => void;
  setS2Match: (match: S2MatchInfo | null) => void;
  setS2Result: (result: S2ResultInfo | null) => void;
  openArmory: () => void;
  closeArmory: () => void;
  resetS2: () => void;
}

export function createS2Slice(
  set: (partial: Partial<S2Slice>) => void
): S2Slice {
  return {
    s2Phase: 'idle',
    s2SelectedSniper: null,
    s2Snipers: [],
    s2SnipersLoading: false,
    s2QueueId: null,
    s2QueueStatusToken: null,
    s2Match: null,
    s2Result: null,
    showArmory: false,

    setS2Phase: (phase: S2Phase) => set({ s2Phase: phase }),
    setS2SelectedSniper: (sniper: SniperMetadata | null) => {
      // eslint-disable-next-line no-console
      console.log('[s2:slice] setS2SelectedSniper', sniper);
      set({ s2SelectedSniper: sniper, showArmory: false });
    },
    setS2Snipers: (snipers: SniperMetadata[], loading: boolean) =>
      set({ s2Snipers: snipers, s2SnipersLoading: loading }),
    setS2Queue: (queueId: string | null, statusToken: string | null) =>
      set({ s2QueueId: queueId, s2QueueStatusToken: statusToken }),
    setS2Match: (match: S2MatchInfo | null) => set({ s2Match: match }),
    setS2Result: (result: S2ResultInfo | null) => set({ s2Result: result }),
    openArmory: () => set({ showArmory: true }),
    closeArmory: () => set({ showArmory: false }),
    resetS2: () =>
      set({
        s2Phase: 'idle',
        s2QueueId: null,
        s2QueueStatusToken: null,
        s2Match: null,
        s2Result: null,
        showArmory: false,
      }),
  };
}
