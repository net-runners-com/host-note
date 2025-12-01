import { Hime, HimeWithCast } from "../types/hime";
import { Cast } from "../types/cast";
import { TableRecordWithDetails, TableFormData } from "../types/table";
import {
  VisitRecord,
  VisitRecordWithHime,
  VisitFormData,
} from "../types/visit";
import { ScheduleWithHime, ScheduleFormData } from "../types/schedule";
import { Menu, MenuFormData } from "../types/menu";
import { logError } from "./errorHandler";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// トークンを取得する関数
function getAuthToken(): string | null {
  try {
    const authStorage = localStorage.getItem("auth-storage");
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      return parsed.state?.token || null;
    }
  } catch (error) {
    logError(error, { component: "api", action: "getAuthToken" });
  }
  return null;
}

// タイムアウト付きfetch
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number = 30000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timeout");
    }
    throw error;
  }
}

// リトライ付きfetch
async function fetchWithRetry<T>(
  fetchFn: () => Promise<Response>,
  endpoint: string,
  maxRetries: number = 2,
  retryDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  const startTime = performance.now();

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetchFn();
      const duration = performance.now() - startTime;

      // パフォーマンスログ（3秒以上かかった場合）
      if (duration > 3000) {
        console.warn(
          `Slow API request: ${endpoint} took ${duration.toFixed(2)}ms`
        );
      }

      if (!response.ok) {
        // エラーレスポンスの詳細を取得
        let errorData: { error?: string; message?: string; details?: unknown } =
          {};
        try {
          const text = await response.text();
          if (text) {
            errorData = JSON.parse(text);
          }
        } catch {
          errorData = { error: response.statusText };
        }

        const errorMessage =
          errorData.error || errorData.message || response.statusText;
        const apiError = new ApiError(response.status, errorMessage);

        // エラーレスポンスの詳細を保持
        (apiError as unknown as { response?: unknown }).response = errorData;

        // エラーログ（404/409エラーは通常の動作なので記録しない、500エラーの場合は詳細を記録）
        if (response.status !== 404 && response.status !== 409) {
          logError(apiError, {
            component: "api",
            action: "fetchApi",
            endpoint,
            status: response.status,
            attempt: attempt + 1,
            errorDetails: response.status >= 500 ? errorData : undefined,
            duration: duration.toFixed(2),
          });
        }

        throw apiError;
      }

      // 204 No Contentの場合は空のオブジェクトを返す
      if (response.status === 204) {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      lastError = error as Error;
      const duration = performance.now() - startTime;

      // 最後の試行でない場合、リトライ可能なエラーのみリトライ
      if (attempt < maxRetries) {
        // 4xxエラー（クライアントエラー）はリトライしない
        if (
          error instanceof ApiError &&
          error.status >= 400 &&
          error.status < 500
        ) {
          throw error;
        }

        // タイムアウトやネットワークエラーのみリトライ
        if (
          error instanceof Error &&
          (error.message === "Request timeout" ||
            error.message.includes("Failed to fetch") ||
            error.message.includes("NetworkError"))
        ) {
          // リトライログ
          console.warn(
            `API request failed (attempt ${attempt + 1}/${maxRetries + 1}): ${endpoint}`,
            error.message
          );

          await new Promise((resolve) =>
            setTimeout(resolve, retryDelay * (attempt + 1))
          );
          continue;
        }

        // その他のエラーはリトライしない
        throw error;
      } else {
        // 最終的なエラーログ
        logError(error, {
          component: "api",
          action: "fetchApi",
          endpoint,
          attempt: attempt + 1,
          duration: duration.toFixed(2),
        });
      }
    }
  }

  throw lastError || new Error("Unknown error");
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
    headers["Content-Type"] = "application/json";
  }

  if (options.headers) {
    Object.assign(headers, options.headers as Record<string, string>);
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // タイムアウトとリトライ付きでfetch
  return fetchWithRetry(
    () => fetchWithTimeout(url, { ...options, headers }, 30000),
    endpoint,
    2, // 最大2回リトライ
    1000 // 1秒待機
  );
}

export const api = {
  // Hime
  hime: {
    list: () => fetchApi<Hime[]>("/hime"),
    get: (id: number) => fetchApi<HimeWithCast>(`/hime/${id}`),
    create: (data: FormData | Record<string, unknown>) =>
      fetchApi<Hime>("/hime", {
        method: "POST",
        body: data instanceof FormData ? data : JSON.stringify(data),
      }),
    update: (id: number, data: FormData | Record<string, unknown>) =>
      fetchApi<Hime>(`/hime/${id}`, {
        method: "PUT",
        body: data instanceof FormData ? data : JSON.stringify(data),
      }),
    delete: (id: number) => fetchApi<void>(`/hime/${id}`, { method: "DELETE" }),
    bulkCreate: (data: Hime[]) =>
      fetchApi<Hime[]>("/hime/bulk", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  // Cast
  cast: {
    list: () => fetchApi<Cast[]>("/cast"),
    get: (id: number) => fetchApi<Cast>(`/cast/${id}`),
    create: (data: FormData | Record<string, unknown>) =>
      fetchApi<Cast>("/cast", {
        method: "POST",
        body: data instanceof FormData ? data : JSON.stringify(data),
      }),
    update: (id: number, data: FormData | Record<string, unknown>) =>
      fetchApi<Cast>(`/cast/${id}`, {
        method: "PUT",
        body: data instanceof FormData ? data : JSON.stringify(data),
      }),
    delete: (id: number) => fetchApi<void>(`/cast/${id}`, { method: "DELETE" }),
    bulkCreate: (data: Cast[]) =>
      fetchApi<Cast[]>("/cast/bulk", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  // Table
  table: {
    list: () => fetchApi<TableRecordWithDetails[]>("/table"),
    get: (id: number) => fetchApi<TableRecordWithDetails>(`/table/${id}`),
    create: (data: TableFormData) =>
      fetchApi<TableRecordWithDetails>("/table", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: number, data: Partial<TableFormData>) =>
      fetchApi<TableRecordWithDetails>(`/table/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      fetchApi<void>(`/table/${id}`, { method: "DELETE" }),
    bulkCreate: (data: TableFormData[]) =>
      fetchApi<TableRecordWithDetails[]>("/table/bulk", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  // Schedule
  schedule: {
    list: () => fetchApi<ScheduleWithHime[]>("/schedule"),
    get: (id: number) => fetchApi<ScheduleWithHime>(`/schedule/${id}`),
    create: (data: ScheduleFormData) =>
      fetchApi<ScheduleWithHime>("/schedule", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: number, data: Partial<ScheduleFormData>) =>
      fetchApi<ScheduleWithHime>(`/schedule/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      fetchApi<void>(`/schedule/${id}`, { method: "DELETE" }),
    bulkCreate: (data: ScheduleFormData[]) =>
      fetchApi<ScheduleWithHime[]>("/schedule/bulk", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  // Visit
  visit: {
    list: () => fetchApi<VisitRecordWithHime[]>("/visit"),
    get: (id: number) => fetchApi<VisitRecord>(`/visit/${id}`),
    create: (data: VisitFormData) =>
      fetchApi<VisitRecord>("/visit", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: number, data: Partial<VisitFormData>) =>
      fetchApi<VisitRecord>(`/visit/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      fetchApi<void>(`/visit/${id}`, { method: "DELETE" }),
    bulkCreate: (data: VisitFormData[]) =>
      fetchApi<VisitRecord[]>("/visit/bulk", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  // Setting
  setting: {
    list: () => fetchApi<Record<string, unknown>[]>("/setting"),
    get: (key: string) => fetchApi<Record<string, unknown>>(`/setting/${key}`),
    create: (data: Record<string, unknown>) =>
      fetchApi<Record<string, unknown>>("/setting", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (key: string, data: Record<string, unknown>) =>
      fetchApi<Record<string, unknown>>(`/setting/${key}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (key: string) =>
      fetchApi<void>(`/setting/${key}`, { method: "DELETE" }),
    bulkCreate: (data: Record<string, unknown>[]) =>
      fetchApi<Record<string, unknown>[]>("/setting/bulk", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  // MyCast (自分のキャスト情報)
  myCast: {
    get: () => fetchApi<Cast>("/my-cast"),
    create: (data: Record<string, unknown>) =>
      fetchApi<Cast>("/my-cast", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (data: Record<string, unknown>) =>
      fetchApi<Cast>("/my-cast", { method: "PUT", body: JSON.stringify(data) }),
    check: () => fetchApi<{ exists: boolean }>("/my-cast/check"),
  },

  // Auth
  auth: {
    changePassword: (data: { currentPassword: string; newPassword: string }) =>
      fetchApi<{ message: string }>("/auth/change-password", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateEmail: (data: { email: string; password: string }) =>
      fetchApi<{ message: string }>("/auth/email", {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    deleteAccount: (data: { password: string }) =>
      fetchApi<{ message: string }>("/auth/account", {
        method: "DELETE",
        body: JSON.stringify(data),
      }),
  },

  // Push Notification
  push: {
    subscribe: (data: { token: string }) =>
      fetchApi<{ message: string }>("/push/subscribe", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    unsubscribe: (token: string) =>
      fetchApi<{ message: string }>(
        `/push/unsubscribe?token=${encodeURIComponent(token)}`,
        { method: "DELETE" }
      ),
    test: () => fetchApi<{ message: string }>("/push/test", { method: "POST" }),
  },

  // AI
  ai: {
    analyzeConversation: (data: {
      selfProfile: string;
      partnerProfile: string;
      goal?: string;
      extraInfo?: string;
      chatLog: string;
    }) =>
      fetchApi<{ result: string }>("/ai/conversation", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  // Menu
  menu: {
    list: () => fetchApi<Menu[]>("/menu"),
    get: (id: number) => fetchApi<Menu>(`/menu/${id}`),
    create: (data: MenuFormData) =>
      fetchApi<Menu>("/menu", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: Partial<MenuFormData>) =>
      fetchApi<Menu>(`/menu/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: number) => fetchApi<void>(`/menu/${id}`, { method: "DELETE" }),
    bulkCreate: (data: MenuFormData[]) =>
      fetchApi<Menu[]>("/menu/bulk", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },
};
