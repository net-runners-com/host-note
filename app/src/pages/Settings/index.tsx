import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSettingsStore } from "../../stores/settingsStore";
import { useAuthStore } from "../../stores/authStore";
import { api } from "../../utils/api";
import { Cast } from "../../types/cast";
import { toast } from "react-toastify";
import { logError } from "../../utils/errorHandler";
import { Card } from "../../components/common/Card";
import { Loading } from "../../components/common/Loading";
import { Button } from "../../components/common/Button";
import { notificationService } from "../../utils/notificationService";

const themes = [
  { value: "lokat-original", label: "Lokat オリジナル" },
  { value: "dark", label: "ダークモード" },
  { value: "light", label: "ライトモード" },
  { value: "midnight", label: "ミッドナイト" },
  { value: "champagne", label: "シャンパン" },
  { value: "sakura", label: "桜" },
  { value: "ocean", label: "オーシャン" },
  { value: "sunset", label: "サンセット" },
  { value: "forest", label: "フォレスト" },
  { value: "rose", label: "ローズゴールド" },
] as const;

export default function SettingsPage() {
  const {
    theme,
    visitNotificationMinutes,
    birthdayNotificationDays,
    loadSettings,
    setTheme,
    setVisitNotificationMinutes,
    setBirthdayNotificationDays,
  } = useSettingsStore();
  const user = useAuthStore((state) => state.user);
  const updateUserEmail = useAuthStore((state) => state.updateUserEmail);
  const deleteAccount = useAuthStore((state) => state.deleteAccount);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [castInfo, setCastInfo] = useState<Cast | null>(null);
  const [castLoading, setCastLoading] = useState(true);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [emailValue, setEmailValue] = useState(user?.email ?? "");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>(notificationService.getPermissionStatus());
  const [isPushSubscribed, setIsPushSubscribed] = useState(false);
  const [pushSubscribing, setPushSubscribing] = useState(false);

  useEffect(() => {
    // 通知権限の状態を監視
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
    // プッシュサブスクリプションの状態を確認
    checkPushSubscription();
  }, []);

  const checkPushSubscription = async () => {
    try {
      // 通知の許可状態を確認
      const permission = notificationService.getPermissionStatus();
      if (permission !== "granted") {
        setIsPushSubscribed(false);
        return;
      }

      const subscription = await notificationService.getPushSubscription();
      setIsPushSubscribed(!!subscription);
    } catch (error: any) {
      // 通知の許可がブロックされている場合はエラーをログに記録しない
      if (
        error?.code === "messaging/permission-blocked" ||
        error?.code === "messaging/permission-default"
      ) {
        setIsPushSubscribed(false);
        return;
      }
      logError(error, {
        component: "SettingsPage",
        action: "checkPushSubscription",
      });
    }
  };

  useEffect(() => {
    const init = async () => {
      await loadSettings();
      await loadMyCast();
      setLoading(false);
    };
    init();
  }, [loadSettings]);

  useEffect(() => {
    setEmailValue(user?.email ?? "");
  }, [user?.email]);

  const loadMyCast = async () => {
    try {
      setCastLoading(true);
      const cast = await api.myCast.get();
      setCastInfo(cast);
    } catch {
      setCastInfo(null);
    } finally {
      setCastLoading(false);
    }
  };

  const handleStartEditEmail = () => {
    setIsEditingEmail(true);
    setEmailValue(user?.email ?? "");
    setEmailPassword("");
  };

  const handleCancelEditEmail = () => {
    setIsEditingEmail(false);
    setEmailValue(user?.email ?? "");
    setEmailPassword("");
  };

  const handleSaveEmail = async () => {
    if (!emailValue) {
      toast.error("メールアドレスを入力してください");
      return;
    }
    if (!emailPassword) {
      toast.error("パスワードを入力してください");
      return;
    }
    if (emailValue === user?.email) {
      setIsEditingEmail(false);
      setEmailPassword("");
      return;
    }
    setEmailSaving(true);
    try {
      await api.auth.updateEmail({
        email: emailValue,
        password: emailPassword,
      });
      updateUserEmail(emailValue);
      toast.success("メールアドレスを更新しました");
      setIsEditingEmail(false);
      setEmailPassword("");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "メールアドレスの更新に失敗しました";
      toast.error(errorMessage);
    } finally {
      setEmailSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("すべての項目を入力してください");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("新しいパスワードが一致しません");
      return;
    }
    setPasswordSaving(true);
    try {
      await api.auth.changePassword({
        currentPassword,
        newPassword,
      });
      toast.success("パスワードを変更しました");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.message || "パスワードの変更に失敗しました");
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleRequestNotificationPermission = async () => {
    try {
      const granted = await notificationService.requestPermission();
      setNotificationPermission(notificationService.getPermissionStatus());
      if (granted) {
        toast.success("通知の許可が得られました");
      } else {
        toast.error("通知の許可が得られませんでした");
      }
    } catch (error) {
      logError(error, {
        component: "SettingsPage",
        action: "requestNotificationPermission",
      });
      toast.error("通知の許可リクエストに失敗しました");
    }
  };

  const handleTestNotification = async () => {
    try {
      // まずローカル通知を表示
      await notificationService.showNotification("こんにちは", {
        body: "これはテスト通知です",
      });

      // プッシュ通知が有効な場合は、バックエンド経由でも送信
      if (isPushSubscribed) {
        try {
          await (api as any).push.test();
          toast.success("ローカル通知とプッシュ通知を送信しました");
        } catch (error: any) {
          logError(error, {
            component: "SettingsPage",
            action: "testPushNotification",
          });
          const errorMessage =
            error?.message || "プッシュ通知の送信に失敗しました";
          if (errorMessage.includes("No tokens registered")) {
            toast.warning(
              "ローカル通知は表示されましたが、プッシュ通知のトークンが登録されていません。プッシュ通知を有効にしてください。"
            );
          } else {
            toast.warning(
              "ローカル通知は表示されましたが、プッシュ通知の送信に失敗しました"
            );
          }
        }
      } else {
        toast.success(
          "ローカル通知を表示しました（プッシュ通知を有効にすると、バックエンドからも送信されます）"
        );
      }
    } catch (error) {
      logError(error, {
        component: "SettingsPage",
        action: "testNotification",
      });
      const errorMessage =
        error instanceof Error ? error.message : "通知の送信に失敗しました";
      toast.error(errorMessage);
    }
  };

  const handleSubscribePush = async () => {
    setPushSubscribing(true);
    try {
      const token = await notificationService.subscribeToPush();
      if (token) {
        setIsPushSubscribed(true);
        toast.success("プッシュ通知を有効にしました");
        // 状態を再確認
        await checkPushSubscription();
      } else {
        toast.error("プッシュ通知の登録に失敗しました");
      }
    } catch (error) {
      logError(error, { component: "SettingsPage", action: "subscribePush" });
      const errorMessage =
        error instanceof Error
          ? error.message
          : "プッシュ通知の登録に失敗しました";
      toast.error(errorMessage);
    } finally {
      setPushSubscribing(false);
    }
  };

  const handleUnsubscribePush = async () => {
    setPushSubscribing(true);
    try {
      const success = await notificationService.unsubscribeFromPush();
      if (success) {
        setIsPushSubscribed(false);
        toast.success("プッシュ通知を無効にしました");
      } else {
        toast.error("プッシュ通知の解除に失敗しました");
      }
    } catch (error) {
      logError(error, { component: "SettingsPage", action: "unsubscribePush" });
      const errorMessage =
        error instanceof Error
          ? error.message
          : "プッシュ通知の解除に失敗しました";
      toast.error(errorMessage);
    } finally {
      setPushSubscribing(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "削除") {
      toast.error("確認のため「削除」と入力してください");
      return;
    }

    setDeleting(true);
    try {
      await deleteAccount();
      toast.success("アカウントを削除しました");
      logout();
      navigate("/login");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "アカウントの削除に失敗しました";
      toast.error(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">設定</h1>

      <Card title="アカウント設定">
        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <span className="text-sm text-[var(--color-text-secondary)]">
                アカウント名
              </span>
              <p className="text-lg font-semibold mt-1">
                {user?.username ?? "未登録"}
              </p>
            </div>
            <div>
              <span className="text-sm text-[var(--color-text-secondary)] block mb-2">
                メールアドレス
              </span>
              {isEditingEmail ? (
                <div className="space-y-3">
                  <input
                    type="email"
                    value={emailValue}
                    onChange={(e) => setEmailValue(e.target.value)}
                    className="w-full px-4 py-2.5 min-h-[44px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-base"
                    placeholder="メールアドレスを入力"
                    disabled={emailSaving}
                    autoComplete="email"
                  />
                  <input
                    type="password"
                    value={emailPassword}
                    onChange={(e) => setEmailPassword(e.target.value)}
                    className="w-full px-4 py-2.5 min-h-[44px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-base"
                    placeholder="現在のパスワードを入力"
                    disabled={emailSaving}
                    autoComplete="current-password"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveEmail}
                      disabled={emailSaving}
                      className="flex-1"
                    >
                      {emailSaving ? "保存中..." : "保存"}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={handleCancelEditEmail}
                      disabled={emailSaving}
                      className="flex-1"
                    >
                      キャンセル
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={handleStartEditEmail}
                  className="cursor-pointer hover:bg-[var(--color-background)] rounded-lg px-3 py-2.5 min-h-[44px] flex items-center transition-colors touch-manipulation"
                  title="クリックして編集"
                >
                  <span className="text-lg font-semibold">
                    {user?.email ?? "-"}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-[var(--color-border)] pt-6">
            <h4 className="text-base font-semibold mb-4">パスワードの変更</h4>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  現在のパスワード
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  placeholder="現在のパスワードを入力"
                  disabled={passwordSaving}
                  autoComplete="current-password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  新しいパスワード
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  placeholder="新しいパスワードを入力（6文字以上）"
                  disabled={passwordSaving}
                  autoComplete="new-password"
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  新しいパスワード（確認）
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  placeholder="新しいパスワードを再入力"
                  disabled={passwordSaving}
                  autoComplete="new-password"
                  minLength={6}
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="px-6 py-2 bg-[var(--color-primary)] text-[var(--color-background)] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {passwordSaving ? "変更中..." : "パスワードを変更"}
                </button>
              </div>
            </form>
          </div>

          <div className="border-t border-[var(--color-border)] pt-6">
            <h4 className="text-base font-semibold mb-4">キャスト情報</h4>
            {castLoading ? (
              <Loading />
            ) : castInfo ? (
              <div className="space-y-4">
                <div>
                  <span className="text-sm text-[var(--color-text-secondary)]">
                    源氏名
                  </span>
                  <p className="text-lg font-semibold mt-1">{castInfo.name}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-[var(--color-text-secondary)]">
                      誕生日
                    </span>
                    <p className="mt-1">{castInfo.birthday || "-"}</p>
                  </div>
                  <div>
                    <span className="text-sm text-[var(--color-text-secondary)]">
                      シャンパンコールの歌
                    </span>
                    <p className="mt-1">{castInfo.champagneCallSong || "-"}</p>
                  </div>
                </div>
                {castInfo.id && (
                  <div className="pt-2">
                    <Link
                      to={`/cast/${castInfo.id}`}
                      className="text-[var(--color-primary)] hover:underline text-sm font-medium"
                    >
                      キャスト詳細ページを見る →
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <p>
                  キャスト情報が登録されていません。ログアウトして再度ログインすると登録フローが表示されます。
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card title="アプリ設定">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">テーマ</label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as typeof theme)}
              className="w-full px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              {themes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <Card title="通知設定">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">通知権限</label>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-sm text-[var(--color-text-secondary)]">
                状態:{" "}
                {notificationPermission === "granted"
                  ? "許可済み"
                  : notificationPermission === "denied"
                    ? "拒否"
                    : "未設定"}
              </span>
            </div>
            {notificationPermission !== "granted" && (
              <Button
                onClick={handleRequestNotificationPermission}
                variant="secondary"
                className="w-full sm:w-auto mb-3"
              >
                通知の許可をリクエスト
              </Button>
            )}
            {notificationPermission === "granted" && (
              <div className="space-y-3">
                <Button
                  onClick={handleTestNotification}
                  variant="primary"
                  className="w-full sm:w-auto"
                >
                  テスト通知を送信
                </Button>
                {notificationService.isPushSupported() && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-[var(--color-text-secondary)]">
                        プッシュ通知: {isPushSubscribed ? "有効" : "無効"}
                      </span>
                    </div>
                    {!isPushSubscribed ? (
                      <Button
                        onClick={handleSubscribePush}
                        variant="primary"
                        disabled={pushSubscribing}
                        className="w-full sm:w-auto"
                      >
                        {pushSubscribing
                          ? "登録中..."
                          : "プッシュ通知を有効にする"}
                      </Button>
                    ) : (
                      <Button
                        onClick={handleUnsubscribePush}
                        variant="secondary"
                        disabled={pushSubscribing}
                        className="w-full sm:w-auto"
                      >
                        {pushSubscribing
                          ? "解除中..."
                          : "プッシュ通知を無効にする"}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              来店予定通知（分前）
            </label>
            <input
              type="number"
              value={visitNotificationMinutes}
              onChange={(e) =>
                setVisitNotificationMinutes(parseInt(e.target.value) || 30)
              }
              min="0"
              max="1440"
              className="w-full px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              誕生日通知（日前）
            </label>
            <input
              type="number"
              value={birthdayNotificationDays}
              onChange={(e) =>
                setBirthdayNotificationDays(parseInt(e.target.value) || 1)
              }
              min="0"
              max="30"
              className="w-full px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
        </div>
      </Card>

      <Card title="アプリ情報">
        <div className="space-y-2">
          <p className="text-sm text-[var(--color-text-secondary)]">
            バージョン
          </p>
          <p className="font-medium">1.0.0</p>
        </div>
      </Card>

      {/* アカウント削除 */}
      <Card>
        <h2 className="text-xl font-bold mb-4 text-red-500">アカウント削除</h2>
        <p className="text-sm text-[var(--color-text-secondary)] mb-4">
          アカウントを削除すると、すべてのデータが永久に削除され、復元できません。
        </p>
        <Button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          アカウントを削除
        </Button>
      </Card>

      {/* 削除確認モーダル */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-[var(--color-surface)] rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-xl font-bold mb-4 text-red-500">
              アカウントを削除しますか？
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] mb-4">
              この操作は取り消せません。すべてのデータが永久に削除されます。
            </p>


            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                確認のため「削除」と入力してください
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="削除"
                disabled={deleting}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText("");
                }}
                disabled={deleting}
              >
                キャンセル
              </Button>
              <Button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting || deleteConfirmText !== "削除"}
                className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? "削除中..." : "アカウントを削除"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
