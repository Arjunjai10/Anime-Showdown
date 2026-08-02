import { create } from 'zustand';
import type { BattleState, PlayerKey, ChatMessage, LobbyUser } from '../types';

export interface BattleTabState {
  battleId: string;
  title: string;
  state: BattleState | null;
  yourKey: PlayerKey | null;
  winner: PlayerKey | 'draw' | null;
  isWaiting: boolean;
  error: string | null;
  chatMessages: ChatMessage[];
  hasUnread: boolean;
}

interface WorkspaceStore {
  activeTabId: string; // 'lobby', 'teambuilder', or battleId
  openBattleTabs: Record<string, BattleTabState>;
  lobbyChat: ChatMessage[];
  lobbyUsers: LobbyUser[];
  isQueuing: boolean;
  queuePosition?: number;
  queueFormat?: string;
  queueError: string | null;

  // Actions
  setActiveTab: (tabId: string) => void;
  setQueuing: (v: boolean, format?: string) => void;
  setQueueStatus: (position: number, format: string) => void;
  setQueueError: (err: string | null) => void;
  setLobbyUsers: (users: LobbyUser[]) => void;
  addLobbyChatMessage: (msg: ChatMessage) => void;
  
  // Battle lifecycle
  handleBattleStart: (battleId: string, state: BattleState, yourKey: PlayerKey) => void;
  handleBattleStateUpdate: (battleId: string, state: BattleState) => void;
  handleBattleEnd: (battleId: string, state: BattleState, winner: PlayerKey | 'draw') => void;
  handleBattleError: (battleId: string, message: string) => void;
  setBattleWaiting: (battleId: string, waiting: boolean) => void;
  addBattleChatMessage: (battleId: string, msg: ChatMessage) => void;
  closeBattleTab: (battleId: string) => void;
}

export const useWorkspaceStore = create<WorkspaceStore>((set, get) => ({
  activeTabId: 'lobby',
  openBattleTabs: {},
  lobbyChat: [],
  lobbyUsers: [],
  isQueuing: false,
  queuePosition: 0,
  queueFormat: 'ou_6v6',
  queueError: null,

  setActiveTab: (tabId) => {
    set((state) => {
      const nextTabs = { ...state.openBattleTabs };
      if (nextTabs[tabId]) {
        nextTabs[tabId] = { ...nextTabs[tabId], hasUnread: false };
      }
      return { activeTabId: tabId, openBattleTabs: nextTabs };
    });
  },

  setQueuing: (v, format) => set({ isQueuing: v, queueFormat: format || 'ou_6v6', queueError: null }),
  
  setQueueStatus: (position, format) => set({ queuePosition: position, queueFormat: format }),
  
  setQueueError: (err) => set({ queueError: err, isQueuing: false }),

  setLobbyUsers: (users) => set({ lobbyUsers: users }),

  addLobbyChatMessage: (msg) => set((state) => ({ lobbyChat: [...state.lobbyChat.slice(-100), msg] })),

  handleBattleStart: (battleId, battleState, yourKey) => {
    const opp = yourKey === 'playerA' ? battleState.playerB : battleState.playerA;
    const title = `Battle vs ${opp.username || opp.name || 'Opponent'}`;
    set((state) => ({
      isQueuing: false,
      queueError: null,
      activeTabId: battleId,
      openBattleTabs: {
        ...state.openBattleTabs,
        [battleId]: {
          battleId,
          title,
          state: battleState,
          yourKey,
          winner: null,
          isWaiting: false,
          error: null,
          chatMessages: [],
          hasUnread: false,
        },
      },
    }));
  },

  handleBattleStateUpdate: (battleId, battleState) => {
    set((state) => {
      const existing = state.openBattleTabs[battleId];
      if (!existing) return state;
      return {
        openBattleTabs: {
          ...state.openBattleTabs,
          [battleId]: { ...existing, state: battleState, isWaiting: false },
        },
      };
    });
  },

  handleBattleEnd: (battleId, battleState, winner) => {
    set((state) => {
      const existing = state.openBattleTabs[battleId];
      if (!existing) return state;
      return {
        openBattleTabs: {
          ...state.openBattleTabs,
          [battleId]: { ...existing, state: battleState, winner, isWaiting: false },
        },
      };
    });
  },

  handleBattleError: (battleId, message) => {
    set((state) => {
      const existing = state.openBattleTabs[battleId];
      if (!existing) return state;
      return {
        openBattleTabs: {
          ...state.openBattleTabs,
          [battleId]: { ...existing, error: message, isWaiting: false },
        },
      };
    });
  },

  setBattleWaiting: (battleId, waiting) => {
    set((state) => {
      const existing = state.openBattleTabs[battleId];
      if (!existing) return state;
      return {
        openBattleTabs: {
          ...state.openBattleTabs,
          [battleId]: { ...existing, isWaiting: waiting },
        },
      };
    });
  },

  addBattleChatMessage: (battleId, msg) => {
    set((state) => {
      const existing = state.openBattleTabs[battleId];
      if (!existing) return state;
      const isUnread = state.activeTabId !== battleId;
      return {
        openBattleTabs: {
          ...state.openBattleTabs,
          [battleId]: {
            ...existing,
            chatMessages: [...existing.chatMessages.slice(-50), msg],
            hasUnread: isUnread ? true : existing.hasUnread,
          },
        },
      };
    });
  },

  closeBattleTab: (battleId) => {
    set((state) => {
      const next = { ...state.openBattleTabs };
      delete next[battleId];
      const nextActive = state.activeTabId === battleId ? 'lobby' : state.activeTabId;
      return { openBattleTabs: next, activeTabId: nextActive };
    });
  },
}));
