import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../../utils/api";
import { TableRecordWithDetails } from "../../types/table";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import {
  Skeleton,
  SkeletonCard,
  SkeletonText,
} from "../../components/common/Skeleton";
import { format } from "date-fns";
import { ja } from "date-fns/locale/ja";
import { toast } from "react-toastify";
import { logError } from "../../utils/errorHandler";
import { InlineEditable } from "../../components/common/InlineEditable";
import { useCastStore } from "../../stores/castStore";

export default function TableDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { castList, loadCastList } = useCastStore();
  const [table, setTable] = useState<TableRecordWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadCastList();
  }, [loadCastList]);

  useEffect(() => {
    if (!id) return;
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const tableData = await api.table.get(parseInt(id));
      if (!tableData) {
        toast.error("卓記録が見つかりませんでした");
        navigate("/table");
        return;
      }
      setTable(tableData);
    } catch (error) {
      logError(error, { component: "TableDetailPage", action: "loadData", id });
      toast.error("データの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!id) return;

    setDeleting(true);
    try {
      await api.table.delete(parseInt(id));
      toast.success("削除しました");
      navigate("/table");
    } catch (error) {
      logError(error, {
        component: "TableDetailPage",
        action: "handleDelete",
        id,
      });
      toast.error("削除に失敗しました");
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  if (loading || !table) {
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
          <Skeleton
            variant="rectangular"
            width={300}
            height={32}
            className="mb-4"
          />
          <SkeletonText lines={2} />
        </Card>

        <Card title="参加した姫">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </Card>

        <Card title="キャスト">
          <SkeletonText lines={3} />
        </Card>

        <Card title="売上情報">
          <SkeletonText lines={8} />
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <Button
          variant="ghost"
          onClick={() => navigate("/table")}
          className="w-full sm:w-auto"
        >
          ← 戻る
        </Button>
      </div>

      <Card>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-[var(--color-text-secondary)] mb-2">
              日時
            </p>
            <InlineEditable
              value={new Date(table.datetime).toISOString().slice(0, 16)}
              onSave={async (newDatetime) => {
                if (!table.id) return;
                // datetime-local形式（YYYY-MM-DDTHH:mm）をそのまま送信
                // サーバー側のparseTime関数がこの形式をサポートしている
                await api.table.update(table.id, { datetime: newDatetime });
                await loadData();
                toast.success("日時を更新しました");
              }}
              displayComponent={
                <h1 className="text-xl sm:text-2xl font-bold">
                  {format(new Date(table.datetime), "yyyy年MM月dd日 HH:mm", {
                    locale: ja,
                  })}
                </h1>
              }
              inputType="datetime-local"
            />
          </div>
          <div>
            <p className="text-sm text-[var(--color-text-secondary)] mb-2">
              卓番号
            </p>
            <InlineEditable
              value={table.tableNumber || ""}
              onSave={async (newTableNumber) => {
                if (!table.id) return;
                await api.table.update(table.id, {
                  tableNumber: newTableNumber || undefined,
                });
                await loadData();
                toast.success("卓番号を更新しました");
              }}
              displayComponent={
                <p className="text-[var(--color-text-secondary)]">
                  {table.tableNumber || "クリックして編集"}
                </p>
              }
              inputType="text"
              placeholder="クリックして編集"
            />
          </div>
        </div>
      </Card>

      <Card title="参加した姫">
        {!table.himeList || table.himeList.length === 0 ? (
          <p className="text-[var(--color-text-secondary)]">
            姫が登録されていません
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {table.himeList.map((hime) => {
              const tantoCast = hime.tantoCastId
                ? castList.find((c) => c.id === hime.tantoCastId)
                : null;
              return (
                <Link
                  key={hime.id}
                  to={`/hime/${hime.id}?from=table&tableId=${table.id}`}
                  className="p-3 bg-[var(--color-background)] rounded border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors"
                >
                  <p className="font-semibold text-[var(--color-primary)]">
                    {hime.name}
                  </p>
                  {tantoCast && (
                    <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                      担当: {tantoCast.name}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </Card>

      <Card title="キャスト">
        <div className="space-y-4">
          {table.mainCast && (
            <div>
              <p className="text-sm text-[var(--color-text-secondary)] mb-2">
                メインキャスト
              </p>
              <Link
                to={`/cast/${table.mainCast.id}`}
                className="font-semibold text-base text-[var(--color-primary)] hover:underline touch-manipulation inline-flex items-center min-h-[44px]"
              >
                {table.mainCast.name}
              </Link>
            </div>
          )}
          {table.helpCasts && table.helpCasts.length > 0 && (
            <div>
              <p className="text-sm text-[var(--color-text-secondary)] mb-2">
                ヘルプキャスト
              </p>
              <div className="flex flex-wrap gap-2">
                {table.helpCasts.map((cast) => (
                  <Link
                    key={cast.id}
                    to={`/cast/${cast.id}`}
                    className="px-3 py-2 min-h-[44px] flex items-center bg-[var(--color-background)] rounded border border-[var(--color-border)] text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-colors touch-manipulation"
                  >
                    {cast.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card title="メモ">
        <InlineEditable
          value={table.memo || ""}
          onSave={async (newMemo) => {
            if (!table.id) return;
            await api.table.update(table.id, { memo: newMemo || undefined });
            await loadData();
            toast.success("メモを更新しました");
          }}
          displayComponent={
            <p className="whitespace-pre-wrap">
              {table.memo || "クリックして編集"}
            </p>
          }
          inputType="textarea"
          placeholder="クリックして編集"
        />
      </Card>

      {/* 売上情報 */}
      {table.salesInfo && (
        <Card title="売上情報">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  来店区分
                </p>
                <p className="font-medium">
                  {table.salesInfo.visitType === "normal"
                    ? "通常"
                    : table.salesInfo.visitType === "first"
                      ? "初回"
                      : "指名あり"}
                </p>
              </div>
              <div>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  滞在時間
                </p>
                <p className="font-medium">{table.salesInfo.stayHours}時間</p>
              </div>
            </div>

            {table.salesInfo.orderItems.length > 0 && (
              <div>
                <p className="text-sm text-[var(--color-text-secondary)] mb-2">
                  注文内容
                </p>
                <div className="space-y-2">
                  {/* デスクトップ用テーブル */}
                  <div className="hidden sm:block">
                    <div className="grid grid-cols-4 gap-2 text-sm font-semibold border-b border-[var(--color-border)] pb-2">
                      <div>品名</div>
                      <div className="text-center">数量</div>
                      <div className="text-right">単価</div>
                      <div className="text-right">金額</div>
                    </div>
                    {table.salesInfo.orderItems.map((item, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-4 gap-2 text-sm"
                      >
                        <div>{item.name}</div>
                        <div className="text-center">{item.quantity}</div>
                        <div className="text-right">
                          {item.unitPrice.toLocaleString()}円
                        </div>
                        <div className="text-right">
                          {item.amount.toLocaleString()}円
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* モバイル用カード */}
                  <div className="block sm:hidden space-y-2">
                    {table.salesInfo.orderItems.map((item, index) => (
                      <div
                        key={index}
                        className="p-3 bg-[var(--color-background)] rounded border border-[var(--color-border)]"
                      >
                        <div className="font-semibold mb-2">{item.name}</div>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-[var(--color-text-secondary)]">
                              数量:
                            </span>
                            <span>{item.quantity}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[var(--color-text-secondary)]">
                              単価:
                            </span>
                            <span>{item.unitPrice.toLocaleString()}円</span>
                          </div>
                          <div className="flex justify-between font-semibold pt-1 border-t border-[var(--color-border)]">
                            <span>金額:</span>
                            <span>{item.amount.toLocaleString()}円</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="border-t border-[var(--color-border)] pt-4 space-y-4">
              {/* 小計セクション */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-[var(--color-text-secondary)]">
                  小計
                </h4>
                <div className="flex justify-between">
                  <span>テーブルチャージ:</span>
                  <span>{table.salesInfo.tableCharge.toLocaleString()}円</span>
                </div>
                <div className="flex justify-between">
                  <span>注文内容合計:</span>
                  <span>
                    {table.salesInfo.orderItems
                      .reduce((sum, item) => sum + item.amount, 0)
                      .toLocaleString()}
                    円
                  </span>
                </div>
                <div className="flex justify-between font-semibold border-t border-[var(--color-border)] pt-2">
                  <span>小計:</span>
                  <span>{table.salesInfo.subtotal.toLocaleString()}円</span>
                </div>
              </div>

              {/* 総売上セクション */}
              <div className="space-y-2 border-t border-[var(--color-border)] pt-4">
                <h4 className="text-sm font-semibold text-[var(--color-text-secondary)]">
                  総売上
                </h4>
                <div className="flex justify-between">
                  <span>小計:</span>
                  <span>{table.salesInfo.subtotal.toLocaleString()}円</span>
                </div>
                {table.salesInfo.shimeiFee > 0 && (
                  <div className="flex justify-between">
                    <span>指名料:</span>
                    <span>{table.salesInfo.shimeiFee.toLocaleString()}円</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>TAX({table.salesInfo.taxRate}%):</span>
                  <span>{table.salesInfo.tax.toLocaleString()}円</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-[var(--color-border)] pt-2">
                  <span>合計:</span>
                  <span>{table.salesInfo.total.toLocaleString()}円</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* 削除ボタン */}
      <div className="flex justify-end">
        <Button
          variant="danger"
          onClick={handleDeleteClick}
          className="w-full sm:w-auto"
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
              この操作は取り消せません。本当にこの卓記録を削除しますか？
            </p>
            <div className="flex gap-2 pt-2">
              <Button
                variant="danger"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex-1"
              >
                {deleting ? "削除中..." : "はい"}
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
    </div>
  );
}
