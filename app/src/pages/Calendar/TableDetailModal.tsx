import { useEffect, useState } from "react";
import { api } from "../../utils/api";
import { TableRecordWithDetails } from "../../types/table";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Loading } from "../../components/common/Loading";
import { format } from "date-fns";
import { ja } from "date-fns/locale/ja";
import { toast } from "react-toastify";
import { logError } from "../../utils/errorHandler";
import { useNavigate } from "react-router-dom";

interface TableDetailModalProps {
  tableId: number;
  onClose: () => void;
}

export function TableDetailModal({ tableId, onClose }: TableDetailModalProps) {
  const navigate = useNavigate();
  const [table, setTable] = useState<TableRecordWithDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [tableId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const tableData = await api.table.get(tableId);
      if (!tableData) {
        toast.error("卓記録が見つかりませんでした");
        onClose();
        return;
      }
      setTable(tableData);
    } catch (error) {
      logError(error, {
        component: "TableDetailModal",
        action: "loadData",
        tableId,
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
          <h2 className="text-xl font-bold">卓記録詳細</h2>
          <Button variant="ghost" onClick={onClose}>
            ✕
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {loading || !table ? (
            <Loading />
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-[var(--color-text-secondary)] mb-1">
                  日時
                </p>
                <p className="text-lg font-semibold">
                  {format(new Date(table.datetime), "yyyy年MM月dd日 HH:mm", {
                    locale: ja,
                  })}
                </p>
              </div>

              {table.tableNumber && (
                <div>
                  <p className="text-sm text-[var(--color-text-secondary)] mb-1">
                    卓番号
                  </p>
                  <p className="text-lg">{table.tableNumber}</p>
                </div>
              )}

              {table.himeList && table.himeList.length > 0 && (
                <div>
                  <p className="text-sm text-[var(--color-text-secondary)] mb-2">
                    参加した姫
                  </p>
                  <div className="space-y-2">
                    {table.himeList.map((hime) => (
                      <button
                        key={hime.id}
                        onClick={() => {
                          navigate(`/hime/${hime.id}`);
                          onClose();
                        }}
                        className="w-full text-left p-3 bg-[var(--color-background)] rounded border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors"
                      >
                        <p className="font-semibold text-[var(--color-primary)]">
                          {hime.name}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-2 p-4 border-t border-[var(--color-border)]">
          <Button
            variant="secondary"
            onClick={() => {
              navigate(`/table/${tableId}`);
              onClose();
            }}
          >
            詳細ページで開く
          </Button>
          <Button variant="secondary" onClick={onClose} className="ml-auto">
            閉じる
          </Button>
        </div>
      </Card>
    </div>
  );
}

