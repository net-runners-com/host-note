import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../../utils/api";
import { Cast } from "../../types/cast";
import { TableRecordWithDetails } from "../../types/table";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import {
  Skeleton,
  SkeletonAvatar,
  SkeletonText,
  SkeletonCard,
} from "../../components/common/Skeleton";
import { format } from "date-fns";
import { ja } from "date-fns/locale/ja";
import { toast } from "react-toastify";
import { logError } from "../../utils/errorHandler";
import { InlineEditable } from "../../components/common/InlineEditable";
import { SnsEditor } from "../../components/common/SnsEditor";
import { ImageCropUpload } from "../../components/common/ImageCrop";
import { useHimeStore } from "../../stores/himeStore";
import { useMenuStore } from "../../stores/menuStore";
import { useOptionStore } from "../../stores/optionStore";
import { fileToBase64 } from "../../utils/imageUtils";
import { TableAddModal } from "../Table/TableAddModal";

export default function CastDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { himeList, loadHimeList } = useHimeStore();
  const { menuList, loadMenuList, getMenusByCategory } = useMenuStore();
  const {
    drinkPreferenceOptions,
    iceOptions,
    carbonationOptions,
    tobaccoTypeOptions,
    loadOptions,
  } = useOptionStore();
  const [cast, setCast] = useState<Cast | null>(null);
  const [tableRecords, setTableRecords] = useState<TableRecordWithDetails[]>(
    []
  );
  const [myCast, setMyCast] = useState<Cast | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [showTableAddModal, setShowTableAddModal] = useState(false);

  useEffect(() => {
    if (menuList.length === 0) {
      loadMenuList();
    }
    loadOptions();
  }, [menuList.length, loadMenuList, loadOptions]);

  const menusByCategory = useMemo(
    () => getMenusByCategory(),
    [getMenusByCategory, menuList]
  );
  const drinkMenus = useMemo(
    () => {
      const bottles = menusByCategory["ボトル系"] || [];
      const cans = menusByCategory["缶もの"] || [];
      const combined = [...bottles, ...cans];
      console.log("drinkMenus:", combined.length, "bottles:", bottles.length, "cans:", cans.length);
      return combined;
    },
    [menusByCategory]
  );
  const mixerMenus = useMemo(
    () => menusByCategory["割物"] || [],
    [menusByCategory]
  );

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const castId = parseInt(id);

      // 並列でデータを取得
      const [castData, tables, myCastData] = await Promise.all([
        api.cast.get(castId),
        api.table.list(),
        api.myCast.get().catch(() => null), // 自分のキャスト情報が存在しない場合は無視
      ]);

      if (!castData) {
        toast.error("キャストが見つかりませんでした");
        navigate("/cast");
        return;
      }
      setCast(castData);
      setMyCast(myCastData);

      // 卓記録を取得（メインキャストまたはヘルプキャストとして参加している卓記録）
      const castTables = tables.filter((table: TableRecordWithDetails) => {
        const isMainCast = table.mainCast?.id === castId;
        const isHelpCast = table.helpCasts?.some((c) => c.id === castId);
        return isMainCast || isHelpCast;
      }) as TableRecordWithDetails[];
      setTableRecords(castTables);
    } catch (error) {
      logError(error, { component: "CastDetailPage", action: "loadData", id });
      toast.error("データの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    if (!id) return;
    loadData();
    loadHimeList();
  }, [id, loadData, loadHimeList]);

  // 共通のフィールド更新ハンドラー
  const updateField = useCallback(
    async <K extends keyof Cast>(
      field: K,
      value: Cast[K] | null,
      successMessage: string
    ) => {
      if (!cast?.id) return;
      try {
        await api.cast.update(cast.id, { [field]: value } as any);
        setCast({ ...cast, [field]: value });
        toast.success(successMessage);
      } catch (error) {
        logError(error, {
          component: "CastDetailPage",
          action: `update${String(field)}`,
        });
        toast.error("更新に失敗しました");
      }
    },
    [cast]
  );

  // 各フィールドの更新ハンドラー
  const handleUpdateName = useCallback(
    (newName: string) => updateField("name", newName, "名前を更新しました"),
    [updateField]
  );

  const handleUpdateBirthday = useCallback(
    (newBirthday: string) =>
      updateField("birthday", newBirthday || null, "誕生日を更新しました"),
    [updateField]
  );

  const handleUpdateChampagneCallSong = useCallback(
    (newValue: string) =>
      updateField(
        "champagneCallSong",
        newValue || null,
        "シャンパンコールの歌を更新しました"
      ),
    [updateField]
  );

  const handleUpdateAge = useCallback(
    async (newValue: string) => {
      const age = newValue ? parseInt(newValue) : null;
      await updateField("age", age, "年齢を更新しました");
    },
    [updateField]
  );

  const handleUpdateDrinkPreference = useCallback(
    (newValue: string) =>
      updateField(
        "drinkPreference",
        newValue || null,
        "お酒の濃さを更新しました"
      ),
    [updateField]
  );

  const handleUpdateFavoriteDrinkId = useCallback(
    async (newValue: string) => {
      const favoriteDrinkId = newValue ? parseInt(newValue) : null;
      await updateField(
        "favoriteDrinkId",
        favoriteDrinkId,
        "好きなお酒を更新しました"
      );
    },
    [updateField]
  );

  const handleUpdateIce = useCallback(
    (newValue: string) =>
      updateField("ice", newValue || null, "氷を更新しました"),
    [updateField]
  );

  const handleUpdateCarbonation = useCallback(
    (newValue: string) =>
      updateField("carbonation", newValue || null, "炭酸を更新しました"),
    [updateField]
  );

  const handleUpdateFavoriteMixerId = useCallback(
    async (newValue: string) => {
      const favoriteMixerId = newValue ? parseInt(newValue) : null;
      await updateField(
        "favoriteMixerId",
        favoriteMixerId,
        "好きな割物を更新しました"
      );
    },
    [updateField]
  );

  const handleUpdateSmokes = useCallback(
    async (newValue: string) => {
      if (!cast?.id) return;
      const smokes =
        newValue === "吸う" ? true : newValue === "吸わない" ? false : null;
      try {
        await api.cast.update(cast.id, {
          smokes,
          tobaccoType: smokes ? cast.tobaccoType : null,
        });
        setCast({
          ...cast,
          smokes,
          tobaccoType: smokes ? cast.tobaccoType : null,
        });
        toast.success("タバコ情報を更新しました");
      } catch (error) {
        logError(error, {
          component: "CastDetailPage",
          action: "updateSmokes",
        });
        toast.error("更新に失敗しました");
      }
    },
    [cast]
  );

  const handleUpdateTobaccoType = useCallback(
    (newValue: string) =>
      updateField(
        "tobaccoType",
        newValue || null,
        "タバコの種類を更新しました"
      ),
    [updateField]
  );

  const handleUpdateSnsInfo = useCallback(
    (newSnsInfo: any) =>
      updateField("snsInfo", newSnsInfo, "SNS情報を更新しました"),
    [updateField]
  );

  const handleUpdatePhoto = useCallback(
    async (newPhotoUrl: string | null) => {
      if (!cast?.id) return;
      try {
        await api.cast.update(cast.id, { photoUrl: newPhotoUrl });
        setCast({ ...cast, photoUrl: newPhotoUrl });
        toast.success("プロフィール画像を更新しました");
      } catch (error) {
        logError(error, {
          component: "CastDetailPage",
          action: "updatePhoto",
        });
        toast.error("画像の更新に失敗しました");
      }
    },
    [cast]
  );

  const handleDeleteClick = useCallback(() => {
    setShowDeleteModal(true);
    setDeleteConfirmName("");
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!id || !cast) return;

    if (deleteConfirmName !== cast.name) {
      toast.error("名前が一致しません");
      return;
    }

    setDeleting(true);
    try {
      await api.cast.delete(parseInt(id));
      toast.success("削除しました");
      navigate("/cast");
    } catch (error) {
      logError(error, {
        component: "CastDetailPage",
        action: "handleDelete",
        id,
      });
      toast.error("削除に失敗しました");
      setDeleting(false);
    }
  }, [id, cast, deleteConfirmName, navigate]);

  const handleDeleteCancel = useCallback(() => {
    setShowDeleteModal(false);
    setDeleteConfirmName("");
  }, []);

  if (loading || !cast) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton variant="rectangular" width={80} height={40} />
          <div className="flex gap-2">
            <Skeleton variant="rectangular" width={80} height={40} />
            <Skeleton variant="rectangular" width={80} height={40} />
          </div>
        </div>

        <Card>
          <div className="flex items-start gap-6">
            <SkeletonAvatar size="xl" />
            <div className="flex-1 space-y-4">
              <Skeleton variant="rectangular" width={200} height={32} />
              <SkeletonText lines={4} />
            </div>
          </div>
        </Card>

        <Card title="担当している姫">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  const himeListForCast = himeList.filter((h) => h.tantoCastId === cast.id);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <Button
          variant="ghost"
          onClick={() => navigate("/cast")}
          className="w-full sm:w-auto"
        >
          ← 戻る
        </Button>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => navigate(`/memo?castId=${id}`)}
            className="flex-1 sm:flex-none"
          >
            メモ
          </Button>
        </div>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
          <div className="flex-shrink-0 mx-auto sm:mx-0">
            <ImageCropUpload
              value={cast.photoUrl}
              onChange={handleUpdatePhoto}
              label=""
              circular={true}
              size={120}
            />
          </div>
          <div className="flex-1 w-full space-y-4">
            <InlineEditable
              value={cast.name}
              onSave={handleUpdateName}
              displayComponent={
                <h1 className="text-2xl sm:text-3xl font-bold">{cast.name}</h1>
              }
              inputType="text"
              className="flex-1"
            />
            {/* 基本情報 - モバイルではカード形式 */}
            <div className="block sm:hidden space-y-3">
              <div className="p-3 bg-[var(--color-background)] rounded border border-[var(--color-border)]">
                <div className="text-sm text-[var(--color-text-secondary)] font-medium mb-2">
                  誕生日
                </div>
                <InlineEditable
                  value={
                    cast.birthday
                      ? format(new Date(cast.birthday), "yyyy-MM-dd", {
                          locale: ja,
                        })
                      : ""
                  }
                  onSave={handleUpdateBirthday}
                  displayComponent={
                    <span>
                      {cast.birthday
                        ? format(new Date(cast.birthday), "yyyy年MM月dd日", {
                            locale: ja,
                          })
                        : "クリックして編集"}
                    </span>
                  }
                  inputType="date"
                  placeholder="クリックして編集"
                />
              </div>
              <div className="p-3 bg-[var(--color-background)] rounded border border-[var(--color-border)]">
                <div className="text-sm text-[var(--color-text-secondary)] font-medium mb-2">
                  シャンパンコールの歌
                </div>
                <InlineEditable
                  value={cast.champagneCallSong || ""}
                  onSave={handleUpdateChampagneCallSong}
                  inputType="text"
                  placeholder="クリックして編集"
                />
              </div>
              <div className="p-3 bg-[var(--color-background)] rounded border border-[var(--color-border)]">
                <div className="text-sm text-[var(--color-text-secondary)] font-medium mb-2">
                  年齢
                </div>
                <InlineEditable
                  value={cast.age?.toString() || ""}
                  onSave={handleUpdateAge}
                  inputType="text"
                  placeholder="クリックして編集"
                />
              </div>
              <div className="p-3 bg-[var(--color-background)] rounded border border-[var(--color-border)]">
                <div className="text-sm text-[var(--color-text-secondary)] font-medium mb-2">
                  お酒の濃さ
                </div>
                <InlineEditable
                  value={cast.drinkPreference || ""}
                  onSave={handleUpdateDrinkPreference}
                  inputType="select"
                  options={drinkPreferenceOptions.map((option) => ({
                    value: option,
                    label: option,
                  }))}
                  placeholder="クリックして編集"
                />
              </div>
              <div className="p-3 bg-[var(--color-background)] rounded border border-[var(--color-border)]">
                <div className="text-sm text-[var(--color-text-secondary)] font-medium mb-2">
                  好きなお酒
                </div>
                <InlineEditable
                  value={cast.favoriteDrinkId?.toString() || ""}
                  onSave={handleUpdateFavoriteDrinkId}
                  inputType="select"
                  options={drinkMenus.map((menu) => ({
                    value: menu.id!.toString(),
                    label: menu.name,
                  }))}
                  placeholder="クリックして編集"
                  displayComponent={
                    <span className="text-base">
                      {cast.favoriteDrinkId
                        ? drinkMenus.find((m) => m.id === cast.favoriteDrinkId)
                            ?.name || cast.favoriteDrinkId.toString()
                        : "クリックして編集"}
                    </span>
                  }
                />
              </div>
              <div className="p-3 bg-[var(--color-background)] rounded border border-[var(--color-border)]">
                <div className="text-sm text-[var(--color-text-secondary)] font-medium mb-2">
                  氷
                </div>
                <InlineEditable
                  value={cast.ice || ""}
                  onSave={handleUpdateIce}
                  inputType="select"
                  options={iceOptions.map((option) => ({
                    value: option,
                    label: option,
                  }))}
                  placeholder="クリックして編集"
                />
              </div>
              <div className="p-3 bg-[var(--color-background)] rounded border border-[var(--color-border)]">
                <div className="text-sm text-[var(--color-text-secondary)] font-medium mb-2">
                  炭酸
                </div>
                <InlineEditable
                  value={cast.carbonation || ""}
                  onSave={handleUpdateCarbonation}
                  inputType="select"
                  options={carbonationOptions.map((option) => ({
                    value: option,
                    label: option,
                  }))}
                  placeholder="クリックして編集"
                />
              </div>
              <div className="p-3 bg-[var(--color-background)] rounded border border-[var(--color-border)]">
                <div className="text-sm text-[var(--color-text-secondary)] font-medium mb-2">
                  好きな割物
                </div>
                <InlineEditable
                  value={cast.favoriteMixerId?.toString() || ""}
                  onSave={handleUpdateFavoriteMixerId}
                  inputType="select"
                  options={mixerMenus.map((menu) => ({
                    value: menu.id!.toString(),
                    label: menu.name,
                  }))}
                  placeholder="クリックして編集"
                  displayComponent={
                    <span className="text-base">
                      {cast.favoriteMixerId
                        ? mixerMenus.find((m) => m.id === cast.favoriteMixerId)
                            ?.name || cast.favoriteMixerId.toString()
                        : "クリックして編集"}
                    </span>
                  }
                />
              </div>
              <div className="p-3 bg-[var(--color-background)] rounded border border-[var(--color-border)]">
                <div className="text-sm text-[var(--color-text-secondary)] font-medium mb-2">
                  タバコ
                </div>
                <InlineEditable
                  value={
                    cast.smokes === null
                      ? ""
                      : cast.smokes
                        ? "吸う"
                        : "吸わない"
                  }
                  onSave={handleUpdateSmokes}
                  inputType="select"
                  options={[
                    { value: "", label: "未設定" },
                    { value: "吸う", label: "吸う" },
                    { value: "吸わない", label: "吸わない" },
                  ]}
                  placeholder="クリックして編集"
                />
              </div>
              {cast.smokes === true && (
                <div className="p-3 bg-[var(--color-background)] rounded border border-[var(--color-border)]">
                  <div className="text-sm text-[var(--color-text-secondary)] font-medium mb-2">
                    タバコの種類
                  </div>
                  <InlineEditable
                    value={cast.tobaccoType || ""}
                    onSave={handleUpdateTobaccoType}
                    inputType="select"
                    options={tobaccoTypeOptions.map((option) => ({
                      value: option,
                      label: option,
                    }))}
                    placeholder="クリックして編集"
                  />
                </div>
              )}
              <div className="p-3 bg-[var(--color-background)] rounded border border-[var(--color-border)]">
                <div className="text-sm text-[var(--color-text-secondary)] font-medium mb-2">
                  SNS
                </div>
                <SnsEditor
                  snsInfo={cast.snsInfo}
                  onSave={handleUpdateSnsInfo}
                />
              </div>
            </div>

            {/* デスクトップ用テーブル */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full border-collapse">
                <tbody className="text-sm">
                  <tr className="border-b border-[var(--color-border)]">
                    <td className="py-2 px-4 text-[var(--color-text-secondary)] font-medium w-32">
                      誕生日
                    </td>
                    <td className="py-2 px-4">
                      <InlineEditable
                        value={
                          cast.birthday
                            ? format(new Date(cast.birthday), "yyyy-MM-dd", {
                                locale: ja,
                              })
                            : ""
                        }
                        onSave={async (newBirthday) => {
                          if (!cast.id) return;
                          await api.cast.update(cast.id, {
                            birthday: newBirthday || null,
                          });
                          setCast({ ...cast, birthday: newBirthday || null });
                          toast.success("誕生日を更新しました");
                        }}
                        displayComponent={
                          <span>
                            {cast.birthday
                              ? format(
                                  new Date(cast.birthday),
                                  "yyyy年MM月dd日",
                                  { locale: ja }
                                )
                              : "クリックして編集"}
                          </span>
                        }
                        inputType="date"
                        placeholder="クリックして編集"
                      />
                    </td>
                  </tr>
                  <tr className="border-b border-[var(--color-border)]">
                    <td className="py-2 px-4 text-[var(--color-text-secondary)] font-medium">
                      シャンパンコールの歌
                    </td>
                    <td className="py-2 px-4">
                      <InlineEditable
                        value={cast.champagneCallSong || ""}
                        onSave={async (newValue) => {
                          if (!cast.id) return;
                          await api.cast.update(cast.id, {
                            champagneCallSong: newValue || null,
                          });
                          setCast({
                            ...cast,
                            champagneCallSong: newValue || null,
                          });
                          toast.success("シャンパンコールの歌を更新しました");
                        }}
                        inputType="text"
                        placeholder="クリックして編集"
                      />
                    </td>
                  </tr>
                  <tr className="border-b border-[var(--color-border)]">
                    <td className="py-2 px-4 text-[var(--color-text-secondary)] font-medium">
                      年齢
                    </td>
                    <td className="py-2 px-4">
                      <InlineEditable
                        value={cast.age?.toString() || ""}
                        onSave={async (newValue) => {
                          if (!cast.id) return;
                          const age = newValue ? parseInt(newValue) : null;
                          await api.cast.update(cast.id, {
                            age: age,
                          });
                          setCast({
                            ...cast,
                            age: age,
                          });
                          toast.success("年齢を更新しました");
                        }}
                        inputType="text"
                        placeholder="クリックして編集"
                      />
                    </td>
                  </tr>
                  <tr className="border-b border-[var(--color-border)]">
                    <td className="py-2 px-4 text-[var(--color-text-secondary)] font-medium">
                      お酒の濃さ
                    </td>
                    <td className="py-2 px-4">
                      <InlineEditable
                        value={cast.drinkPreference || ""}
                        onSave={async (newValue) => {
                          if (!cast.id) return;
                          await api.cast.update(cast.id, {
                            drinkPreference: newValue || null,
                          });
                          setCast({
                            ...cast,
                            drinkPreference: newValue || null,
                          });
                          toast.success("お酒の濃さを更新しました");
                        }}
                        inputType="select"
                        options={drinkPreferenceOptions.map((option) => ({
                          value: option,
                          label: option,
                        }))}
                        placeholder="クリックして編集"
                      />
                    </td>
                  </tr>
                  <tr className="border-b border-[var(--color-border)]">
                    <td className="py-2 px-4 text-[var(--color-text-secondary)] font-medium">
                      好きなお酒
                    </td>
                    <td className="py-2 px-4">
                      <InlineEditable
                        value={cast.favoriteDrinkId?.toString() || ""}
                        onSave={async (newValue) => {
                          if (!cast.id) return;
                          const favoriteDrinkId = newValue
                            ? parseInt(newValue)
                            : null;
                          await api.cast.update(cast.id, {
                            favoriteDrinkId: favoriteDrinkId,
                          });
                          setCast({
                            ...cast,
                            favoriteDrinkId: favoriteDrinkId,
                          });
                          toast.success("好きなお酒を更新しました");
                        }}
                        inputType="select"
                        options={drinkMenus.map((menu) => ({
                          value: menu.id!.toString(),
                          label: menu.name,
                        }))}
                        placeholder="クリックして編集"
                        displayComponent={
                          <span className="text-base">
                            {cast.favoriteDrinkId
                              ? drinkMenus.find(
                                  (m) => m.id === cast.favoriteDrinkId
                                )?.name || cast.favoriteDrinkId.toString()
                              : "クリックして編集"}
                          </span>
                        }
                      />
                    </td>
                  </tr>
                  <tr className="border-b border-[var(--color-border)]">
                    <td className="py-2 px-4 text-[var(--color-text-secondary)] font-medium">
                      氷
                    </td>
                    <td className="py-2 px-4">
                      <InlineEditable
                        value={cast.ice || ""}
                        onSave={async (newValue) => {
                          if (!cast.id) return;
                          await api.cast.update(cast.id, {
                            ice: newValue || null,
                          });
                          setCast({
                            ...cast,
                            ice: newValue || null,
                          });
                          toast.success("氷を更新しました");
                        }}
                        inputType="select"
                        options={iceOptions.map((option) => ({
                          value: option,
                          label: option,
                        }))}
                        placeholder="クリックして編集"
                      />
                    </td>
                  </tr>
                  <tr className="border-b border-[var(--color-border)]">
                    <td className="py-2 px-4 text-[var(--color-text-secondary)] font-medium">
                      炭酸
                    </td>
                    <td className="py-2 px-4">
                      <InlineEditable
                        value={cast.carbonation || ""}
                        onSave={async (newValue) => {
                          if (!cast.id) return;
                          await api.cast.update(cast.id, {
                            carbonation: newValue || null,
                          });
                          setCast({
                            ...cast,
                            carbonation: newValue || null,
                          });
                          toast.success("炭酸を更新しました");
                        }}
                        inputType="select"
                        options={carbonationOptions.map((option) => ({
                          value: option,
                          label: option,
                        }))}
                        placeholder="クリックして編集"
                      />
                    </td>
                  </tr>
                  <tr className="border-b border-[var(--color-border)]">
                    <td className="py-2 px-4 text-[var(--color-text-secondary)] font-medium">
                      好きな割物
                    </td>
                    <td className="py-2 px-4">
                      <InlineEditable
                        value={cast.favoriteMixerId?.toString() || ""}
                        onSave={async (newValue) => {
                          if (!cast.id) return;
                          const favoriteMixerId = newValue
                            ? parseInt(newValue)
                            : null;
                          await api.cast.update(cast.id, {
                            favoriteMixerId: favoriteMixerId,
                          });
                          setCast({
                            ...cast,
                            favoriteMixerId: favoriteMixerId,
                          });
                          toast.success("好きな割物を更新しました");
                        }}
                        inputType="select"
                        options={mixerMenus.map((menu) => ({
                          value: menu.id!.toString(),
                          label: menu.name,
                        }))}
                        placeholder="クリックして編集"
                        displayComponent={
                          <span className="text-base">
                            {cast.favoriteMixerId
                              ? mixerMenus.find(
                                  (m) => m.id === cast.favoriteMixerId
                                )?.name || cast.favoriteMixerId.toString()
                              : "クリックして編集"}
                          </span>
                        }
                      />
                    </td>
                  </tr>
                  <tr className="border-b border-[var(--color-border)]">
                    <td className="py-2 px-4 text-[var(--color-text-secondary)] font-medium">
                      タバコ
                    </td>
                    <td className="py-2 px-4">
                      <InlineEditable
                        value={
                          cast.smokes === null
                            ? ""
                            : cast.smokes
                              ? "吸う"
                              : "吸わない"
                        }
                        onSave={async (newValue) => {
                          if (!cast.id) return;
                          const smokes =
                            newValue === "吸う"
                              ? true
                              : newValue === "吸わない"
                                ? false
                                : null;
                          await api.cast.update(cast.id, {
                            smokes: smokes,
                            tobaccoType: smokes ? cast.tobaccoType : null,
                          });
                          setCast({
                            ...cast,
                            smokes: smokes,
                            tobaccoType: smokes ? cast.tobaccoType : null,
                          });
                          toast.success("タバコ情報を更新しました");
                        }}
                        inputType="select"
                        options={[
                          { value: "", label: "未設定" },
                          { value: "吸う", label: "吸う" },
                          { value: "吸わない", label: "吸わない" },
                        ]}
                        placeholder="クリックして編集"
                      />
                    </td>
                  </tr>
                  {cast.smokes === true && (
                    <tr className="border-b border-[var(--color-border)]">
                      <td className="py-2 px-4 text-[var(--color-text-secondary)] font-medium">
                        タバコの種類
                      </td>
                      <td className="py-2 px-4">
                        <InlineEditable
                          value={cast.tobaccoType || ""}
                          onSave={async (newValue) => {
                            if (!cast.id) return;
                            await api.cast.update(cast.id, {
                              tobaccoType: newValue || null,
                            });
                            setCast({
                              ...cast,
                              tobaccoType: newValue || null,
                            });
                            toast.success("タバコの種類を更新しました");
                          }}
                          inputType="select"
                          options={tobaccoTypeOptions.map((option) => ({
                            value: option,
                            label: option,
                          }))}
                          placeholder="クリックして編集"
                        />
                      </td>
                    </tr>
                  )}
                  <tr className="border-b border-[var(--color-border)]">
                    <td className="py-2 px-4 text-[var(--color-text-secondary)] font-medium">
                      SNS
                    </td>
                    <td className="py-2 px-4">
                      <SnsEditor
                        snsInfo={cast.snsInfo}
                        onSave={async (newSnsInfo) => {
                          if (!cast.id) return;
                          await api.cast.update(cast.id, {
                            snsInfo: newSnsInfo,
                          });
                          setCast({ ...cast, snsInfo: newSnsInfo });
                          toast.success("SNS情報を更新しました");
                        }}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Card>

      {/* 写真ギャラリー */}
      <Card title="写真" collapsible defaultCollapsed>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">写真を追加</label>
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={uploadingPhotos}
              onChange={async (e) => {
                if (!cast.id) return;
                const files = Array.from(e.target.files || []);
                if (files.length === 0) return;

                try {
                  setUploadingPhotos(true);
                  setUploadProgress(0);

                  // 各ファイルを順次変換して進捗を更新
                  const newPhotos: string[] = [];
                  for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    const base64 = await fileToBase64(file);
                    newPhotos.push(base64);
                    setUploadProgress(((i + 1) / files.length) * 100);
                  }

                  // APIに保存
                  setUploadProgress(90);
                  const updatedPhotos = [...(cast.photos || []), ...newPhotos];
                  await api.cast.update(cast.id, { photos: updatedPhotos });
                  setCast({ ...cast, photos: updatedPhotos });
                  setUploadProgress(100);

                  toast.success(`${files.length}枚の写真を追加しました`);
                  e.target.value = "";

                  // 少し待ってからプログレスバーを非表示
                  setTimeout(() => {
                    setUploadingPhotos(false);
                    setUploadProgress(0);
                  }, 500);
                } catch (error) {
                  logError(error, {
                    component: "CastDetail",
                    action: "addPhoto",
                  });
                  toast.error("写真の追加に失敗しました");
                  setUploadingPhotos(false);
                  setUploadProgress(0);
                }
              }}
              className="w-full px-3 py-2.5 min-h-[44px] bg-[var(--color-background)] border border-[var(--color-border)] rounded text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-base file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-[var(--color-primary)] file:text-[var(--color-background)] hover:file:opacity-90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {uploadingPhotos && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-[var(--color-text-secondary)]">
                    アップロード中...
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
          {cast.photos && cast.photos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {cast.photos.map((photo, index) => (
                <div key={index} className="relative group">
                  <img
                    src={photo}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-48 object-cover rounded border border-[var(--color-border)]"
                  />
                  <button
                    onClick={async () => {
                      if (!cast.id || !confirm("この写真を削除しますか？"))
                        return;
                      const newPhotos = [...(cast.photos || [])];
                      newPhotos.splice(index, 1);
                      await api.cast.update(cast.id, { photos: newPhotos });
                      setCast({ ...cast, photos: newPhotos });
                      toast.success("写真を削除しました");
                    }}
                    className="absolute top-2 right-2 p-2 bg-[var(--color-error)] text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity touch-manipulation min-h-[36px] min-w-[36px] flex items-center justify-center"
                    aria-label="写真を削除"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[var(--color-text-secondary)]">
              写真はありません
            </p>
          )}
        </div>
      </Card>

      {/* 卓記録リスト */}
      <Card
        title="卓記録"
        collapsible
        defaultCollapsed
        action={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowTableAddModal(true)}
            className="w-full sm:w-auto"
          >
            追加
          </Button>
        }
      >
        {tableRecords.length === 0 ? (
          <div className="space-y-4">
            <p className="text-[var(--color-text-secondary)]">
              卓記録がありません
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {tableRecords.map((table) => (
              <div
                key={table.id}
                className="block p-3 sm:p-4 bg-[var(--color-background)] rounded border border-[var(--color-border)]"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="mb-2">
                      <Link
                        to={`/table/${table.id}`}
                        className="font-semibold text-base sm:text-lg text-[var(--color-primary)] hover:underline"
                      >
                        {format(
                          new Date(table.datetime),
                          "yyyy年MM月dd日 HH:mm",
                          {
                            locale: ja,
                          }
                        )}
                      </Link>
                    </div>
                    <div className="space-y-1 text-sm">
                      {table.tableNumber && (
                        <p className="text-[var(--color-text-secondary)]">
                          卓番号: {table.tableNumber}
                        </p>
                      )}
                      {table.mainCast && (
                        <p className="text-[var(--color-text-secondary)]">
                          メインキャスト:{" "}
                          <Link
                            to={`/cast/${table.mainCast.id}`}
                            className="text-[var(--color-primary)] hover:underline"
                          >
                            {table.mainCast.name}
                          </Link>
                        </p>
                      )}
                      {table.helpCasts && table.helpCasts.length > 0 && (
                        <p className="text-[var(--color-text-secondary)]">
                          ヘルプキャスト:{" "}
                          {table.helpCasts.map((cast, idx) => (
                            <span key={cast.id}>
                              <Link
                                to={`/cast/${cast.id}`}
                                className="text-[var(--color-primary)] hover:underline"
                              >
                                {cast.name}
                              </Link>
                              {idx < table.helpCasts.length - 1 && ", "}
                            </span>
                          ))}
                        </p>
                      )}
                      {table.himeList && table.himeList.length > 0 && (
                        <p className="text-[var(--color-text-secondary)]">
                          参加した姫:{" "}
                          {table.himeList.map((hime, idx) => (
                            <span key={hime.id}>
                              <Link
                                to={`/hime/${hime.id}?from=cast&castId=${cast.id}`}
                                className="text-[var(--color-primary)] hover:underline"
                              >
                                {hime.name}
                              </Link>
                              {idx < table.himeList.length - 1 && ", "}
                            </span>
                          ))}
                        </p>
                      )}
                      {table.salesInfo && (
                        <div className="mt-3 p-3 bg-[var(--color-surface)] rounded border border-[var(--color-border)]">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-[var(--color-text-secondary)]">
                                来店区分
                              </span>
                              <span className="text-sm font-medium">
                                {table.salesInfo.visitType === "normal"
                                  ? "通常"
                                  : table.salesInfo.visitType === "first"
                                    ? "初回"
                                    : "指名あり"}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-[var(--color-text-secondary)]">
                                滞在時間
                              </span>
                              <span className="text-sm font-medium">
                                {table.salesInfo.stayHours}時間
                              </span>
                            </div>
                            {table.salesInfo.orderItems &&
                              table.salesInfo.orderItems.length > 0 && (
                                <div className="pt-2 border-t border-[var(--color-border)]">
                                  <p className="text-xs text-[var(--color-text-secondary)] mb-1">
                                    注文内容
                                  </p>
                                  <div className="space-y-1">
                                    {table.salesInfo.orderItems.map(
                                      (item, idx) => (
                                        <div
                                          key={idx}
                                          className="flex justify-between text-xs"
                                        >
                                          <span>
                                            {item.name} × {item.quantity}
                                          </span>
                                          <span>
                                            {item.amount.toLocaleString()}円
                                          </span>
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}
                            <div className="pt-2 border-t border-[var(--color-border)] space-y-3">
                              {/* 小計セクション */}
                              <div className="space-y-1">
                                <h5 className="text-xs font-semibold text-[var(--color-text-secondary)]">
                                  小計
                                </h5>
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-[var(--color-text-secondary)]">
                                    テーブルチャージ
                                  </span>
                                  <span>
                                    {table.salesInfo.tableCharge.toLocaleString()}
                                    円
                                  </span>
                                </div>
                                {table.salesInfo.orderItems &&
                                  table.salesInfo.orderItems.length > 0 && (
                                    <div className="flex justify-between items-center text-xs">
                                      <span className="text-[var(--color-text-secondary)]">
                                        注文内容合計
                                      </span>
                                      <span>
                                        {table.salesInfo.orderItems
                                          .reduce(
                                            (sum, item) => sum + item.amount,
                                            0
                                          )
                                          .toLocaleString()}
                                        円
                                      </span>
                                    </div>
                                  )}
                                <div className="flex justify-between items-center text-sm font-semibold border-t border-[var(--color-border)] pt-1">
                                  <span>小計</span>
                                  <span>
                                    {table.salesInfo.subtotal.toLocaleString()}
                                    円
                                  </span>
                                </div>
                              </div>

                              {/* 総売上セクション */}
                              <div className="space-y-1">
                                <h5 className="text-xs font-semibold text-[var(--color-text-secondary)]">
                                  総売上
                                </h5>
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-[var(--color-text-secondary)]">
                                    小計
                                  </span>
                                  <span>
                                    {table.salesInfo.subtotal.toLocaleString()}
                                    円
                                  </span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-[var(--color-text-secondary)]">
                                    指名料
                                  </span>
                                  <span>
                                    {table.salesInfo.shimeiFee.toLocaleString()}
                                    円
                                  </span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-[var(--color-text-secondary)]">
                                    消費税 ({table.salesInfo.taxRate}%)
                                  </span>
                                  <span>
                                    {table.salesInfo.tax.toLocaleString()}円
                                  </span>
                                </div>
                                <div className="flex justify-between items-center text-sm font-semibold border-t border-[var(--color-border)] pt-1">
                                  <span>合計</span>
                                  <span>
                                    {table.salesInfo.total.toLocaleString()}円
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      {table.memo && (
                        <div className="mt-2 p-2 bg-[var(--color-surface)] rounded border border-[var(--color-border)]">
                          <p className="text-xs text-[var(--color-text-secondary)] mb-1">
                            メモ
                          </p>
                          <p className="text-sm whitespace-pre-wrap">
                            {table.memo}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="担当している姫">
        {himeListForCast.length === 0 ? (
          <p className="text-[var(--color-text-secondary)]">
            担当している姫はいません
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {himeListForCast.map((hime) => (
              <Link
                key={hime.id}
                to={`/hime/${hime.id}?from=cast&castId=${cast.id}`}
                className="p-3 bg-[var(--color-background)] rounded border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors"
              >
                <p className="font-semibold text-[var(--color-primary)]">
                  {hime.name}
                </p>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* 削除ボタン（アカウントに紐づいているキャストの場合は表示しない） */}
      {!(myCast && cast && myCast.id === cast.id) && (
        <div className="pt-4 border-t border-[var(--color-border)]">
          <Button
            variant="danger"
            onClick={handleDeleteClick}
            className="w-full sm:w-auto sm:px-6 sm:py-3"
          >
            削除
          </Button>
        </div>
      )}

      {/* 削除確認モーダル */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--color-surface)] rounded-lg w-full max-w-md p-6 space-y-4">
            <h2 className="text-xl font-bold text-[var(--color-error)]">
              削除の確認
            </h2>
            <p className="text-[var(--color-text)]">
              この操作は取り消せません。このキャストを削除するには、キャストの名前を入力してください。
            </p>
            <div>
              <label className="block text-sm font-medium mb-2">
                削除するキャストの名前:{" "}
                <span className="font-bold">{cast?.name}</span>
              </label>
              <input
                type="text"
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.target.value)}
                placeholder="名前を入力"
                className="w-full px-4 py-2.5 min-h-[44px] bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-error)] text-base"
                disabled={deleting}
                autoFocus
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="danger"
                onClick={handleDeleteConfirm}
                disabled={deleting || deleteConfirmName !== cast?.name}
                className="flex-1"
              >
                {deleting ? "削除中..." : "削除"}
              </Button>
              <Button
                variant="secondary"
                onClick={handleDeleteCancel}
                disabled={deleting}
                className="flex-1"
              >
                キャンセル
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 卓記録追加モーダル */}
      {showTableAddModal && cast && (
        <TableAddModal
          onClose={() => {
            setShowTableAddModal(false);
            loadData();
          }}
          onSuccess={() => {
            loadData();
            setShowTableAddModal(false);
          }}
          initialCastId={cast.id}
        />
      )}
    </div>
  );
}
