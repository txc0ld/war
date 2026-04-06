import { create } from 'zustand';
import { createGameSlice, type GameSlice } from './gameSlice';
import { createUserSlice, type UserSlice } from './userSlice';
import { createBattleSlice, type BattleSlice } from './battleSlice';
import { createS2Slice, type S2Slice } from './s2Slice';

type StoreState = GameSlice & UserSlice & BattleSlice & S2Slice;

export const useStore = create<StoreState>()((set, get) => ({
  ...createGameSlice(set),
  ...createUserSlice(set as never, get as never),
  ...createBattleSlice(set),
  ...createS2Slice(set),
}));
