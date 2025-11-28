import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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

export default function HimeAddPage() {
  const navigate = useNavigate();
  const { addHime } = useHimeStore();
  const { castList, loadCastList } = useCastStore();
  const { menuList, loadMenuList, getMenusByCategory } = useMenuStore();
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
  }, [loadCastList, menuList.length, loadMenuList]);

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
        mixerPreference: formData.mixerPreference || null,
        favoriteMixerId: formData.favoriteMixerId || null,
        smokes: formData.smokes ?? null,
        tobaccoType: formData.smokes ? formData.tobaccoType || null : null,
        memos: [],
      });
      toast.success("姫を追加しました");
      navigate("/hime");
    } catch (error) {
      toast.error("追加に失敗しました");
      logError(error, { component: "HimeAddPage", action: "handleSubmit" });
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <h1 className="text-2xl font-bold mb-6">姫を追加</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
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

          <ImageCropUpload
            value={iconPhoto}
            onChange={setIconPhoto}
            label="アイコン写真"
            circular={true}
            size={120}
          />

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
              指名キャスト
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
            <label className="block text-sm font-medium mb-2">お酒の濃さ</label>
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
              <option value="超薄め">超薄め</option>
              <option value="薄め">薄め</option>
              <option value="普通">普通</option>
              <option value="濃いめ">濃いめ</option>
              <option value="超濃いめ">超濃いめ</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">好きなお酒</label>
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
              <option value="1個">1個</option>
              <option value="2~3個">2~3個</option>
              <option value="満タン">満タン</option>
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
              <option value="OK">OK</option>
              <option value="NG">NG</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">割物の好み</label>
            <input
              type="text"
              value={formData.mixerPreference || ""}
              onChange={(e) =>
                setFormData({ ...formData, mixerPreference: e.target.value })
              }
              className="w-full px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">好きな割物</label>
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
                <option value="紙タバコ">紙タバコ</option>
                <option value="アイコス">アイコス</option>
                <option value="両方">両方</option>
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

          <div className="flex gap-2 justify-center">
            <Button type="submit">保存</Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate("/hime")}
            >
              キャンセル
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
