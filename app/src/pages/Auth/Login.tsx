import { useState, FormEvent } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Loading } from "../../components/common/Loading";
import { toast } from "react-toastify";
import { useAuthStore } from "../../stores/authStore";
import { FaUser, FaLock } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuthStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      toast.error("ユーザー名とパスワードを入力してください");
      return;
    }

    try {
      await login(username, password);
      toast.success("ログインしました");
      // 元のページに戻る、またはホームに遷移
      const from = (location.state as any)?.from?.pathname || "/";
      navigate(from, { replace: true });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "ログインに失敗しました"
      );
    }
  };

  const { loginWithToken } = useAuthStore();

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        // Googleから取得したアクセストークンをバックエンドに送信
        const apiBaseUrl =
          import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";
        const response = await fetch(`${apiBaseUrl}/auth/google/callback`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ accessToken: tokenResponse.access_token }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Googleログインに失敗しました");
        }

        const data = await response.json();
        await loginWithToken(data.token);
        toast.success("Googleでログインしました");
        const from = (location.state as any)?.from?.pathname || "/";
        navigate(from, { replace: true });
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Googleログインに失敗しました"
        );
      }
    },
    onError: () => {
      toast.error("Googleログインに失敗しました");
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] px-4">
      <div className="w-full max-w-md">
        <Card>
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-2">HostNote</h1>
              <p className="text-[var(--color-text-secondary)]">ログイン</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  <FaUser className="inline mr-2" />
                  ユーザー名
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  placeholder="ユーザー名を入力"
                  disabled={isLoading}
                  autoComplete="username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  <FaLock className="inline mr-2" />
                  パスワード
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  placeholder="パスワードを入力"
                  disabled={isLoading}
                  autoComplete="current-password"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full"
                variant="primary"
              >
                ログイン
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--color-border)]"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[var(--color-surface)] text-[var(--color-text-secondary)]">
                  または
                </span>
              </div>
            </div>

            <Button
              type="button"
              onClick={() => handleGoogleLogin()}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 min-h-[44px]"
              variant="secondary"
            >
              <FcGoogle className="text-xl" />
              Googleでログイン
            </Button>

            <div className="text-center text-sm">
              <p className="text-[var(--color-text-secondary)]">
                アカウントをお持ちでない方は{" "}
                <Link
                  to="/auth/register"
                  className="text-[var(--color-primary)] hover:underline"
                >
                  新規登録
                </Link>
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
