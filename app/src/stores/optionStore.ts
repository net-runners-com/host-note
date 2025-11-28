import { create } from "zustand";
import { api } from "../utils/api";

interface OptionStore {
  drinkPreferenceOptions: string[];
  iceOptions: string[];
  carbonationOptions: string[];
  tobaccoTypeOptions: string[];
  visitTypeOptions: Array<{ value: string; label: string }>;
  analysisTypeOptions: Array<{ value: string; label: string }>;
  periodOptions: Array<{ value: string; label: string }>;
  sortOptions: Array<{ value: string; label: string }>;
  loading: boolean;
  loadOptions: () => Promise<void>;
}

const defaultOptions = {
  drinkPreferenceOptions: ["超薄め", "薄め", "普通", "濃いめ", "超濃いめ"],
  iceOptions: ["1個", "2~3個", "満タン"],
  carbonationOptions: ["OK", "NG"],
  tobaccoTypeOptions: ["紙タバコ", "アイコス", "両方"],
  visitTypeOptions: [
    { value: "normal", label: "通常" },
    { value: "first", label: "初回" },
    { value: "shimei", label: "指名あり" },
  ],
  analysisTypeOptions: [
    { value: "general", label: "総合分析" },
    { value: "sales", label: "売上分析" },
    { value: "visit", label: "来店分析" },
    { value: "recommendation", label: "AI推奨事項" },
  ],
  periodOptions: [
    { value: "week", label: "週" },
    { value: "month", label: "月" },
    { value: "year", label: "年" },
  ],
  sortOptions: [
    { value: "recent", label: "直近順" },
    { value: "sales", label: "売上順" },
    { value: "visits", label: "来店回数順" },
  ],
};

export const useOptionStore = create<OptionStore>((set) => ({
  ...defaultOptions,
  loading: false,

  loadOptions: async () => {
    set({ loading: true });
    try {
      const settings = await api.setting.list();
      const settingsMap = new Map(settings.map((s: any) => [s.key, s.value]));

      const parseJsonArray = (
        key: string,
        defaultValue: string[]
      ): string[] => {
        if (!settingsMap.has(key)) return defaultValue;
        try {
          return JSON.parse(settingsMap.get(key) as string);
        } catch {
          return defaultValue;
        }
      };

      const parseJsonObjectArray = (
        key: string,
        defaultValue: Array<{ value: string; label: string }>
      ): Array<{ value: string; label: string }> => {
        if (!settingsMap.has(key)) return defaultValue;
        try {
          return JSON.parse(settingsMap.get(key) as string);
        } catch {
          return defaultValue;
        }
      };

      set({
        drinkPreferenceOptions: parseJsonArray(
          "drinkPreferenceOptions",
          defaultOptions.drinkPreferenceOptions
        ),
        iceOptions: parseJsonArray("iceOptions", defaultOptions.iceOptions),
        carbonationOptions: parseJsonArray(
          "carbonationOptions",
          defaultOptions.carbonationOptions
        ),
        tobaccoTypeOptions: parseJsonArray(
          "tobaccoTypeOptions",
          defaultOptions.tobaccoTypeOptions
        ),
        visitTypeOptions: parseJsonObjectArray(
          "visitTypeOptions",
          defaultOptions.visitTypeOptions
        ),
        // analysisTypeOptions, periodOptions, sortOptionsはデータベースから取得せず、デフォルト値を使用
        analysisTypeOptions: defaultOptions.analysisTypeOptions,
        periodOptions: defaultOptions.periodOptions,
        sortOptions: defaultOptions.sortOptions,
        loading: false,
      });
    } catch (error) {
      console.error("Failed to load options:", error);
      // エラー時はデフォルト値を使用
      set({ ...defaultOptions, loading: false });
    }
  },
}));
