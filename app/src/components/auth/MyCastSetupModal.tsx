import { useState, FormEvent, useEffect } from "react";
import { toast } from "react-toastify";
import { api } from "../../utils/api";
import { useCastStore } from "../../stores/castStore";
import { Cast } from "../../types/cast";
import { PhotoUpload } from "../common/PhotoUpload";
import { SnsInput } from "../common/SnsInput";
import { ImageCropUpload } from "../common/ImageCrop";
import { useMenuStore } from "../../stores/menuStore";
import { useOptionStore } from "../../stores/optionStore";

interface MyCastSetupModalProps {
  onSuccess: () => void;
}

export default function MyCastSetupModal({ onSuccess }: MyCastSetupModalProps) {
  const [saving, setSaving] = useState(false);
  const loadCastList = useCastStore((state) => state.loadCastList);
  const { menuList, loadMenuList, getMenusByCategory } = useMenuStore();
  const {
    drinkPreferenceOptions,
    iceOptions,
    carbonationOptions,
    tobaccoTypeOptions,
    loadOptions,
  } = useOptionStore();
  const [castInfo, setCastInfo] = useState<
    Omit<Cast, "id" | "createdAt" | "updatedAt">
  >({
    name: "",
    birthday: null,
    age: null,
    champagneCallSong: null,
    photoUrl: null,
    photos: [],
    snsInfo: null,
    drinkPreference: null,
    favoriteDrinkId: null,
    ice: null,
    carbonation: null,
    favoriteMixerId: null,
    smokes: null,
    tobaccoType: null,
    memos: [],
  });
  const [iconPhoto, setIconPhoto] = useState<string | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);

  useEffect(() => {
    if (menuList.length === 0) {
      loadMenuList();
    }
    loadOptions();
  }, [menuList.length, loadMenuList, loadOptions]);

  const menusByCategory = getMenusByCategory();
  const drinkMenus = [
    ...(menusByCategory["ボトル系"] || []),
    ...(menusByCategory["缶もの"] || []),
  ];
  const mixerMenus = menusByCategory["割物"] || [];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!castInfo.name.trim()) {
      toast.error("源氏名を入力してください");
      return;
    }

    setSaving(true);
    try {
      await api.myCast.create({
        name: castInfo.name,
        photoUrl: iconPhoto,
        photos: photos,
        snsInfo: castInfo.snsInfo || null,
        birthday: castInfo.birthday,
        age: castInfo.age,
        champagneCallSong: castInfo.champagneCallSong,
        drinkPreference: castInfo.drinkPreference,
        favoriteDrinkId: castInfo.favoriteDrinkId,
        ice: castInfo.ice,
        carbonation: castInfo.carbonation,
        favoriteMixerId: castInfo.favoriteMixerId,
        smokes: castInfo.smokes ?? null,
        tobaccoType: castInfo.smokes ? castInfo.tobaccoType || null : null,
        memos: [],
      });
      await loadCastList();
      toast.success("キャスト情報を登録しました");
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "キャスト情報の保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-[var(--color-surface)] rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[var(--color-surface)] border-b border-[var(--color-border)] px-6 py-4">
          <h2 className="text-2xl font-bold">自分のキャスト情報を登録</h2>
        </div>

        <div className="p-6">
          <div className="mb-4 p-4 bg-[var(--color-warning)]/10 border border-[var(--color-warning)] rounded-lg">
            <p className="text-sm text-[var(--color-text)]">
              自分のキャスト情報を登録してください。名前は必須項目です。
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <ImageCropUpload
              value={iconPhoto}
              onChange={setIconPhoto}
              label="アイコン写真"
              circular={true}
              size={120}
            />

            <div>
              <label className="block text-sm font-medium mb-2">
                名前 <span className="text-[var(--color-error)]">*</span>
              </label>
              <input
                type="text"
                value={castInfo.name}
                onChange={(e) =>
                  setCastInfo({ ...castInfo, name: e.target.value })
                }
                className="w-full px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                placeholder="源氏名を入力"
                required
                disabled={saving}
                autoFocus
              />
            </div>

            <PhotoUpload
              photos={photos}
              onPhotosChange={setPhotos}
              label="写真"
              multiple={true}
            />

            <SnsInput
              snsInfo={castInfo.snsInfo || {}}
              onChange={(snsInfo) => setCastInfo({ ...castInfo, snsInfo })}
            />

            <div>
              <label className="block text-sm font-medium mb-2">誕生日</label>
              <input
                type="date"
                value={castInfo.birthday || ""}
                onChange={(e) =>
                  setCastInfo({ ...castInfo, birthday: e.target.value || null })
                }
                className="w-full px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                disabled={saving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">年齢</label>
              <input
                type="number"
                value={castInfo.age || ""}
                onChange={(e) =>
                  setCastInfo({
                    ...castInfo,
                    age: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
                className="w-full px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                disabled={saving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                シャンパンコールの歌
              </label>
              <input
                type="text"
                value={castInfo.champagneCallSong || ""}
                onChange={(e) =>
                  setCastInfo({
                    ...castInfo,
                    champagneCallSong: e.target.value || null,
                  })
                }
                className="w-full px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                placeholder="例: 乾杯の歌、Happy Birthday など"
                disabled={saving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                お酒の濃さ
              </label>
              <select
                value={castInfo.drinkPreference || ""}
                onChange={(e) =>
                  setCastInfo({
                    ...castInfo,
                    drinkPreference: e.target.value || null,
                  })
                }
                className="w-full px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                disabled={saving}
              >
                <option value="">選択してください</option>
                {drinkPreferenceOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                好きなお酒
              </label>
              <select
                value={castInfo.favoriteDrinkId || ""}
                onChange={(e) =>
                  setCastInfo({
                    ...castInfo,
                    favoriteDrinkId: e.target.value
                      ? parseInt(e.target.value)
                      : null,
                  })
                }
                className="w-full px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                disabled={saving}
              >
                <option value="">選択してください</option>
                {drinkMenus.map((menu) => (
                  <option key={menu.id} value={menu.id}>
                    {menu.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">氷</label>
              <select
                value={castInfo.ice || ""}
                onChange={(e) =>
                  setCastInfo({ ...castInfo, ice: e.target.value || null })
                }
                className="w-full px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                disabled={saving}
              >
                <option value="">選択してください</option>
                {iceOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">炭酸</label>
              <select
                value={castInfo.carbonation || ""}
                onChange={(e) =>
                  setCastInfo({
                    ...castInfo,
                    carbonation: e.target.value || null,
                  })
                }
                className="w-full px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                disabled={saving}
              >
                <option value="">選択してください</option>
                {carbonationOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                好きな割物
              </label>
              <select
                value={castInfo.favoriteMixerId || ""}
                onChange={(e) =>
                  setCastInfo({
                    ...castInfo,
                    favoriteMixerId: e.target.value
                      ? parseInt(e.target.value)
                      : null,
                  })
                }
                className="w-full px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                disabled={saving}
              >
                <option value="">選択してください</option>
                {mixerMenus.map((menu) => (
                  <option key={menu.id} value={menu.id}>
                    {menu.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">タバコ</label>
              <select
                value={
                  castInfo.smokes === null || castInfo.smokes === undefined
                    ? ""
                    : castInfo.smokes
                      ? "吸う"
                      : "吸わない"
                }
                onChange={(e) => {
                  const smokes =
                    e.target.value === "吸う"
                      ? true
                      : e.target.value === "吸わない"
                        ? false
                        : null;
                  setCastInfo({
                    ...castInfo,
                    smokes: smokes,
                    tobaccoType: smokes ? castInfo.tobaccoType : null,
                  });
                }}
                className="w-full px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                disabled={saving}
              >
                <option value="">選択してください</option>
                <option value="吸う">吸う</option>
                <option value="吸わない">吸わない</option>
              </select>
            </div>

            {castInfo.smokes === true && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  タバコの種類
                </label>
                <select
                  value={castInfo.tobaccoType || ""}
                  onChange={(e) =>
                    setCastInfo({
                      ...castInfo,
                      tobaccoType: e.target.value || null,
                    })
                  }
                  className="w-full px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  disabled={saving}
                >
                  <option value="">選択してください</option>
                  {tobaccoTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex gap-2 justify-center pt-4 border-t border-[var(--color-border)]">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-[var(--color-primary)] text-[var(--color-background)] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="inline-block mr-2 h-4 w-4 animate-spin rounded-full border-t-2 border-b-2 border-[var(--color-primary)]"></div>
                    保存中...
                  </>
                ) : (
                  "保存"
                )}
              </button>
              <button
                type="button"
                onClick={onSuccess}
                disabled={saving}
                className="px-6 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                キャンセル
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
