import { create } from 'zustand';
import type { BattleState, PlayerKey } from '../types';

interface BattleStore {
  // State
  battleId: string | null;
  battleState: BattleState | null;
  yourKey: PlayerKey | null;
  winner: PlayerKey | 'draw' | null;
  isWaiting: boolean;       // true between submitting action and receiving next stateUpdate
  isQueuing: boolean;
  error: string | null;

  // Actions
  setBattleStart: (battleId: string, state: BattleState, yourKey: PlayerKey) => void;
  setBattleState: (state: BattleState) => void;
  setBattleEnd: (state: BattleState, winner: PlayerKey | 'draw') => void;
  setBattleError: (message: string) => void;
  submitAction: (moveId: string) => void;   // marks isWaiting=true locally
  setQueuing: (v: boolean) => void;
  resetBattle: () => void;
}

const initialState = {
  battleId: null,
  battleState: null,
  yourKey: null,
  winner: null,
  isWaiting: false,
  isQueuing: false,
  error: null,
};

export const useBattleStore = create<BattleStore>((set) => ({
  ...initialState,

  setBattleStart: (battleId, state, yourKey) =>
    set({ battleId, battleState: state, yourKey, isWaiting: false, winner: null, error: null }),

  setBattleState: (state) =>
    set({ battleState: state, isWaiting: false }),

  setBattleEnd: (state, winner) =>
    set({ battleState: state, winner, isWaiting: false }),

  setBattleError: (message) =>
    set({ error: message, isWaiting: false }),

  submitAction: (_moveId) =>
    set({ isWaiting: true }),

  setQueuing: (v) => set({ isQueuing: v }),

  resetBattle: () => set(initialState),
}));
