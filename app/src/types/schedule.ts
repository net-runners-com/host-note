import { Hime } from './hime';

export interface Schedule {
  id?: number;
  himeId: number;
  scheduledDatetime: string;
  memo: string | null;
  notificationSent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleWithHime extends Schedule {
  hime: Hime;
}

export interface ScheduleFormData {
  himeId: number;
  scheduledDatetime: string;
  memo?: string;
}


