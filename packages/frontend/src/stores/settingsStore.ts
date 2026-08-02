import { create } from 'zustand';

export type ThemeMode = 'dark' | 'light';

export interface UserSettingsState {
  theme: ThemeMode;
  animateSprites: boolean;
  soundEffects: boolean;
  autoScrollLog: boolean;
  showLobbyChat: boolean;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  updateSetting: <K extends keyof Omit<UserSettingsState, 'setTheme' | 'toggleTheme' | 'updateSetting'>>(key: K, value: UserSettingsState[K]) => void;
  initTheme: () => void;
}

const STORAGE_KEY = 'anime-showdown-user-settings';

function loadInitialSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      return {
        theme: (data.theme === 'light' ? 'light' : 'dark') as ThemeMode,
        animateSprites: data.animateSprites ?? true,
        soundEffects: data.soundEffects ?? true,
        autoScrollLog: data.autoScrollLog ?? true,
        showLobbyChat: data.showLobbyChat ?? true,
      };
    }
  } catch (e) {
    console.warn('Failed to parse saved user settings:', e);
  }
  return {
    theme: 'dark' as ThemeMode,
    animateSprites: true,
    soundEffects: true,
    autoScrollLog: true,
    showLobbyChat: true,
  };
}

function saveSettings(state: Partial<UserSettingsState>) {
  try {
    const prev = loadInitialSettings();
    const next = { ...prev, ...state };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {}
}

export const useSettingsStore = create<UserSettingsState>((set, get) => {
  const initial = loadInitialSettings();
  
  return {
    ...initial,
    setTheme: (theme) => {
      document.documentElement.setAttribute('data-theme', theme);
      saveSettings({ theme });
      set({ theme });
    },
    toggleTheme: () => {
      const current = get().theme;
      const next: ThemeMode = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      saveSettings({ theme: next });
      set({ theme: next });
    },
    updateSetting: (key, value) => {
      saveSettings({ [key]: value });
      set({ [key]: value } as any);
    },
    initTheme: () => {
      const current = get().theme;
      document.documentElement.setAttribute('data-theme', current);
    },
  };
});
