import { create } from 'zustand';
import { TableRecordWithDetails, TableFormData } from '../types/table';
import { api } from '../utils/api';

interface TableState {
  tableList: TableRecordWithDetails[];
  loading: boolean;
  error: string | null;
  
  loadTableList: () => Promise<void>;
  addTable: (data: TableFormData) => Promise<void>;
  updateTable: (id: number, data: Partial<TableFormData>) => Promise<void>;
  deleteTable: (id: number) => Promise<void>;
}

export const useTableStore = create<TableState>((set, get) => ({
  tableList: [],
  loading: false,
  error: null,

  loadTableList: async () => {
    set({ loading: true, error: null });
    try {
      const tableList = await api.table.list();
      set({ tableList, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  addTable: async (data) => {
    set({ loading: true, error: null });
    try {
      await api.table.create(data);
      await get().loadTableList();
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  updateTable: async (id, data) => {
    set({ loading: true, error: null });
    try {
      await api.table.update(id, data);
      await get().loadTableList();
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  deleteTable: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.table.delete(id);
      await get().loadTableList();
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },
}));

