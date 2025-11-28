import { useEffect, useState } from "react";
import { api } from "../../utils/api";
import { VisitRecordWithHime } from "../../types/visit";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Loading } from "../../components/common/Loading";
import { Avatar } from "../../components/common/Avatar";
import { format } from "date-fns";
import { ja } from "date-fns/locale/ja";
import { toast } from "react-toastify";
import { logError } from "../../utils/errorHandler";
import { useNavigate } from "react-router-dom";

interface VisitDetailModalProps {
  visitId: number;
  onClose: () => void;
}

export function VisitDetailModal({ visitId, onClose }: VisitDetailModalProps) {
  const navigate = useNavigate();
  const [visit, setVisit] = useState<VisitRecordWithHime | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [visitId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const visitList = await api.visit.list();
      const visitData = visitList.find((v) => v.id === visitId);
      if (!visitData) {
        toast.error("来店履歴が見つかりませんでした");
        onClose();
        return;
      }
      setVisit(visitData as VisitRecordWithHime);
    } catch (error) {
      logError(error, {
        component: "VisitDetailModal",
        action: "loadData",
        visitId,
      });
      toast.error("データの取得に失敗しました");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <Card className="max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <h2 className="text-xl font-bold">来店履歴詳細</h2>
          <Button variant="ghost" onClick={onClose}>
            ✕
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {loading || !visit ? (
            <Loading />
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-[var(--color-text-secondary)] mb-1">
                  来店日
                </p>
                <p className="text-lg font-semibold">
                  {format(new Date(visit.visitDate), "yyyy年MM月dd日", {
                    locale: ja,
                  })}
                </p>
              </div>

              {visit.hime && (
                <div>
                  <p className="text-sm text-[var(--color-text-secondary)] mb-2">
                    姫
                  </p>
                  <button
                    onClick={() => {
                      navigate(`/hime/${visit.hime.id}`);
                      onClose();
                    }}
                    className="w-full flex items-center gap-3 p-3 bg-[var(--color-background)] rounded border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors"
                  >
                    <Avatar
                      src={visit.hime.photoUrl}
                      name={visit.hime.name}
                      size="md"
                    />
                    <div>
                      <p className="font-semibold text-[var(--color-primary)]">
                        {visit.hime.name}
                      </p>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-2 p-4 border-t border-[var(--color-border)]">
          {visit?.hime && (
            <Button
              variant="secondary"
              onClick={() => {
                navigate(`/hime/${visit.hime.id}`);
                onClose();
              }}
            >
              姫の詳細ページで開く
            </Button>
          )}
          <Button variant="secondary" onClick={onClose} className="ml-auto">
            閉じる
          </Button>
        </div>
      </Card>
    </div>
  );
}

