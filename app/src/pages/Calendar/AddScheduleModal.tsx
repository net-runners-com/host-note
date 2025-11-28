import React, { useState, useEffect } from "react";
import { useScheduleStore } from "../../stores/scheduleStore";
import { useHimeStore } from "../../stores/himeStore";
import { useCastStore } from "../../stores/castStore";
import { Button } from "../../components/common/Button";
import { ScheduleFormData } from "../../types/schedule";
import { toast } from "react-toastify";
import { logError } from "../../utils/errorHandler";
import { api } from "../../utils/api";

interface AddScheduleModalProps {
  selectedDate: Date;
  scheduleId?: number; // 編集モードの場合
  onClose: () => void;
}

export const AddScheduleModal: React.FC<AddScheduleModalProps> = ({
  selectedDate,
  scheduleId,
  onClose,
}) => {
  const { addSchedule, updateSchedule } = useScheduleStore();
  const { himeList, loadHimeList } = useHimeStore();
  const { castList, loadCastList } = useCastStore();
  const [formData, setFormData] = useState<ScheduleFormData>({
    himeId: 0,
    scheduledDatetime: new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      20,
      0
    )
      .toISOString()
      .slice(0, 16),
    memo: "",
  });
  const [_loading, setLoading] = useState(false);

  useEffect(() => {
    loadHimeList();
    loadCastList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // マウント時のみ実行

  useEffect(() => {
    if (scheduleId) {
      loadScheduleData();
    }
  }, [scheduleId]);

  const loadScheduleData = async () => {
    if (!scheduleId) return;
    try {
      setLoading(true);
      const schedule = await api.schedule.get(scheduleId);
      if (schedule) {
        setFormData({
          himeId: schedule.himeId,
          scheduledDatetime: new Date(schedule.scheduledDatetime)
            .toISOString()
            .slice(0, 16),
          memo: schedule.memo || "",
        });
      }
    } catch (error) {
      logError(error, {
        component: "AddScheduleModal",
        action: "loadScheduleData",
        scheduleId,
      });
      toast.error("予定の読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.himeId) {
      toast.error("姫を選択してください");
      return;
    }

    try {
      if (scheduleId) {
        await updateSchedule(scheduleId, {
          himeId: formData.himeId,
          scheduledDatetime: new Date(formData.scheduledDatetime).toISOString(),
          memo: formData.memo || null,
        });
        toast.success("予定を更新しました");
      } else {
        await addSchedule({
          himeId: formData.himeId,
          scheduledDatetime: new Date(formData.scheduledDatetime).toISOString(),
          memo: formData.memo || null,
          notificationSent: false,
        });
        toast.success("予定を追加しました");
      }
      onClose();
    } catch (error) {
      toast.error(
        scheduleId ? "予定の更新に失敗しました" : "予定の追加に失敗しました"
      );
      logError(error, {
        component: "AddScheduleModal",
        action: "handleSubmit",
        scheduleId,
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[var(--color-surface)] rounded-lg p-6 max-w-md w-full mx-4 border border-[var(--color-border)]">
        <h2 className="text-xl font-bold mb-4">
          {scheduleId ? "予定を編集" : "予定を追加"}
        </h2>
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
              日時 <span className="text-[var(--color-error)]">*</span>
            </label>
            <input
              type="datetime-local"
              value={formData.scheduledDatetime}
              onChange={(e) =>
                setFormData({ ...formData, scheduledDatetime: e.target.value })
              }
              className="w-full px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">メモ</label>
            <textarea
              value={formData.memo || ""}
              onChange={(e) =>
                setFormData({ ...formData, memo: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>

          <div className="flex gap-2 justify-center">
            <Button type="submit">保存</Button>
            <Button type="button" variant="secondary" onClick={onClose}>
              キャンセル
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
