import { create } from 'zustand';
import { VisitRecord, VisitRecordWithHime } from '../types/visit';
import { api } from '../utils/api';

interface VisitState {
  visitList: VisitRecordWithHime[];
  loading: boolean;
  error: string | null;

  loadVisitList: () => Promise<void>;
  addVisit: (visit: Omit<VisitRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateVisit: (id: number, visit: Partial<VisitRecord>) => Promise<void>;
  deleteVisit: (id: number) => Promise<void>;
}

export const useVisitStore = create<VisitState>((set, get) => ({
  visitList: [],
  loading: false,
  error: null,

  loadVisitList: async () => {
    set({ loading: true, error: null });
    try {
      const visitList = await api.visit.list();
      set({ visitList, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  addVisit: async (visit) => {
    set({ loading: true, error: null });
    try {
      await api.visit.create({
        ...visit,
        memo: visit.memo ?? undefined,
      });
      await get().loadVisitList();
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  updateVisit: async (id, visit) => {
    set({ loading: true, error: null });
    try {
      await api.visit.update(id, {
        ...visit,
        memo: visit.memo !== undefined ? (visit.memo ?? undefined) : undefined,
      });
      await get().loadVisitList();
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  deleteVisit: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.visit.delete(id);
      await get().loadVisitList();
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },
}));


