import { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Loading } from "../../components/common/Loading";
import { toast } from "react-toastify";
import { useAuthStore } from "../../stores/authStore";
import { FaUser, FaLock, FaEnvelope } from "react-icons/fa";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, isLoading } = useAuthStore();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!username || !email || !password || !confirmPassword) {
      toast.error("全ての項目を入力してください");
      return;
    }

    if (!email.includes("@")) {
      toast.error("有効なメールアドレスを入力してください");
      return;
    }

    if (username.length < 3) {
      toast.error("ユーザー名は3文字以上で入力してください");
      return;
    }

    if (password.length < 6) {
      toast.error("パスワードは6文字以上で入力してください");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("パスワードが一致しません");
      return;
    }

    try {
      await register(username, email, password);
      toast.success("アカウントを作成しました");
      navigate("/");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "アカウント作成に失敗しました"
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] px-4">
      <div className="w-full max-w-md">
        <Card>
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-2">HostNote</h1>
              <p className="text-[var(--color-text-secondary)]">新規登録</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  <FaEnvelope className="inline mr-2" />
                  メールアドレス
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  placeholder="メールアドレスを入力"
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>

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
                  placeholder="ユーザー名を入力（3文字以上）"
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
                  placeholder="パスワードを入力（6文字以上）"
                  disabled={isLoading}
                  autoComplete="new-password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  <FaLock className="inline mr-2" />
                  パスワード（確認）
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  placeholder="パスワードを再入力"
                  disabled={isLoading}
                  autoComplete="new-password"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full"
                variant="primary"
              >
                アカウント作成
              </Button>
            </form>

            <div className="text-center text-sm">
              <p className="text-[var(--color-text-secondary)]">
                既にアカウントをお持ちの方は{" "}
                <Link
                  to="/auth/login"
                  className="text-[var(--color-primary)] hover:underline"
                >
                  ログイン
                </Link>
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
