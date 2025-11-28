import { create } from 'zustand';
import { Cast } from '../types/cast';
import { api } from '../utils/api';

interface CastState {
  castList: Cast[];
  loading: boolean;
  error: string | null;
  
  loadCastList: () => Promise<void>;
  addCast: (cast: Omit<Cast, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCast: (id: number, cast: Partial<Cast>) => Promise<void>;
  deleteCast: (id: number) => Promise<void>;
  searchCast: (query: string) => Promise<void>;
  searchCastWithFilters: (filters: { query?: string; himeId?: number | null }) => Promise<void>;
}

export const useCastStore = create<CastState>((set, get) => ({
  castList: [],
  loading: false,
  error: null,

  loadCastList: async () => {
    set({ loading: true, error: null });
    try {
      const castList = await api.cast.list();
      set({ castList, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  addCast: async (cast) => {
    set({ loading: true, error: null });
    try {
      await api.cast.create(cast);
      await get().loadCastList();
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  updateCast: async (id, cast) => {
    set({ loading: true, error: null });
    try {
      await api.cast.update(id, cast);
      await get().loadCastList();
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  deleteCast: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.cast.delete(id);
      await get().loadCastList();
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  searchCast: async (query) => {
    set({ loading: true, error: null });
    try {
      const castList = await api.cast.list();
      const filtered = query
        ? castList.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))
        : castList;
      set({ castList: filtered, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  searchCastWithFilters: async (filters) => {
    set({ loading: true, error: null });
    try {
      const castList = await api.cast.list();
      let filtered = castList;
      if (filters.query) {
        filtered = filtered.filter((c) => c.name.toLowerCase().includes(filters.query!.toLowerCase()));
      }
      if (filters.himeId !== undefined && filters.himeId !== null) {
        // 姫のtantoCastIdがそのキャストのIDと一致するキャストをフィルター
        const himeList = await api.hime.list();
        const hime = himeList.find((h) => h.id === filters.himeId);
        if (hime && hime.tantoCastId) {
          filtered = filtered.filter((c) => c.id === hime.tantoCastId);
        } else {
          // 姫が見つからない、または担当キャストが設定されていない場合は空のリスト
          filtered = [];
        }
      }
      set({ castList: filtered, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },
}));

