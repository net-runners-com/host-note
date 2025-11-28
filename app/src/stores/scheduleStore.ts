import { create } from 'zustand';
import { Schedule, ScheduleWithHime } from '../types/schedule';
import { api } from '../utils/api';

interface ScheduleState {
  scheduleList: Schedule[];
  todaySchedules: ScheduleWithHime[];
  loading: boolean;
  error: string | null;
  
  loadScheduleList: () => Promise<void>;
  loadTodaySchedules: () => Promise<void>;
  addSchedule: (schedule: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateSchedule: (id: number, schedule: Partial<Schedule>) => Promise<void>;
  deleteSchedule: (id: number) => Promise<void>;
}

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  scheduleList: [],
  todaySchedules: [],
  loading: false,
  error: null,

  loadScheduleList: async () => {
    set({ loading: true, error: null });
    try {
      const scheduleList = await api.schedule.list();
      set({ scheduleList, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  loadTodaySchedules: async () => {
    set({ loading: true, error: null });
    try {
      const scheduleList = await api.schedule.list();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const todaySchedules = scheduleList.filter((s) => {
        const scheduleDate = new Date(s.scheduledDatetime);
        return scheduleDate >= today && scheduleDate < tomorrow;
      });
      set({ todaySchedules, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  addSchedule: async (schedule) => {
    set({ loading: true, error: null });
    try {
      await api.schedule.create({
        ...schedule,
        memo: schedule.memo ?? undefined,
      });
      await get().loadScheduleList();
      await get().loadTodaySchedules();
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  updateSchedule: async (id, schedule) => {
    set({ loading: true, error: null });
    try {
      await api.schedule.update(id, {
        ...schedule,
        memo: schedule.memo !== undefined ? (schedule.memo ?? undefined) : undefined,
      });
      await get().loadScheduleList();
      await get().loadTodaySchedules();
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  deleteSchedule: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.schedule.delete(id);
      await get().loadScheduleList();
      await get().loadTodaySchedules();
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },
}));


