import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
  id: number;
  username: string;
  email: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  loginWithToken: (token: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string
  ) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  updateUserEmail: (email: string | null) => void;
  deleteAccount: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true, // 初期状態をtrueにして、認証確認が完了するまでローディングを表示

      login: async (username: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await fetch(
            `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1"}/auth/login`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ username, password }),
            }
          );

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "ログインに失敗しました");
          }

          const data = await response.json();
          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      loginWithToken: async (token: string) => {
        set({ isLoading: true });
        try {
          // トークンでユーザー情報を取得
          const response = await fetch(
            `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1"}/auth/me`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (!response.ok) {
            throw new Error("トークンが無効です");
          }

          const user = await response.json();
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (username: string, email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await fetch(
            `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1"}/auth/register`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ username, email, password }),
            }
          );

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "アカウント作成に失敗しました");
          }

          const data = await response.json();
          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      checkAuth: async () => {
        const state = useAuthStore.getState();
        if (!state.token) {
          set({ isAuthenticated: false, isLoading: false });
          return;
        }

        set({ isLoading: true });
        try {
          const response = await fetch(
            `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1"}/auth/me`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${state.token}`,
              },
            }
          );

          if (!response.ok) {
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
            });
            return;
          }

          const user = await response.json();
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      updateUserEmail: (email) => {
        set((state) => ({
          user: state.user ? { ...state.user, email } : state.user,
        }));
      },

      deleteAccount: async () => {
        set({ isLoading: true });
        try {
          const response = await fetch(
            `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1"}/auth/account`,
            {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${useAuthStore.getState().token}`,
              },
              body: JSON.stringify({}),
            }
          );

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "アカウントの削除に失敗しました");
          }

          // 削除成功後、ログアウト
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ token: state.token, user: state.user }),
      onRehydrateStorage: () => (state) => {
        // localStorageからトークンが復元された場合、一時的に認証済みとして扱う
        // 実際の認証確認はcheckAuth()で行われる
        if (state && state.token) {
          state.isAuthenticated = true;
          state.isLoading = true; // checkAuth()が完了するまでローディング状態にする
        } else if (state) {
          state.isLoading = false;
        }
      },
    }
  )
);
