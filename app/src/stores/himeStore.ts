import { create } from "zustand";
import { Hime } from "../types/hime";
import { api } from "../utils/api";

interface HimeState {
  himeList: Hime[];
  loading: boolean;
  error: string | null;
  lastFetchTime: number | null;

  loadHimeList: (force?: boolean) => Promise<void>;
  addHime: (
    hime: Omit<Hime, "id" | "createdAt" | "updatedAt">
  ) => Promise<void>;
  updateHime: (id: number, hime: Partial<Hime>) => Promise<void>;
  deleteHime: (id: number) => Promise<void>;
  searchHime: (query: string) => Promise<void>;
  searchHimeWithFilters: (filters: {
    query?: string;
    tantoCastId?: number | null;
  }) => Promise<void>;
}

const CACHE_DURATION = 300000; // 5分間キャッシュ

export const useHimeStore = create<HimeState>((set, get) => ({
  himeList: [],
  loading: false,
  error: null,
  lastFetchTime: null,

  loadHimeList: async (force = false) => {
    const state = get();
    const now = Date.now();

    // キャッシュが有効で、強制更新でない場合はスキップ
    if (
      !force &&
      state.lastFetchTime &&
      now - state.lastFetchTime < CACHE_DURATION &&
      state.himeList.length > 0
    ) {
      return;
    }

    set({ loading: true, error: null });
    try {
      const himeList = await api.hime.list();
      set({ himeList, loading: false, lastFetchTime: now });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  addHime: async (hime) => {
    set({ loading: true, error: null });
    try {
      await api.hime.create(hime);
      await get().loadHimeList(true); // 強制更新
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  updateHime: async (id, hime) => {
    set({ loading: true, error: null });
    try {
      await api.hime.update(id, hime);
      // キャッシュを無効化して強制更新
      set({ lastFetchTime: null });
      await get().loadHimeList(true); // 強制更新
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  deleteHime: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.hime.delete(id);
      await get().loadHimeList(true); // 強制更新
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  searchHime: async (query) => {
    const state = get();
    // キャッシュされたデータを使用
    if (state.himeList.length > 0) {
      const filtered = query
        ? state.himeList.filter((h) =>
            h.name.toLowerCase().includes(query.toLowerCase())
          )
        : state.himeList;
      set({ himeList: filtered });
      return;
    }

    // キャッシュがない場合は取得
    set({ loading: true, error: null });
    try {
      await get().loadHimeList();
      const himeList = get().himeList;
      const filtered = query
        ? himeList.filter((h) =>
            h.name.toLowerCase().includes(query.toLowerCase())
          )
        : himeList;
      set({ himeList: filtered, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  searchHimeWithFilters: async (filters) => {
    const state = get();
    const now = Date.now();
    const hasFreshCache =
      state.himeList.length > 0 &&
      state.lastFetchTime &&
      now - state.lastFetchTime < CACHE_DURATION;

    const applyFilters = () => {
      const currentState = get();
      let filtered = [...currentState.himeList];
      if (filters.query) {
        filtered = filtered.filter((h) =>
          h.name.toLowerCase().includes(filters.query!.toLowerCase())
        );
      }
      if (filters.tantoCastId !== undefined && filters.tantoCastId !== null) {
        filtered = filtered.filter(
          (h) => h.tantoCastId === filters.tantoCastId
        );
      }
      // フィルタリング結果でhimeListを更新（検索結果として表示）
      set({ himeList: filtered, loading: false });
    };

    set({ loading: true, error: null });

    // キャッシュが新しければAPIを叩かずにフィルタのみ適用
    if (hasFreshCache) {
      applyFilters();
      return;
    }

    // キャッシュがない/古い場合のみAPIを叩く
    try {
      await get().loadHimeList(true); // 強制更新
      applyFilters();
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },
}));
