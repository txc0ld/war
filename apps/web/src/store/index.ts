import { create } from 'zustand';
import { createGameSlice, type GameSlice } from './gameSlice';
import { createUserSlice, type UserSlice } from './userSlice';
import { createBattleSlice, type BattleSlice } from './battleSlice';

type StoreState = GameSlice & UserSlice & BattleSlice;

export const useStore = create<StoreState>()((set) => ({
  ...createGameSlice(set),
  ...createUserSlice(set),
  ...createBattleSlice(set),
}));
