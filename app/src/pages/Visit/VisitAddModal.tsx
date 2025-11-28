import React, { useState, useEffect } from "react";
import { useVisitStore } from "../../stores/visitStore";
import { useHimeStore } from "../../stores/himeStore";
import { useCastStore } from "../../stores/castStore";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { VisitFormData } from "../../types/visit";
import { toast } from "react-toastify";
import { logError } from "../../utils/errorHandler";

interface VisitAddModalProps {
  onClose: () => void;
  onSuccess?: () => void;
  initialHimeId?: number;
}

export function VisitAddModal({
  onClose,
  onSuccess,
  initialHimeId,
}: VisitAddModalProps) {
  const { addVisit } = useVisitStore();
  const { himeList, loadHimeList } = useHimeStore();
  const { castList, loadCastList } = useCastStore();
  const [formData, setFormData] = useState<VisitFormData>({
    himeId: initialHimeId || 0,
    visitDate: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    loadHimeList();
    loadCastList();
    if (initialHimeId) {
      setFormData((prev) => ({ ...prev, himeId: initialHimeId }));
    }
  }, [loadHimeList, loadCastList, initialHimeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.himeId) {
      toast.error("姫を選択してください");
      return;
    }

    try {
      await addVisit({
        himeId: formData.himeId,
        visitDate: new Date(formData.visitDate).toISOString(),
        memo: formData.memo || null,
      });
      toast.success("来店を記録しました");
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error) {
      toast.error("記録に失敗しました");
      logError(error, { component: "VisitAddModal", action: "handleSubmit" });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <h2 className="text-xl font-bold">来店を記録</h2>
          <Button variant="ghost" onClick={onClose}>
            ✕
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                姫 <span className="text-[var(--color-error)]">*</span>
              </label>
              <select
                value={formData.himeId}
                onChange={(e) =>
                  setFormData({ ...formData, himeId: parseInt(e.target.value) })
                }
                className="w-full px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                required
              >
                <option value={0}>選択してください</option>
                {himeList.map((hime) => {
                  const tantoCast = hime.tantoCastId
                    ? castList.find((c) => c.id === hime.tantoCastId)
                    : null;
                  const displayName = tantoCast
                    ? `${hime.name} (担当: ${tantoCast.name})`
                    : hime.name;
                  return (
                    <option key={hime.id} value={hime.id}>
                      {displayName}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                来店日 <span className="text-[var(--color-error)]">*</span>
              </label>
              <input
                type="date"
                value={formData.visitDate}
                onChange={(e) =>
                  setFormData({ ...formData, visitDate: e.target.value })
                }
                className="w-full px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                メモ（任意）
              </label>
              <textarea
                value={formData.memo || ""}
                onChange={(e) =>
                  setFormData({ ...formData, memo: e.target.value })
                }
                rows={3}
                className="w-full px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                placeholder="メモがあれば入力してください"
              />
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
