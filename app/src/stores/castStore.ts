import { create } from 'zustand';
import { Cast } from '../types/cast';
import { api } from '../utils/api';

interface CastState {
  castList: Cast[];
  loading: boolean;
  error: string | null;
  lastFetchTime: number | null;
  
  loadCastList: (force?: boolean) => Promise<void>;
  addCast: (cast: Omit<Cast, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCast: (id: number, cast: Partial<Cast>) => Promise<void>;
  deleteCast: (id: number) => Promise<void>;
  searchCast: (query: string) => Promise<void>;
  searchCastWithFilters: (filters: { query?: string; himeId?: number | null }) => Promise<void>;
}

const CACHE_DURATION = 30000; // 30秒間キャッシュ

export const useCastStore = create<CastState>((set, get) => ({
  castList: [],
  loading: false,
  error: null,
  lastFetchTime: null,

  loadCastList: async (force = false) => {
    const state = get();
    const now = Date.now();
    
    // キャッシュが有効で、強制更新でない場合はスキップ
    if (!force && state.lastFetchTime && (now - state.lastFetchTime) < CACHE_DURATION && state.castList.length > 0) {
      return;
    }

    set({ loading: true, error: null });
    try {
      const castList = await api.cast.list();
      set({ castList, loading: false, lastFetchTime: now });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  addCast: async (cast) => {
    set({ loading: true, error: null });
    try {
      await api.cast.create(cast);
      await get().loadCastList(true); // 強制更新
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  updateCast: async (id, cast) => {
    set({ loading: true, error: null });
    try {
      await api.cast.update(id, cast);
      await get().loadCastList(true); // 強制更新
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  deleteCast: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.cast.delete(id);
      await get().loadCastList(true); // 強制更新
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  searchCast: async (query) => {
    const state = get();
    // キャッシュされたデータを使用
    if (state.castList.length > 0) {
      const filtered = query
        ? state.castList.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))
        : state.castList;
      set({ castList: filtered });
      return;
    }
    
    // キャッシュがない場合は取得
    set({ loading: true, error: null });
    try {
      await get().loadCastList();
      const castList = get().castList;
      const filtered = query
        ? castList.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))
        : castList;
      set({ castList: filtered, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  searchCastWithFilters: async (filters) => {
    const state = get();
    // キャッシュされたデータを使用
    if (state.castList.length > 0) {
      let filtered = state.castList;
      if (filters.query) {
        filtered = filtered.filter((c) => c.name.toLowerCase().includes(filters.query!.toLowerCase()));
      }
      if (filters.himeId !== undefined && filters.himeId !== null) {
        // himeIdでフィルタリングする場合は、APIからhime情報を取得
        try {
          const hime = await api.hime.get(filters.himeId);
          if (hime && hime.tantoCastId) {
            filtered = filtered.filter((c) => c.id === hime.tantoCastId);
          } else {
            filtered = [];
          }
        } catch (error) {
          filtered = [];
        }
      }
      set({ castList: filtered });
      return;
    }
    
    // キャッシュがない場合は取得
    set({ loading: true, error: null });
    try {
      await get().loadCastList();
      const castList = get().castList;
      let filtered = castList;
      if (filters.query) {
        filtered = filtered.filter((c) => c.name.toLowerCase().includes(filters.query!.toLowerCase()));
      }
      if (filters.himeId !== undefined && filters.himeId !== null) {
        try {
          const hime = await api.hime.get(filters.himeId);
          if (hime && hime.tantoCastId) {
            filtered = filtered.filter((c) => c.id === hime.tantoCastId);
          } else {
            filtered = [];
          }
        } catch (error) {
          filtered = [];
        }
      }
      set({ castList: filtered, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },
}));

