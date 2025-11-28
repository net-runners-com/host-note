import React, { useState, useEffect } from "react";
import { useHimeStore } from "../../stores/himeStore";
import { useCastStore } from "../../stores/castStore";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { PhotoUpload } from "../../components/common/PhotoUpload";
import { SnsInput } from "../../components/common/SnsInput";
import { ImageCropUpload } from "../../components/common/ImageCrop";
import { HimeFormData } from "../../types/hime";
import { toast } from "react-toastify";
import { logError } from "../../utils/errorHandler";
import { useMenuStore } from "../../stores/menuStore";
import { useOptionStore } from "../../stores/optionStore";

interface HimeAddModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export function HimeAddModal({ onClose, onSuccess }: HimeAddModalProps) {
  const { addHime } = useHimeStore();
  const { castList, loadCastList } = useCastStore();
  const { menuList, loadMenuList, getMenusByCategory } = useMenuStore();
  const {
    drinkPreferenceOptions,
    iceOptions,
    carbonationOptions,
    tobaccoTypeOptions,
    loadOptions,
  } = useOptionStore();
  const [formData, setFormData] = useState<HimeFormData>({
    name: "",
    isFirstVisit: false,
    snsInfo: {},
  });
  const [iconPhoto, setIconPhoto] = useState<string | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);

  useEffect(() => {
    loadCastList();
    if (menuList.length === 0) {
      loadMenuList();
    }
    loadOptions();
  }, [loadCastList, menuList.length, loadMenuList, loadOptions]);

  const menusByCategory = getMenusByCategory();
  const drinkMenus = [
    ...(menusByCategory["ボトル系"] || []),
    ...(menusByCategory["缶もの"] || []),
  ];
  const mixerMenus = menusByCategory["割物"] || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("名前を入力してください");
      return;
    }

    try {
      await addHime({
        name: formData.name,
        photoUrl: iconPhoto,
        photos: photos,
        snsInfo: formData.snsInfo || null,
        birthday: formData.birthday || null,
        age: formData.age || null,
        isFirstVisit: formData.isFirstVisit,
        tantoCastId: formData.tantoCastId || null,
        drinkPreference: formData.drinkPreference || null,
        favoriteDrinkId: formData.favoriteDrinkId || null,
        ice: formData.ice || null,
        carbonation: formData.carbonation || null,
        mixerPreference: null,
        favoriteMixerId: formData.favoriteMixerId || null,
        smokes: formData.smokes ?? null,
        tobaccoType: formData.smokes ? formData.tobaccoType || null : null,
        memos: [],
      });
      toast.success("姫を追加しました");
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error) {
      toast.error("追加に失敗しました");
      logError(error, { component: "HimeAddModal", action: "handleSubmit" });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <h2 className="text-xl font-bold">姫を追加</h2>
          <Button variant="ghost" onClick={onClose}>
            ✕
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
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
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                required
              />
            </div>

            <PhotoUpload
              photos={photos}
              onPhotosChange={setPhotos}
              label="写真"
              multiple={true}
            />

            <SnsInput
              snsInfo={formData.snsInfo}
              onChange={(snsInfo) => setFormData({ ...formData, snsInfo })}
            />

            <div>
              <label className="block text-sm font-medium mb-2">誕生日</label>
              <input
                type="date"
                value={formData.birthday || ""}
                onChange={(e) =>
                  setFormData({ ...formData, birthday: e.target.value })
                }
                className="w-full px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">年齢</label>
              <input
                type="number"
                value={formData.age || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    age: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                className="w-full px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                担当キャスト
              </label>
              <select
                value={formData.tantoCastId || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tantoCastId: e.target.value
                      ? parseInt(e.target.value)
                      : undefined,
                  })
                }
                className="w-full px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              >
                <option value="">選択してください</option>
                {castList.map((cast) => (
                  <option key={cast.id} value={cast.id}>
                    {cast.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                お酒の濃さ
              </label>
              <select
                value={formData.drinkPreference || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    drinkPreference: e.target.value || undefined,
                  })
                }
                className="w-full px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
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
                value={formData.favoriteDrinkId || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    favoriteDrinkId: e.target.value
                      ? parseInt(e.target.value)
                      : undefined,
                  })
                }
                className="w-full px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
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
                value={formData.ice || ""}
                onChange={(e) =>
                  setFormData({ ...formData, ice: e.target.value || undefined })
                }
                className="w-full px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
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
                value={formData.carbonation || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    carbonation: e.target.value || undefined,
                  })
                }
                className="w-full px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
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
                value={formData.favoriteMixerId || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    favoriteMixerId: e.target.value
                      ? parseInt(e.target.value)
                      : undefined,
                  })
                }
                className="w-full px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
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
                  formData.smokes === undefined
                    ? ""
                    : formData.smokes
                      ? "吸う"
                      : "吸わない"
                }
                onChange={(e) => {
                  const smokes =
                    e.target.value === "吸う"
                      ? true
                      : e.target.value === "吸わない"
                        ? false
                        : undefined;
                  setFormData({
                    ...formData,
                    smokes: smokes,
                    tobaccoType: smokes ? formData.tobaccoType : undefined,
                  });
                }}
                className="w-full px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              >
                <option value="">選択してください</option>
                <option value="吸う">吸う</option>
                <option value="吸わない">吸わない</option>
              </select>
            </div>

            {formData.smokes === true && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  タバコの種類
                </label>
                <select
                  value={formData.tobaccoType || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tobaccoType: e.target.value || undefined,
                    })
                  }
                  className="w-full px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
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

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isFirstVisit"
                checked={formData.isFirstVisit}
                onChange={(e) =>
                  setFormData({ ...formData, isFirstVisit: e.target.checked })
                }
                className="w-4 h-4 text-[var(--color-primary)] bg-[var(--color-background)] border-[var(--color-border)] rounded focus:ring-[var(--color-primary)]"
              />
              <label htmlFor="isFirstVisit" className="ml-2 text-sm">
                初回
              </label>
            </div>

            <div className="flex gap-2 justify-center pt-4 border-t border-[var(--color-border)]">
              <Button type="submit">保存</Button>
              <Button type="button" variant="secondary" onClick={onClose}>
                キャンセル
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
