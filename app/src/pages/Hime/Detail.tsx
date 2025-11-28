import { useEffect, useState, useMemo, useCallback } from "react";
import {
  useParams,
  useNavigate,
  Link,
  useSearchParams,
} from "react-router-dom";
import { api } from "../../utils/api";
import { HimeWithCast } from "../../types/hime";
import { VisitRecord } from "../../types/visit";
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
import { fileToBase64 } from "../../utils/imageUtils";
import { InlineEditable } from "../../components/common/InlineEditable";
import { SnsEditor } from "../../components/common/SnsEditor";
import { ImageCropUpload } from "../../components/common/ImageCrop";
import { useMenuStore } from "../../stores/menuStore";
import { useOptionStore } from "../../stores/optionStore";
import { useCastStore } from "../../stores/castStore";
import { useHimeStore } from "../../stores/himeStore";
import { TableAddModal } from "../Table/TableAddModal";

export default function HimeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { menuList, loadMenuList, getMenusByCategory } = useMenuStore();
  const { castList, loadCastList } = useCastStore();
  const { loadHimeList } = useHimeStore();
  const {
    drinkPreferenceOptions,
    iceOptions,
    carbonationOptions,
    tobaccoTypeOptions,
    loadOptions,
  } = useOptionStore();
  const [hime, setHime] = useState<HimeWithCast | null>(null);
  const [visitHistory, setVisitHistory] = useState<TableRecordWithDetails[]>(
    []
  );
  const [showTantoCastConfirmModal, setShowTantoCastConfirmModal] =
    useState(false);
  const [pendingTantoCastId, setPendingTantoCastId] = useState<string | null>(
    null
  );
  const [visitRecords, setVisitRecords] = useState<VisitRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [showTableAddModal, setShowTableAddModal] = useState(false);

  // URLパラメータをメモ化
  const fromParam = useMemo(() => searchParams.get("from"), [searchParams]);
  const castIdParam = useMemo(() => searchParams.get("castId"), [searchParams]);
  const tableIdParam = useMemo(
    () => searchParams.get("tableId"),
    [searchParams]
  );

  useEffect(() => {
    if (menuList.length === 0) {
      loadMenuList();
    }
    loadCastList();
    loadOptions();
  }, [menuList.length, loadMenuList, loadCastList, loadOptions]);

  const menusByCategory = useMemo(
    () => getMenusByCategory(),
    [menuList, getMenusByCategory]
  );
  const drinkMenus = useMemo(
    () => [
      ...(menusByCategory["ボトル系"] || []),
      ...(menusByCategory["缶もの"] || []),
    ],
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
      const himeId = parseInt(id);

      // 並列でデータを取得
      const [himeData, tables, visits] = await Promise.all([
        api.hime.get(himeId),
        api.table.list(),
        api.visit.list(),
      ]);

      if (!himeData) {
        toast.error("姫が見つかりませんでした");
        navigate("/hime");
        return;
      }
      setHime(himeData);

      // 来店履歴を取得（卓記録）
      const himeTables = tables.filter((table: TableRecordWithDetails) =>
        table.himeList?.some((h) => h.id === himeId)
      ) as TableRecordWithDetails[];
      setVisitHistory(himeTables);

      // 来店履歴を取得（来店記録）
      const himeVisits = visits.filter((v) => v.himeId === himeId);
      setVisitRecords(himeVisits);
    } catch (error) {
      logError(error, { component: "HimeDetailPage", action: "loadData", id });
      toast.error("データの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    if (!id) return;
    loadData();
  }, [id, loadData]);

  const handleDeleteClick = useCallback(() => {
    setShowDeleteModal(true);
    setDeleteConfirmName("");
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!id || !hime) return;

    if (deleteConfirmName !== hime.name) {
      toast.error("名前が一致しません");
      return;
    }

    setDeleting(true);
    try {
      await api.hime.delete(parseInt(id));
      toast.success("削除しました");
      navigate("/hime");
    } catch (error) {
      logError(error, {
        component: "HimeDetailPage",
        action: "handleDelete",
        id,
      });
      toast.error("削除に失敗しました");
      setDeleting(false);
    }
  }, [id, hime, deleteConfirmName, navigate]);

  const handleDeleteCancel = useCallback(() => {
    setShowDeleteModal(false);
    setDeleteConfirmName("");
  }, []);

  // 共通のフィールド更新ハンドラー
  const updateField = useCallback(
    async <K extends keyof HimeWithCast>(
      field: K,
      value: HimeWithCast[K] | null,
      successMessage: string
    ) => {
      if (!hime?.id) return;
      try {
        await api.hime.update(hime.id, { [field]: value } as any);
        setHime({ ...hime, [field]: value });
        toast.success(successMessage);
      } catch (error) {
        logError(error, {
          component: "HimeDetailPage",
          action: `update${String(field)}`,
        });
        toast.error("更新に失敗しました");
      }
    },
    [hime]
  );

  // 各フィールドの更新ハンドラー（useMemoでメモ化）
  const handleUpdateName = useCallback(
    (newName: string) => updateField("name", newName, "名前を更新しました"),
    [updateField]
  );

  const handleUpdateBirthday = useCallback(
    (newBirthday: string) =>
      updateField("birthday", newBirthday || null, "誕生日を更新しました"),
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
      if (!hime?.id) return;
      const smokes =
        newValue === "吸う" ? true : newValue === "吸わない" ? false : null;
      try {
        await api.hime.update(hime.id, {
          smokes,
          tobaccoType: smokes ? hime.tobaccoType : null,
        });
        setHime({
          ...hime,
          smokes,
          tobaccoType: smokes ? hime.tobaccoType : null,
        });
        toast.success("タバコ情報を更新しました");
      } catch (error) {
        logError(error, {
          component: "HimeDetailPage",
          action: "updateSmokes",
        });
        toast.error("更新に失敗しました");
      }
    },
    [hime]
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

  const handleUpdateTantoCastId = useCallback(
    async (newValue: string) => {
      if (!hime?.id) return;
      // 変更がある場合のみ確認モーダルを表示
      const currentTantoCastId = hime.tantoCastId?.toString() || "";
      if (currentTantoCastId === newValue) {
        return; // 変更がない場合は何もしない
      }
      setPendingTantoCastId(newValue);
      setShowTantoCastConfirmModal(true);
    },
    [hime]
  );

  const confirmUpdateTantoCastId = useCallback(async () => {
    if (!hime?.id || pendingTantoCastId === null) return;
    const tantoCastId = pendingTantoCastId
      ? parseInt(pendingTantoCastId)
      : null;
    try {
      await api.hime.update(hime.id, { tantoCastId });
      // tantoCastオブジェクトも更新
      const updatedTantoCast = tantoCastId
        ? castList.find((c) => c.id === tantoCastId) || null
        : null;
      setHime({
        ...hime,
        tantoCastId,
        tantoCast: updatedTantoCast,
      });
      // キャスト側の担当姫リストも更新
      loadHimeList();
      toast.success("指名キャストを更新しました");
      setShowTantoCastConfirmModal(false);
      setPendingTantoCastId(null);
    } catch (error) {
      logError(error, {
        component: "HimeDetailPage",
        action: "updateTantoCastId",
      });
      toast.error("更新に失敗しました");
    }
  }, [hime, pendingTantoCastId, castList, loadHimeList]);

  const handleUpdatePhoto = useCallback(
    async (newPhotoUrl: string | null) => {
      if (!hime?.id) return;
      try {
        await api.hime.update(hime.id, { photoUrl: newPhotoUrl });
        setHime({ ...hime, photoUrl: newPhotoUrl });
        toast.success("プロフィール画像を更新しました");
      } catch (error) {
        logError(error, {
          component: "HimeDetailPage",
          action: "updatePhoto",
        });
        toast.error("画像の更新に失敗しました");
      }
    },
    [hime]
  );

  // 戻るボタンのハンドラー
  const handleBack = useCallback(() => {
    if (fromParam === "cast" && castIdParam) {
      navigate(`/cast/${castIdParam}`);
    } else if (fromParam === "table" && tableIdParam) {
      navigate(`/table/${tableIdParam}`);
    } else {
      navigate("/hime");
    }
  }, [fromParam, castIdParam, tableIdParam, navigate]);

  if (loading || !hime) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton variant="rectangular" width={80} height={40} />
          <div className="flex gap-2">
            <Skeleton variant="rectangular" width={80} height={40} />
            <Skeleton variant="rectangular" width={80} height={40} />
            <Skeleton variant="rectangular" width={80} height={40} />
          </div>
        </div>

        <Card>
          <div className="flex items-start gap-6">
            <SkeletonAvatar size="xl" />
            <div className="flex-1 space-y-4">
              <Skeleton variant="rectangular" width={200} height={32} />
              <div className="space-y-3">
                <SkeletonText lines={4} />
              </div>
            </div>
          </div>
        </Card>

        <Card title="卓記録">
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </Card>

        <Card title="来店記録">
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="w-full sm:w-auto"
        >
          ← 戻る
        </Button>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => navigate(`/memo?himeId=${id}`)}
            className="flex-1 sm:flex-none"
          >
            メモ
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate(`/analysis?himeIds=${id}`)}
            className="flex-1 sm:flex-none"
          >
            分析
          </Button>
        </div>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
          <div className="flex-shrink-0 mx-auto sm:mx-0">
            <ImageCropUpload
              value={hime.photoUrl}
              onChange={handleUpdatePhoto}
              label=""
              circular={true}
              size={120}
            />
          </div>
          <div className="flex-1 w-full space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <InlineEditable
                value={hime.name}
                onSave={handleUpdateName}
                displayComponent={
                  <h1 className="text-2xl sm:text-3xl font-bold">
                    {hime.name}
                  </h1>
                }
                inputType="text"
                className="flex-1"
              />
              {hime.isFirstVisit && (
                <span className="px-2 py-1 text-sm bg-[var(--color-primary)] text-[var(--color-background)] rounded self-start">
                  新規
                </span>
              )}
            </div>
            {/* 基本情報 - モバイルではカード形式 */}
            <div className="block sm:hidden space-y-3">
              <div className="p-3 bg-[var(--color-background)] rounded border border-[var(--color-border)]">
                <div className="text-sm text-[var(--color-text-secondary)] font-medium mb-2">
                  誕生日
                </div>
                <InlineEditable
                  value={
                    hime.birthday
                      ? format(new Date(hime.birthday), "yyyy-MM-dd", {
                          locale: ja,
                        })
                      : ""
                  }
                  onSave={handleUpdateBirthday}
                  displayComponent={
                    <span>
                      {hime.birthday
                        ? format(new Date(hime.birthday), "yyyy年MM月dd日", {
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
                  年齢
                </div>
                <InlineEditable
                  value={hime.age?.toString() || ""}
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
                  value={hime.drinkPreference || ""}
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
                  value={hime.favoriteDrinkId?.toString() || ""}
                  onSave={handleUpdateFavoriteDrinkId}
                  inputType="select"
                  options={drinkMenus.map((menu) => ({
                    value: menu.id!.toString(),
                    label: menu.name,
                  }))}
                  placeholder="クリックして編集"
                  displayComponent={
                    <span className="text-base">
                      {hime.favoriteDrinkId
                        ? drinkMenus.find((m) => m.id === hime.favoriteDrinkId)
                            ?.name || hime.favoriteDrinkId.toString()
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
                  value={hime.ice || ""}
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
                  value={hime.carbonation || ""}
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
                  value={hime.favoriteMixerId?.toString() || ""}
                  onSave={handleUpdateFavoriteMixerId}
                  inputType="select"
                  options={mixerMenus.map((menu) => ({
                    value: menu.id!.toString(),
                    label: menu.name,
                  }))}
                  placeholder="クリックして編集"
                  displayComponent={
                    <span className="text-base">
                      {hime.favoriteMixerId
                        ? mixerMenus.find((m) => m.id === hime.favoriteMixerId)
                            ?.name || hime.favoriteMixerId.toString()
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
                    hime.smokes === null
                      ? ""
                      : hime.smokes
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
              {hime.smokes === true && (
                <div className="p-3 bg-[var(--color-background)] rounded border border-[var(--color-border)]">
                  <div className="text-sm text-[var(--color-text-secondary)] font-medium mb-2">
                    タバコの種類
                  </div>
                  <InlineEditable
                    value={hime.tobaccoType || ""}
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
              {/* 指名キャスト情報 */}
              <div className="p-3 bg-[var(--color-background)] rounded border border-[var(--color-border)]">
                <div className="text-sm text-[var(--color-text-secondary)] font-medium mb-2">
                  指名キャスト
                </div>
                <InlineEditable
                  value={hime.tantoCastId?.toString() || ""}
                  onSave={handleUpdateTantoCastId}
                  inputType="select"
                  options={castList.map((cast) => ({
                    value: cast.id!.toString(),
                    label: cast.name,
                  }))}
                  placeholder="クリックして編集"
                  displayComponent={
                    <span className="text-base">
                      {hime.tantoCastId
                        ? hime.tantoCast
                          ? hime.tantoCast.name
                          : castList.find((c) => c.id === hime.tantoCastId)
                              ?.name || hime.tantoCastId.toString()
                        : "指名キャストはいません"}
                    </span>
                  }
                />
              </div>
              <div className="p-3 bg-[var(--color-background)] rounded border border-[var(--color-border)]">
                <div className="text-sm text-[var(--color-text-secondary)] font-medium mb-2">
                  SNS
                </div>
                <SnsEditor
                  snsInfo={hime.snsInfo}
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
                          hime.birthday
                            ? format(new Date(hime.birthday), "yyyy-MM-dd", {
                                locale: ja,
                              })
                            : ""
                        }
                        onSave={async (newBirthday) => {
                          if (!hime.id) return;
                          await api.hime.update(hime.id, {
                            birthday: newBirthday || null,
                          });
                          setHime({ ...hime, birthday: newBirthday || null });
                          toast.success("誕生日を更新しました");
                        }}
                        displayComponent={
                          <span>
                            {hime.birthday
                              ? format(
                                  new Date(hime.birthday),
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
                      年齢
                    </td>
                    <td className="py-2 px-4">
                      <InlineEditable
                        value={hime.age?.toString() || ""}
                        onSave={async (newValue) => {
                          if (!hime.id) return;
                          const age = newValue ? parseInt(newValue) : null;
                          await api.hime.update(hime.id, {
                            age: age,
                          });
                          setHime({
                            ...hime,
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
                        value={hime.drinkPreference || ""}
                        onSave={async (newValue) => {
                          if (!hime.id) return;
                          await api.hime.update(hime.id, {
                            drinkPreference: newValue || null,
                          });
                          setHime({
                            ...hime,
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
                        value={hime.favoriteDrinkId?.toString() || ""}
                        onSave={async (newValue) => {
                          if (!hime.id) return;
                          const favoriteDrinkId = newValue
                            ? parseInt(newValue)
                            : null;
                          await api.hime.update(hime.id, {
                            favoriteDrinkId: favoriteDrinkId,
                          });
                          setHime({
                            ...hime,
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
                            {hime.favoriteDrinkId
                              ? drinkMenus.find(
                                  (m) => m.id === hime.favoriteDrinkId
                                )?.name || hime.favoriteDrinkId.toString()
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
                        value={hime.ice || ""}
                        onSave={async (newValue) => {
                          if (!hime.id) return;
                          await api.hime.update(hime.id, {
                            ice: newValue || null,
                          });
                          setHime({
                            ...hime,
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
                        value={hime.carbonation || ""}
                        onSave={async (newValue) => {
                          if (!hime.id) return;
                          await api.hime.update(hime.id, {
                            carbonation: newValue || null,
                          });
                          setHime({
                            ...hime,
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
                        value={hime.favoriteMixerId?.toString() || ""}
                        onSave={async (newValue) => {
                          if (!hime.id) return;
                          const favoriteMixerId = newValue
                            ? parseInt(newValue)
                            : null;
                          await api.hime.update(hime.id, {
                            favoriteMixerId: favoriteMixerId,
                          });
                          setHime({
                            ...hime,
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
                            {hime.favoriteMixerId
                              ? mixerMenus.find(
                                  (m) => m.id === hime.favoriteMixerId
                                )?.name || hime.favoriteMixerId.toString()
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
                          hime.smokes === null
                            ? ""
                            : hime.smokes
                              ? "吸う"
                              : "吸わない"
                        }
                        onSave={async (newValue) => {
                          if (!hime.id) return;
                          const smokes =
                            newValue === "吸う"
                              ? true
                              : newValue === "吸わない"
                                ? false
                                : null;
                          await api.hime.update(hime.id, {
                            smokes: smokes,
                            tobaccoType: smokes ? hime.tobaccoType : null,
                          });
                          setHime({
                            ...hime,
                            smokes: smokes,
                            tobaccoType: smokes ? hime.tobaccoType : null,
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
                  {hime.smokes === true && (
                    <tr className="border-b border-[var(--color-border)]">
                      <td className="py-2 px-4 text-[var(--color-text-secondary)] font-medium">
                        タバコの種類
                      </td>
                      <td className="py-2 px-4">
                        <InlineEditable
                          value={hime.tobaccoType || ""}
                          onSave={async (newValue) => {
                            if (!hime.id) return;
                            await api.hime.update(hime.id, {
                              tobaccoType: newValue || null,
                            });
                            setHime({
                              ...hime,
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
                  {/* 指名キャスト情報 */}
                  <tr className="border-b border-[var(--color-border)]">
                    <td className="py-2 px-4 text-[var(--color-text-secondary)] font-medium">
                      指名キャスト
                    </td>
                    <td className="py-2 px-4">
                      <InlineEditable
                        value={hime.tantoCastId?.toString() || ""}
                        onSave={handleUpdateTantoCastId}
                        inputType="select"
                        options={castList.map((cast) => ({
                          value: cast.id!.toString(),
                          label: cast.name,
                        }))}
                        placeholder="クリックして編集"
                        displayComponent={
                          <span>
                            {hime.tantoCastId
                              ? hime.tantoCast
                                ? hime.tantoCast.name
                                : castList.find(
                                    (c) => c.id === hime.tantoCastId
                                  )?.name || hime.tantoCastId.toString()
                              : "指名キャストはいません"}
                          </span>
                        }
                      />
                    </td>
                  </tr>
                  <tr className="border-b border-[var(--color-border)]">
                    <td className="py-2 px-4 text-[var(--color-text-secondary)] font-medium">
                      SNS
                    </td>
                    <td className="py-2 px-4">
                      <SnsEditor
                        snsInfo={hime.snsInfo}
                        onSave={async (newSnsInfo) => {
                          if (!hime.id) return;
                          await api.hime.update(hime.id, {
                            snsInfo: newSnsInfo,
                          });
                          setHime({ ...hime, snsInfo: newSnsInfo });
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
                if (!hime.id) return;
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
                  const updatedPhotos = [...(hime.photos || []), ...newPhotos];
                  await api.hime.update(hime.id, { photos: updatedPhotos });
                  setHime({ ...hime, photos: updatedPhotos });
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
                    component: "HimeDetail",
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
          {hime.photos && hime.photos.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {hime.photos.map((photo, index) => (
                <div key={index} className="relative group">
                  <img
                    src={photo}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-48 object-cover rounded border border-[var(--color-border)]"
                  />
                  <button
                    onClick={async () => {
                      if (!hime.id || !confirm("この写真を削除しますか？"))
                        return;
                      const newPhotos = [...(hime.photos || [])];
                      newPhotos.splice(index, 1);
                      await api.hime.update(hime.id, { photos: newPhotos });
                      setHime({ ...hime, photos: newPhotos });
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
        {visitHistory.length === 0 ? (
          <div className="space-y-4">
            <p className="text-[var(--color-text-secondary)]">
              卓記録がありません
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {visitHistory.map((table) => (
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
                                <div className="flex justify-between items-center text-xs font-semibold pt-1 border-t border-[var(--color-border)]">
                                  <span>小計</span>
                                  <span>
                                    {table.salesInfo.subtotal.toLocaleString()}
                                    円
                                  </span>
                                </div>
                              </div>

                              {/* 総売上セクション */}
                              <div className="space-y-1 border-t border-[var(--color-border)] pt-2">
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
                                {table.salesInfo.shimeiFee > 0 && (
                                  <div className="flex justify-between items-center text-xs">
                                    <span className="text-[var(--color-text-secondary)]">
                                      指名料
                                    </span>
                                    <span>
                                      {table.salesInfo.shimeiFee.toLocaleString()}
                                      円
                                    </span>
                                  </div>
                                )}
                                {table.salesInfo.tax > 0 && (
                                  <div className="flex justify-between items-center text-xs">
                                    <span className="text-[var(--color-text-secondary)]">
                                      TAX({table.salesInfo.taxRate}%)
                                    </span>
                                    <span>
                                      {table.salesInfo.tax.toLocaleString()}円
                                    </span>
                                  </div>
                                )}
                                <div className="flex justify-between items-center pt-1 border-t border-[var(--color-border)]">
                                  <span className="text-sm font-semibold">
                                    合計
                                  </span>
                                  <span className="text-sm font-bold text-[var(--color-primary)]">
                                    {table.salesInfo.total.toLocaleString()}円
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      {table.memo && (
                        <p className="text-[var(--color-text-secondary)] mt-2 line-clamp-2">
                          {table.memo}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 来店記録 */}
      <Card title="来店記録" collapsible defaultCollapsed>
        {visitRecords.length === 0 ? (
          <p className="text-[var(--color-text-secondary)]">
            来店記録がありません（卓記録追加時に自動で記録されます）
          </p>
        ) : (
          <div className="space-y-2">
            {visitRecords.map((visit) => (
              <div
                key={visit.id}
                className="p-3 bg-[var(--color-background)] rounded border border-[var(--color-border)]"
              >
                <p className="font-semibold">
                  {format(new Date(visit.visitDate), "yyyy年MM月dd日", {
                    locale: ja,
                  })}
                </p>
                {visit.memo && (
                  <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                    {visit.memo}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 削除ボタン */}
      <div className="pt-4 border-t border-[var(--color-border)]">
        <Button
          variant="danger"
          onClick={handleDeleteClick}
          className="w-full sm:w-auto sm:px-6 sm:py-3"
        >
          削除
        </Button>
      </div>

      {/* 削除確認モーダル */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--color-surface)] rounded-lg w-full max-w-md p-6 space-y-4">
            <h2 className="text-xl font-bold text-[var(--color-error)]">
              削除の確認
            </h2>
            <p className="text-[var(--color-text)]">
              この操作は取り消せません。この姫を削除するには、姫の名前を入力してください。
            </p>
            <div>
              <label className="block text-sm font-medium mb-2">
                削除する姫の名前:{" "}
                <span className="font-bold">{hime?.name}</span>
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
                disabled={deleting || deleteConfirmName !== hime?.name}
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

      {showTableAddModal && hime && (
        <TableAddModal
          onClose={() => setShowTableAddModal(false)}
          onSuccess={() => {
            loadData();
            setShowTableAddModal(false);
          }}
          initialHimeId={hime.id}
        />
      )}

      {/* 指名キャスト変更確認モーダル */}
      {showTantoCastConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--color-surface)] rounded-lg w-full max-w-md p-6 space-y-4">
            <h2 className="text-xl font-bold text-[var(--color-text)]">
              指名キャストの変更確認
            </h2>
            <p className="text-[var(--color-text)]">
              指名キャストを変更しますか？
            </p>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-[var(--color-text-secondary)]">
                  現在の指名キャスト:{" "}
                </span>
                <span className="font-semibold text-[var(--color-text)]">
                  {hime?.tantoCastId
                    ? hime.tantoCast
                      ? hime.tantoCast.name
                      : castList.find((c) => c.id === hime.tantoCastId)?.name ||
                        "不明"
                    : "指名キャストなし"}
                </span>
              </div>
              <div>
                <span className="text-sm text-[var(--color-text-secondary)]">
                  新しい指名キャスト:{" "}
                </span>
                <span className="font-semibold text-[var(--color-text)]">
                  {pendingTantoCastId
                    ? castList.find(
                        (c) => c.id === parseInt(pendingTantoCastId)
                      )?.name || "不明"
                    : "指名キャストなし"}
                </span>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                variant="primary"
                onClick={confirmUpdateTantoCastId}
                className="flex-1"
              >
                変更する
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowTantoCastConfirmModal(false);
                  setPendingTantoCastId(null);
                }}
                className="flex-1"
              >
                キャンセル
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
