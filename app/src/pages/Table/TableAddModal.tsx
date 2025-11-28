import React, { useState, useEffect } from "react";
import { useTableStore } from "../../stores/tableStore";
import { useHimeStore } from "../../stores/himeStore";
import { useCastStore } from "../../stores/castStore";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { SalesInfoForm } from "../../components/table/SalesInfoForm";
import { MultiSelect } from "../../components/common/MultiSelect";
import { TableFormData, SalesInfo } from "../../types/table";
import { toast } from "react-toastify";
import { logError } from "../../utils/errorHandler";

interface TableAddModalProps {
  onClose: () => void;
  onSuccess?: () => void;
  initialHimeId?: number;
  initialCastId?: number;
}

export function TableAddModal({
  onClose,
  onSuccess,
  initialHimeId,
  initialCastId,
}: TableAddModalProps) {
  const { addTable } = useTableStore();
  const { himeList, loadHimeList } = useHimeStore();
  const { castList, loadCastList } = useCastStore();
  const [formData, setFormData] = useState<TableFormData>({
    datetime: new Date().toISOString().slice(0, 16),
    himeIds: initialHimeId ? [initialHimeId] : [],
    mainCastId: initialCastId || 0,
    helpCastIds: [],
  });
  const [salesInfo, setSalesInfo] = useState<SalesInfo | null>(null);

  useEffect(() => {
    loadHimeList();
    loadCastList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // マウント時のみ実行

  useEffect(() => {
    if (initialHimeId) {
      setFormData((prev) => ({
        ...prev,
        himeIds: [initialHimeId],
      }));
    }
  }, [initialHimeId]);

  useEffect(() => {
    if (initialCastId) {
      setFormData((prev) => ({
        ...prev,
        mainCastId: initialCastId,
      }));
    }
  }, [initialCastId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.himeIds.length === 0) {
      toast.error("姫を選択してください");
      return;
    }
    if (!formData.mainCastId) {
      toast.error("メインキャストを選択してください");
      return;
    }

    try {
      await addTable({
        ...formData,
        datetime: new Date(formData.datetime).toISOString(),
        salesInfo: salesInfo || undefined,
      });
      toast.success("卓記録を追加しました");
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error) {
      toast.error("追加に失敗しました");
      logError(error, { component: "TableAddModal", action: "handleSubmit" });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <h2 className="text-xl font-bold">卓記録を追加</h2>
          <Button variant="ghost" onClick={onClose}>
            ✕
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                日時 <span className="text-[var(--color-error)]">*</span>
              </label>
              <input
                type="datetime-local"
                value={formData.datetime}
                onChange={(e) =>
                  setFormData({ ...formData, datetime: e.target.value })
                }
                className="w-full px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">卓番号</label>
              <input
                type="text"
                value={formData.tableNumber || ""}
                onChange={(e) =>
                  setFormData({ ...formData, tableNumber: e.target.value })
                }
                className="w-full px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                参加した姫 <span className="text-[var(--color-error)]">*</span>
              </label>
              <MultiSelect
                options={himeList.map((hime) => {
                  const tantoCast = hime.tantoCastId
                    ? castList.find((c) => c.id === hime.tantoCastId)
                    : null;
                  const displayName = tantoCast
                    ? `${hime.name} (担当: ${tantoCast.name})`
                    : hime.name;
                  return {
                    value: hime.id!,
                    label: displayName,
                  };
                })}
                selectedValues={formData.himeIds}
                onChange={(values) =>
                  setFormData({ ...formData, himeIds: values })
                }
                placeholder="姫を選択してください"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                メインキャスト{" "}
                <span className="text-[var(--color-error)]">*</span>
              </label>
              <select
                value={formData.mainCastId}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    mainCastId: parseInt(e.target.value),
                  })
                }
                className="w-full px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                required
              >
                <option value={0}>選択してください</option>
                {castList.map((cast) => (
                  <option key={cast.id} value={cast.id}>
                    {cast.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                ヘルプキャスト
              </label>
              <MultiSelect
                options={castList.map((cast) => ({
                  value: cast.id!,
                  label: cast.name,
                }))}
                selectedValues={formData.helpCastIds}
                onChange={(values) =>
                  setFormData({ ...formData, helpCastIds: values })
                }
                placeholder="ヘルプキャストを選択してください"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">メモ</label>
              <textarea
                value={formData.memo || ""}
                onChange={(e) =>
                  setFormData({ ...formData, memo: e.target.value })
                }
                rows={4}
                className="w-full px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>

            <Card>
              <SalesInfoForm
                salesInfo={salesInfo}
                onChange={(info) => setSalesInfo(info)}
              />
            </Card>

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
