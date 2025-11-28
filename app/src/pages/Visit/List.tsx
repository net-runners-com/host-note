import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useVisitStore } from "../../stores/visitStore";
import { useHimeStore } from "../../stores/himeStore";
import { Card } from "../../components/common/Card";
import { Skeleton, SkeletonCard } from "../../components/common/Skeleton";
import { Avatar } from "../../components/common/Avatar";
import { Pagination } from "../../components/common/Pagination";
import { format } from "date-fns";
import { ja } from "date-fns/locale/ja";

export default function VisitListPage() {
  const { visitList, loadVisitList, loading } = useVisitStore();
  const { himeList, loadHimeList } = useHimeStore();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadVisitList();
    loadHimeList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // マウント時のみ実行

  // ページネーション
  const totalPages = Math.ceil(visitList.length / itemsPerPage);
  const paginatedVisitList = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return visitList.slice(startIndex, endIndex);
  }, [visitList, currentPage, itemsPerPage]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton variant="rectangular" width={120} height={32} />
          <Skeleton variant="rectangular" width={120} height={40} />
        </div>

        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">来店履歴</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          来店履歴は卓記録追加時に自動で記録されます
        </p>
      </div>

      {visitList.length === 0 ? (
        <Card>
          <p className="text-center text-[var(--color-text-secondary)] py-8">
            来店履歴がありません
          </p>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {paginatedVisitList.map((visit) => (
              <Card key={visit.id}>
                <div className="flex items-center gap-4">
                  {visit.hime ? (
                    <Avatar
                      src={visit.hime.photoUrl}
                      name={visit.hime.name}
                      size="lg"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[var(--color-background)] border border-[var(--color-border)] flex items-center justify-center">
                      <span className="text-xs text-[var(--color-text-secondary)]">
                        ?
                      </span>
                    </div>
                  )}
                  <div className="flex-1">
                    {(() => {
                      const hime =
                        visit.hime ||
                        himeList.find((h) => h.id === visit.himeId);
                      if (hime) {
                        return (
                          <Link
                            to={`/hime/${hime.id}`}
                            className="text-lg font-semibold text-[var(--color-primary)] hover:underline"
                          >
                            {hime.name}
                          </Link>
                        );
                      }
                      return (
                        <p className="text-lg font-semibold text-[var(--color-text-secondary)]">
                          姫ID: {visit.himeId}
                        </p>
                      );
                    })()}
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      {format(new Date(visit.visitDate), "yyyy年MM月dd日", {
                        locale: ja,
                      })}
                    </p>
                    {visit.memo && (
                      <p className="text-sm mt-1 text-[var(--color-text)]">
                        {visit.memo}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </div>
  );
}
