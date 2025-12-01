import { create } from "zustand";
import { TableRecordWithDetails, TableFormData } from "../types/table";
import { api } from "../utils/api";

interface TableState {
  tableList: TableRecordWithDetails[];
  loading: boolean;
  error: string | null;
  lastFetchTime: number | null;

  loadTableList: (force?: boolean) => Promise<void>;
  addTable: (data: TableFormData) => Promise<void>;
  updateTable: (id: number, data: Partial<TableFormData>) => Promise<void>;
  deleteTable: (id: number) => Promise<void>;
}

const CACHE_DURATION = 300000; // 5分間キャッシュ

export const useTableStore = create<TableState>((set, get) => ({
  tableList: [],
  loading: false,
  error: null,
  lastFetchTime: null,

  loadTableList: async (force = false) => {
    const state = get();
    const now = Date.now();

    // キャッシュが有効で、強制更新でない場合はスキップ
    if (
      !force &&
      state.lastFetchTime &&
      now - state.lastFetchTime < CACHE_DURATION &&
      state.tableList.length > 0
    ) {
      return;
    }

    set({ loading: true, error: null });
    try {
      const tableList = await api.table.list();
      set({ tableList, loading: false, lastFetchTime: now });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  addTable: async (data) => {
    set({ loading: true, error: null });
    try {
      await api.table.create(data);
      await get().loadTableList(true); // 強制更新
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  updateTable: async (id, data) => {
    set({ loading: true, error: null });
    try {
      await api.table.update(id, data);
      await get().loadTableList(true); // 強制更新
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  deleteTable: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.table.delete(id);
      await get().loadTableList(true); // 強制更新
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },
}));
