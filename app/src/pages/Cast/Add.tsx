import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCastStore } from "../../stores/castStore";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { PhotoUpload } from "../../components/common/PhotoUpload";
import { SnsInput } from "../../components/common/SnsInput";
import { ImageCropUpload } from "../../components/common/ImageCrop";
import { CastFormData } from "../../types/cast";
import { toast } from "react-toastify";
import { logError } from "../../utils/errorHandler";

export default function CastAddPage() {
  const navigate = useNavigate();
  const { addCast } = useCastStore();
  const [formData, setFormData] = useState<CastFormData>({
    name: "",
    snsInfo: {},
  });
  const [iconPhoto, setIconPhoto] = useState<string | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("名前を入力してください");
      return;
    }

    try {
      await addCast({
        name: formData.name,
        photoUrl: iconPhoto,
        photos: photos,
        snsInfo: formData.snsInfo || null,
        birthday: formData.birthday || null,
        age: formData.age || null,
        champagneCallSong: formData.champagneCallSong || null,
        drinkPreference: formData.drinkPreference || null,
        favoriteDrinkId: formData.favoriteDrinkId || null,
        ice: formData.ice || null,
        carbonation: formData.carbonation || null,
        favoriteMixerId: formData.favoriteMixerId || null,
        smokes: formData.smokes || null,
        tobaccoType: formData.tobaccoType || null,
        memos: [],
      });
      toast.success("キャストを追加しました");
      navigate("/cast");
    } catch (error) {
      toast.error("追加に失敗しました");
      logError(error, { component: "CastAddPage", action: "handleSubmit" });
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <h1 className="text-2xl font-bold mb-6">キャストを追加</h1>
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
            <label className="block text-sm font-medium mb-2">
              シャンパンコールの歌
            </label>
            <input
              type="text"
              value={formData.champagneCallSong || ""}
              onChange={(e) =>
                setFormData({ ...formData, champagneCallSong: e.target.value })
              }
              placeholder="例: 乾杯の歌、Happy Birthday など"
              className="w-full px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>

          <div className="flex gap-2 justify-center">
            <Button type="submit">保存</Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate("/cast")}
            >
              キャンセル
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
