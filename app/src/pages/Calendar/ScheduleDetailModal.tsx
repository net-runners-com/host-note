import { useEffect, useState } from "react";
import { api } from "../../utils/api";
import { ScheduleWithHime } from "../../types/schedule";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Loading } from "../../components/common/Loading";
import { Avatar } from "../../components/common/Avatar";
import { format } from "date-fns";
import { ja } from "date-fns/locale/ja";
import { toast } from "react-toastify";
import { logError } from "../../utils/errorHandler";
import { useNavigate } from "react-router-dom";

interface ScheduleDetailModalProps {
  scheduleId: number;
  onClose: () => void;
  onEdit?: (scheduleId: number) => void;
  onDelete?: () => void;
}

export function ScheduleDetailModal({
  scheduleId,
  onClose,
  onEdit,
  onDelete,
}: ScheduleDetailModalProps) {
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState<ScheduleWithHime | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [scheduleId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const scheduleData = await api.schedule.get(scheduleId);
      if (!scheduleData) {
        toast.error("予定が見つかりませんでした");
        onClose();
        return;
      }

      // 姫情報も取得
      if (scheduleData.himeId) {
        try {
          const hime = await api.hime.get(scheduleData.himeId);
          setSchedule({
            ...scheduleData,
            hime: hime,
          });
        } catch (error) {
          logError(error, {
            component: "ScheduleDetailModal",
            action: "loadData",
            scheduleId,
            himeId: scheduleData.himeId,
          });
          setSchedule(scheduleData as ScheduleWithHime);
        }
      } else {
        setSchedule(scheduleData as ScheduleWithHime);
      }
    } catch (error) {
      logError(error, {
        component: "ScheduleDetailModal",
        action: "loadData",
        scheduleId,
      });
      toast.error("データの取得に失敗しました");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("本当に削除しますか？")) return;
    try {
      await api.schedule.delete(scheduleId);
      toast.success("削除しました");
      if (onDelete) {
        onDelete();
      }
      onClose();
    } catch (error) {
      logError(error, {
        component: "ScheduleDetailModal",
        action: "handleDelete",
        scheduleId,
      });
      toast.error("削除に失敗しました");
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(scheduleId);
    } else {
      navigate(`/schedule/${scheduleId}/edit`);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <Card className="max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <h2 className="text-xl font-bold">予定詳細</h2>
          <Button variant="ghost" onClick={onClose}>
            ✕
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {loading || !schedule ? (
            <Loading />
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-[var(--color-text-secondary)] mb-1">
                  日時
                </p>
                <p className="text-lg font-semibold">
                  {format(
                    new Date(schedule.scheduledDatetime),
                    "yyyy年MM月dd日 HH:mm",
                    { locale: ja }
                  )}
                </p>
              </div>

              {schedule.hime && (
                <div>
                  <p className="text-sm text-[var(--color-text-secondary)] mb-2">
                    姫
                  </p>
                  <button
                    onClick={() => {
                      // モーダルを閉じずに直接遷移（URLパラメータは保持される）
                      navigate(`/hime/${schedule.hime.id}`);
                    }}
                    className="w-full flex items-center gap-3 p-3 bg-[var(--color-background)] rounded border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors"
                  >
                    <Avatar
                      src={schedule.hime.photoUrl}
                      name={schedule.hime.name}
                      size="md"
                    />
                    <div>
                      <p className="font-semibold text-[var(--color-primary)]">
                        {schedule.hime.name}
                      </p>
                    </div>
                  </button>
                </div>
              )}

              {schedule.memo && (
                <div>
                  <p className="text-sm text-[var(--color-text-secondary)] mb-2">
                    メモ
                  </p>
                  <p className="whitespace-pre-wrap p-3 bg-[var(--color-background)] rounded border border-[var(--color-border)]">
                    {schedule.memo}
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm text-[var(--color-text-secondary)] mb-1">
                  通知送信済み
                </p>
                <p className="text-sm">
                  {schedule.notificationSent ? "✓ 送信済み" : "未送信"}
                </p>
              </div>
            </div>
          )}
        </div>
        {!loading && schedule && (
          <div className="flex gap-2 p-4 border-t border-[var(--color-border)]">
            <Button onClick={handleEdit}>編集</Button>
            <Button variant="danger" onClick={handleDelete}>
              削除
            </Button>
            <Button variant="secondary" onClick={onClose} className="ml-auto">
              閉じる
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
