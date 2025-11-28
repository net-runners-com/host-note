import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'lokat-original' | 'dark' | 'light' | 'midnight' | 'champagne' | 'sakura' | 'ocean' | 'sunset' | 'forest' | 'rose';

interface SettingsState {
  theme: Theme;
  visitNotificationMinutes: number;
  birthdayNotificationDays: number;
  
  loadSettings: () => Promise<void>;
  setTheme: (theme: Theme) => Promise<void>;
  setVisitNotificationMinutes: (minutes: number) => Promise<void>;
  setBirthdayNotificationDays: (days: number) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'lokat-original',
      visitNotificationMinutes: 30,
      birthdayNotificationDays: 1,

      loadSettings: async () => {
        // Settings are loaded from localStorage via persist middleware
        const state = useSettingsStore.getState();
        document.documentElement.setAttribute('data-theme', state.theme);
      },

      setTheme: async (theme) => {
        set({ theme });
        document.documentElement.setAttribute('data-theme', theme);
      },

      setVisitNotificationMinutes: async (minutes) => {
        set({ visitNotificationMinutes: minutes });
      },

      setBirthdayNotificationDays: async (days) => {
        set({ birthdayNotificationDays: days });
      },
    }),
    {
      name: 'settings-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          document.documentElement.setAttribute('data-theme', state.theme);
        }
      },
    }
  )
);


