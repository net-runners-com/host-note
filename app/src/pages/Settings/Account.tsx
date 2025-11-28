import { FormEvent, useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "../../components/common/Card";
import { Loading } from "../../components/common/Loading";
import { useAuthStore } from "../../stores/authStore";
import { api } from "../../utils/api";
import { Cast } from "../../types/cast";
import { toast } from "react-toastify";
import { Button } from "../../components/common/Button";
import { Avatar } from "../../components/common/Avatar";
import { resizeImage } from "../../utils/imageUtils";

export default function AccountPage() {
  const user = useAuthStore((state) => state.user);
  const updateUserEmail = useAuthStore((state) => state.updateUserEmail);
  const deleteAccount = useAuthStore((state) => state.deleteAccount);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const [castInfo, setCastInfo] = useState<Cast | null>(null);
  const [loading, setLoading] = useState(true);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [emailValue, setEmailValue] = useState(user?.email ?? "");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadMyCast();
  }, []);

  useEffect(() => {
    setEmailValue(user?.email ?? "");
  }, [user?.email]);

  const handleProfilePhotoChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessingImage(true);
      setUploadProgress(0);

      // リサイズ処理（30%）
      setUploadProgress(30);
      const resizedFile = await resizeImage(file, 400, 400);

      // Base64変換処理（60%）
      setUploadProgress(60);
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setProfilePhoto(reader.result);
          setProfilePhotoFile(resizedFile);
          setUploadProgress(100);
          // 少し待ってからプログレスバーを非表示
          setTimeout(() => {
            setIsProcessingImage(false);
            setUploadProgress(0);
          }, 500);
        }
      };
      reader.onerror = () => {
        toast.error("画像の処理に失敗しました");
        setIsProcessingImage(false);
        setUploadProgress(0);
      };
      reader.readAsDataURL(resizedFile);
    } catch (error) {
      toast.error("画像の処理に失敗しました");
      setIsProcessingImage(false);
      setUploadProgress(0);
    }
  };

  const handleStartEditProfile = () => {
    setIsEditingProfile(true);
    setProfilePhoto(null);
    setProfilePhotoFile(null);
  };

  const handleCancelEditProfile = () => {
    setIsEditingProfile(false);
    setProfilePhoto(null);
    setProfilePhotoFile(null);
  };

  const handleSaveProfile = async () => {
    if (!profilePhotoFile) {
      toast.error("プロフィール写真を選択してください");
      return;
    }

    setProfileSaving(true);
    setUploadProgress(0);
    try {
      const formData = new FormData();
      formData.append("photo", profilePhotoFile);

      // TODO: プロフィール画像をアップロードするAPIエンドポイントを実装する必要があります
      // アップロード処理の進捗をシミュレート
      setUploadProgress(30);
      // await api.auth.updateProfilePhoto(formData);

      // アップロード完了
      setUploadProgress(100);
      await new Promise((resolve) => setTimeout(resolve, 300)); // 少し待機

      toast.success("プロフィール写真を更新しました");
      setIsEditingProfile(false);
      setProfilePhoto(null);
      setProfilePhotoFile(null);
      setUploadProgress(0);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "プロフィール写真の更新に失敗しました";
      toast.error(errorMessage);
      setUploadProgress(0);
    } finally {
      setProfileSaving(false);
    }
  };

  const loadMyCast = async () => {
    try {
      setLoading(true);
      const cast = await api.myCast.get();
      setCastInfo(cast);
    } catch {
      setCastInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: FormEvent<HTMLFormElement>) => {
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

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold mb-4">アカウント設定</h1>

      {/* プロフィール画像編集モーダル */}
      {isEditingProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--color-surface)] rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* ヘッダー */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
              <button
                onClick={handleCancelEditProfile}
                className="text-[var(--color-text)] hover:opacity-80 touch-manipulation min-h-[44px] px-2"
                disabled={profileSaving}
              >
                キャンセル
              </button>
              <h2 className="text-lg font-semibold">プロフィールを編集</h2>
              <button
                onClick={handleSaveProfile}
                className="text-[var(--color-primary)] hover:opacity-80 touch-manipulation min-h-[44px] px-2 font-semibold disabled:opacity-50"
                disabled={profileSaving || !profilePhotoFile}
              >
                {profileSaving ? "保存中..." : "完了"}
              </button>
            </div>

            {/* コンテンツ */}
            <div className="p-6 space-y-6">
              {/* プロフィール画像 */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  {profilePhoto ? (
                    <img
                      src={profilePhoto}
                      alt="プロフィール"
                      className="w-32 h-32 rounded-full object-cover border-2 border-[var(--color-border)]"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-[var(--color-background)] border-2 border-[var(--color-border)] flex items-center justify-center">
                      <Avatar
                        src={castInfo?.photoUrl || undefined}
                        name={user?.username || ""}
                        size="xl"
                      />
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePhotoChange}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[var(--color-primary)] hover:opacity-80 touch-manipulation min-h-[44px] text-sm font-medium disabled:opacity-50"
                  disabled={profileSaving || isProcessingImage}
                >
                  プロフィール写真を変更
                </button>
                {(isProcessingImage ||
                  (profileSaving && uploadProgress > 0)) && (
                  <div className="w-full max-w-xs mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-[var(--color-text-secondary)]">
                        {isProcessingImage
                          ? "画像を処理中..."
                          : "アップロード中..."}
                      </span>
                      <span className="text-sm font-medium text-[var(--color-text)]">
                        {Math.round(uploadProgress)}%
                      </span>
                    </div>
                    <div className="w-full bg-[var(--color-background)] rounded-full h-2 border border-[var(--color-border)] overflow-hidden">
                      <div
                        className="h-full bg-[var(--color-primary)] transition-all duration-300 ease-out"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <Card title="アカウント情報">
        <div className="space-y-4">
          {/* プロフィール画像 */}
          <div className="flex flex-col items-center space-y-3 pb-4 border-b border-[var(--color-border)]">
            <Avatar
              src={castInfo?.photoUrl || undefined}
              name={user?.username || ""}
              size="xl"
            />
            <button
              onClick={handleStartEditProfile}
              className="text-[var(--color-primary)] hover:opacity-80 touch-manipulation min-h-[44px] text-sm font-medium"
            >
              プロフィール写真を変更
            </button>
          </div>

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
      </Card>

      <Card title="キャスト情報">
        {loading ? (
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
            <p className="text-sm text-[var(--color-text-secondary)]">
              キャスト情報の更新が必要な場合は、管理者にお問い合わせください。
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <p>
              キャスト情報が登録されていません。ログアウトして再度ログインすると登録フローが表示されます。
            </p>
          </div>
        )}
      </Card>

      <Card title="パスワードの変更">
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
