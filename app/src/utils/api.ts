import { Hime, HimeWithCast } from '../types/hime';
import { Cast } from '../types/cast';
import { TableRecordWithDetails, TableFormData } from '../types/table';
import { VisitRecord, VisitRecordWithHime, VisitFormData } from '../types/visit';
import { ScheduleWithHime, ScheduleFormData } from '../types/schedule';
import { Menu, MenuFormData } from '../types/menu';
import { logError } from './errorHandler';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// トークンを取得する関数
function getAuthToken(): string | null {
  try {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      return parsed.state?.token || null;
    }
  } catch (error) {
    logError(error, { component: 'api', action: 'getAuthToken' });
  }
  return null;
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();
  
  const headers: Record<string, string> = {};
  
  // FormDataの場合はContent-Typeを設定しない（ブラウザが自動設定）
  const isFormData = options.body instanceof FormData;
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (options.headers) {
    Object.assign(headers, options.headers as Record<string, string>);
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new ApiError(response.status, error.error || response.statusText);
  }

  // 204 No Contentの場合は空のオブジェクトを返す
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  // Hime
  hime: {
    list: () => fetchApi<Hime[]>('/hime'),
    get: (id: number) => fetchApi<HimeWithCast>(`/hime/${id}`),
    create: (data: FormData | Record<string, unknown>) => fetchApi<Hime>('/hime', { 
      method: 'POST', 
      body: data instanceof FormData ? data : JSON.stringify(data) 
    }),
    update: (id: number, data: FormData | Record<string, unknown>) => fetchApi<Hime>(`/hime/${id}`, { 
      method: 'PUT', 
      body: data instanceof FormData ? data : JSON.stringify(data) 
    }),
    delete: (id: number) => fetchApi<void>(`/hime/${id}`, { method: 'DELETE' }),
    bulkCreate: (data: Hime[]) => fetchApi<Hime[]>('/hime/bulk', { method: 'POST', body: JSON.stringify(data) }),
  },

  // Cast
  cast: {
    list: () => fetchApi<Cast[]>('/cast'),
    get: (id: number) => fetchApi<Cast>(`/cast/${id}`),
    create: (data: FormData | Record<string, unknown>) => fetchApi<Cast>('/cast', { 
      method: 'POST', 
      body: data instanceof FormData ? data : JSON.stringify(data) 
    }),
    update: (id: number, data: FormData | Record<string, unknown>) => fetchApi<Cast>(`/cast/${id}`, { 
      method: 'PUT', 
      body: data instanceof FormData ? data : JSON.stringify(data) 
    }),
    delete: (id: number) => fetchApi<void>(`/cast/${id}`, { method: 'DELETE' }),
    bulkCreate: (data: Cast[]) => fetchApi<Cast[]>('/cast/bulk', { method: 'POST', body: JSON.stringify(data) }),
  },

  // Table
  table: {
    list: () => fetchApi<TableRecordWithDetails[]>('/table'),
    get: (id: number) => fetchApi<TableRecordWithDetails>(`/table/${id}`),
    create: (data: TableFormData) => fetchApi<TableRecordWithDetails>('/table', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<TableFormData>) => fetchApi<TableRecordWithDetails>(`/table/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => fetchApi<void>(`/table/${id}`, { method: 'DELETE' }),
    bulkCreate: (data: TableFormData[]) => fetchApi<TableRecordWithDetails[]>('/table/bulk', { method: 'POST', body: JSON.stringify(data) }),
  },

  // Schedule
  schedule: {
    list: () => fetchApi<ScheduleWithHime[]>('/schedule'),
    get: (id: number) => fetchApi<ScheduleWithHime>(`/schedule/${id}`),
    create: (data: ScheduleFormData) => fetchApi<ScheduleWithHime>('/schedule', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<ScheduleFormData>) => fetchApi<ScheduleWithHime>(`/schedule/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => fetchApi<void>(`/schedule/${id}`, { method: 'DELETE' }),
    bulkCreate: (data: ScheduleFormData[]) => fetchApi<ScheduleWithHime[]>('/schedule/bulk', { method: 'POST', body: JSON.stringify(data) }),
  },

  // Visit
  visit: {
    list: () => fetchApi<VisitRecordWithHime[]>('/visit'),
    get: (id: number) => fetchApi<VisitRecord>(`/visit/${id}`),
    create: (data: VisitFormData) => fetchApi<VisitRecord>('/visit', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<VisitFormData>) => fetchApi<VisitRecord>(`/visit/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => fetchApi<void>(`/visit/${id}`, { method: 'DELETE' }),
    bulkCreate: (data: VisitFormData[]) => fetchApi<VisitRecord[]>('/visit/bulk', { method: 'POST', body: JSON.stringify(data) }),
  },

  // Setting
  setting: {
    list: () => fetchApi<Record<string, unknown>[]>('/setting'),
    get: (key: string) => fetchApi<Record<string, unknown>>(`/setting/${key}`),
    create: (data: Record<string, unknown>) => fetchApi<Record<string, unknown>>('/setting', { method: 'POST', body: JSON.stringify(data) }),
    update: (key: string, data: Record<string, unknown>) => fetchApi<Record<string, unknown>>(`/setting/${key}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (key: string) => fetchApi<void>(`/setting/${key}`, { method: 'DELETE' }),
    bulkCreate: (data: Record<string, unknown>[]) => fetchApi<Record<string, unknown>[]>('/setting/bulk', { method: 'POST', body: JSON.stringify(data) }),
  },

  // MyCast (自分のキャスト情報)
  myCast: {
    get: () => fetchApi<Cast>('/my-cast'),
    create: (data: Record<string, unknown>) => fetchApi<Cast>('/my-cast', { method: 'POST', body: JSON.stringify(data) }),
    update: (data: Record<string, unknown>) => fetchApi<Cast>('/my-cast', { method: 'PUT', body: JSON.stringify(data) }),
    check: () => fetchApi<{ exists: boolean }>('/my-cast/check'),
  },

  // Auth
  auth: {
    changePassword: (data: { currentPassword: string; newPassword: string }) =>
      fetchApi<{ message: string }>('/auth/change-password', { method: 'POST', body: JSON.stringify(data) }),
    updateEmail: (data: { email: string; password: string }) =>
      fetchApi<{ message: string }>('/auth/email', { method: 'PUT', body: JSON.stringify(data) }),
    deleteAccount: (data: { password: string }) =>
      fetchApi<{ message: string }>('/auth/account', { method: 'DELETE', body: JSON.stringify(data) }),
  },

  // Push Notification
  push: {
    subscribe: (data: { token: string }) =>
      fetchApi<{ message: string }>('/push/subscribe', { method: 'POST', body: JSON.stringify(data) }),
    unsubscribe: (token: string) =>
      fetchApi<{ message: string }>(`/push/unsubscribe?token=${encodeURIComponent(token)}`, { method: 'DELETE' }),
    test: () =>
      fetchApi<{ message: string }>('/push/test', { method: 'POST' }),
  },

  // Menu
  menu: {
    list: () => fetchApi<Menu[]>('/menu'),
    get: (id: number) => fetchApi<Menu>(`/menu/${id}`),
    create: (data: MenuFormData) => fetchApi<Menu>('/menu', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<MenuFormData>) => fetchApi<Menu>(`/menu/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => fetchApi<void>(`/menu/${id}`, { method: 'DELETE' }),
    bulkCreate: (data: MenuFormData[]) => fetchApi<Menu[]>('/menu/bulk', { method: 'POST', body: JSON.stringify(data) }),
  },
};

