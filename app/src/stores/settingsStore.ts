import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "../utils/api";

type Theme =
  | "lokat-original"
  | "dark"
  | "light"
  | "midnight"
  | "champagne"
  | "sakura"
  | "ocean"
  | "sunset"
  | "forest"
  | "rose";

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
      theme: "lokat-original",
      visitNotificationMinutes: 30,
      birthdayNotificationDays: 1,

      loadSettings: async () => {
        // Settings are loaded from localStorage via persist middleware
        const state = useSettingsStore.getState();
        document.documentElement.setAttribute("data-theme", state.theme);

        // バックエンドから通知設定を読み込む
        try {
          const visitSetting = await api.setting.get(
            "visit_notification_minutes"
          );
          if (visitSetting && typeof visitSetting.value === "string") {
            const minutes = parseInt(visitSetting.value);
            if (!isNaN(minutes)) {
              set({ visitNotificationMinutes: minutes });
            }
          }
        } catch (error) {
          // 設定が存在しない場合はデフォルト値を使用
        }

        try {
          const birthdaySetting = await api.setting.get(
            "birthday_notification_days"
          );
          if (birthdaySetting && typeof birthdaySetting.value === "string") {
            const days = parseInt(birthdaySetting.value);
            if (!isNaN(days)) {
              set({ birthdayNotificationDays: days });
            }
          }
        } catch (error) {
          // 設定が存在しない場合はデフォルト値を使用
        }
      },

      setTheme: async (theme) => {
        set({ theme });
        document.documentElement.setAttribute("data-theme", theme);
      },

      setVisitNotificationMinutes: async (minutes) => {
        set({ visitNotificationMinutes: minutes });
        // バックエンドに保存
        try {
          await api.setting.update("visit_notification_minutes", {
            key: "visit_notification_minutes",
            value: minutes.toString(),
          });
        } catch (error) {
          // 設定が存在しない場合は作成
          try {
            await api.setting.create({
              key: "visit_notification_minutes",
              value: minutes.toString(),
            });
          } catch (createError) {
            console.error(
              "Failed to save visit notification setting:",
              createError
            );
          }
        }
      },

      setBirthdayNotificationDays: async (days) => {
        set({ birthdayNotificationDays: days });
        // バックエンドに保存
        try {
          await api.setting.update("birthday_notification_days", {
            key: "birthday_notification_days",
            value: days.toString(),
          });
        } catch (error) {
          // 設定が存在しない場合は作成
          try {
            await api.setting.create({
              key: "birthday_notification_days",
              value: days.toString(),
            });
          } catch (createError) {
            console.error(
              "Failed to save birthday notification setting:",
              createError
            );
          }
        }
      },
    }),
    {
      name: "settings-storage",
      onRehydrateStorage: () => (state) => {
        if (state) {
          document.documentElement.setAttribute("data-theme", state.theme);
        }
      },
    }
  )
);
