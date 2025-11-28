import { create } from 'zustand';
import { Hime } from '../types/hime';
import { api } from '../utils/api';

interface HimeState {
  himeList: Hime[];
  loading: boolean;
  error: string | null;
  
  loadHimeList: () => Promise<void>;
  addHime: (hime: Omit<Hime, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateHime: (id: number, hime: Partial<Hime>) => Promise<void>;
  deleteHime: (id: number) => Promise<void>;
  searchHime: (query: string) => Promise<void>;
  searchHimeWithFilters: (filters: { query?: string; tantoCastId?: number | null }) => Promise<void>;
}

export const useHimeStore = create<HimeState>((set, get) => ({
  himeList: [],
  loading: false,
  error: null,

  loadHimeList: async () => {
    set({ loading: true, error: null });
    try {
      const himeList = await api.hime.list();
      set({ himeList, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  addHime: async (hime) => {
    set({ loading: true, error: null });
    try {
      await api.hime.create(hime);
      await get().loadHimeList();
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  updateHime: async (id, hime) => {
    set({ loading: true, error: null });
    try {
      await api.hime.update(id, hime);
      await get().loadHimeList();
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  deleteHime: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.hime.delete(id);
      await get().loadHimeList();
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  searchHime: async (query) => {
    set({ loading: true, error: null });
    try {
      const himeList = await api.hime.list();
      const filtered = query
        ? himeList.filter((h) => h.name.toLowerCase().includes(query.toLowerCase()))
        : himeList;
      set({ himeList: filtered, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  searchHimeWithFilters: async (filters) => {
    set({ loading: true, error: null });
    try {
      const himeList = await api.hime.list();
      let filtered = himeList;
      if (filters.query) {
        filtered = filtered.filter((h) => h.name.toLowerCase().includes(filters.query!.toLowerCase()));
      }
      if (filters.tantoCastId !== undefined && filters.tantoCastId !== null) {
        filtered = filtered.filter((h) => h.tantoCastId === filters.tantoCastId);
      }
      set({ himeList: filtered, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },
}));

