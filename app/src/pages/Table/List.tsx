import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useTableStore } from "../../stores/tableStore";
import { useHimeStore } from "../../stores/himeStore";
import { useCastStore } from "../../stores/castStore";
import { Button } from "../../components/common/Button";
import { EmptyState } from "../../components/common/EmptyState";
import { Skeleton } from "../../components/common/Skeleton";
import { format } from "date-fns";
import { ja } from "date-fns/locale/ja";
import { FaFilter } from "react-icons/fa";
import { Pagination } from "../../components/common/Pagination";
import { TableAddModal } from "./TableAddModal";

export default function TableListPage() {
  const { tableList, loading, loadTableList } = useTableStore();
  const { himeList, loadHimeList } = useHimeStore();
  const { castList, loadCastList } = useCastStore();
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterMainCastId, setFilterMainCastId] = useState<number | null>(null);
  const [filterHelpCastId, setFilterHelpCastId] = useState<number | null>(null);
  const [filterHimeId, setFilterHimeId] = useState<number | null>(null);
  const [filterMinSales, setFilterMinSales] = useState<string>("");
  const [filterMaxSales, setFilterMaxSales] = useState<string>("");
  const [tempFilterMainCastId, setTempFilterMainCastId] = useState<
    number | null
  >(null);
  const [tempFilterHelpCastId, setTempFilterHelpCastId] = useState<
    number | null
  >(null);
  const [tempFilterHimeId, setTempFilterHimeId] = useState<number | null>(null);
  const [tempFilterMinSales, setTempFilterMinSales] = useState<string>("");
  const [tempFilterMaxSales, setTempFilterMaxSales] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadTableList();
    loadHimeList();
    loadCastList();
  }, [loadTableList, loadHimeList, loadCastList]);

  const handleOpenFilter = () => {
    setTempFilterMainCastId(filterMainCastId);
    setTempFilterHelpCastId(filterHelpCastId);
    setTempFilterHimeId(filterHimeId);
    setTempFilterMinSales(filterMinSales);
    setTempFilterMaxSales(filterMaxSales);
    setShowFilterModal(true);
  };

  const handleCloseFilter = () => {
    setShowFilterModal(false);
    setTempFilterMainCastId(filterMainCastId);
    setTempFilterHelpCastId(filterHelpCastId);
    setTempFilterHimeId(filterHimeId);
    setTempFilterMinSales(filterMinSales);
    setTempFilterMaxSales(filterMaxSales);
  };

  const handleApplyFilter = () => {
    setFilterMainCastId(tempFilterMainCastId);
    setFilterHelpCastId(tempFilterHelpCastId);
    setFilterHimeId(tempFilterHimeId);
    setFilterMinSales(tempFilterMinSales);
    setFilterMaxSales(tempFilterMaxSales);
    setShowFilterModal(false);
  };

  const handleResetFilter = () => {
    setTempFilterMainCastId(null);
    setTempFilterHelpCastId(null);
    setTempFilterHimeId(null);
    setTempFilterMinSales("");
    setTempFilterMaxSales("");
  };

  // フィルタリングされた卓記録リスト
  const filteredTableList = useMemo(() => {
    return tableList.filter((table) => {
      // メインキャストでフィルタ
      if (filterMainCastId !== null) {
        if (table.mainCast?.id !== filterMainCastId) {
          return false;
        }
      }

      // ヘルプキャストでフィルタ
      if (filterHelpCastId !== null) {
        const hasHelpCast = table.helpCasts?.some(
          (c) => c.id === filterHelpCastId
        );
        if (!hasHelpCast) {
          return false;
        }
      }

      // 姫でフィルタ
      if (filterHimeId !== null) {
        const hasHime = table.himeList?.some((h) => h.id === filterHimeId);
        if (!hasHime) {
          return false;
        }
      }

      // 売り上げでフィルタ
      const totalSales = table.salesInfo?.total || 0;
      if (filterMinSales !== "") {
        const minSales = parseInt(filterMinSales);
        if (!isNaN(minSales) && totalSales < minSales) {
          return false;
        }
      }
      if (filterMaxSales !== "") {
        const maxSales = parseInt(filterMaxSales);
        if (!isNaN(maxSales) && totalSales > maxSales) {
          return false;
        }
      }

      return true;
    });
  }, [
    tableList,
    filterMainCastId,
    filterHelpCastId,
    filterHimeId,
    filterMinSales,
    filterMaxSales,
  ]);

  const hasActiveFilters =
    filterMainCastId !== null ||
    filterHelpCastId !== null ||
    filterHimeId !== null ||
    filterMinSales !== "" ||
    filterMaxSales !== "";

  // ページネーション
  const totalPages = Math.ceil(filteredTableList.length / itemsPerPage);
  const paginatedTableList = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredTableList.slice(startIndex, endIndex);
  }, [filteredTableList, currentPage, itemsPerPage]);

  // フィルタが変更されたら1ページ目に戻る
  useEffect(() => {
    setCurrentPage(1);
  }, [
    filterMainCastId,
    filterHelpCastId,
    filterHimeId,
    filterMinSales,
    filterMaxSales,
  ]);

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  const renderTableListItem = (table: (typeof tableList)[0]) => (
    <Link
      key={table.id}
      to={`/table/${table.id}`}
      className="block p-4 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors"
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="font-semibold text-lg">
            {format(new Date(table.datetime), "yyyy年MM月dd日 HH:mm", {
              locale: ja,
            })}
          </p>
          {table.tableNumber && (
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              卓番号: {table.tableNumber}
            </p>
          )}
          <p className="text-sm text-[var(--color-text-secondary)] mt-2">
            姫: {table.himeList?.map((h) => h.name).join(", ") || "なし"}
          </p>
          <p className="text-sm text-[var(--color-text-secondary)]">
            メイン: {table.mainCast?.name || "未設定"} / ヘルプ:{" "}
            {table.helpCasts?.map((c) => c.name).join(", ") || "なし"}
          </p>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">卓記録一覧</h1>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            onClick={handleOpenFilter}
            variant={hasActiveFilters ? "primary" : "secondary"}
            className="flex items-center gap-2 flex-1 sm:flex-none"
          >
            <FaFilter className="mr-2" />
            フィルター
          </Button>
          <Button
            onClick={() => setShowAddModal(true)}
            className="flex-1 sm:flex-none"
          >
            + 卓記録を追加
          </Button>
        </div>
      </div>

      {tableList.length === 0 ? (
        <EmptyState
          message="卓記録がありません"
          actionLabel="卓記録を追加"
          onAction={() => setShowAddModal(true)}
        />
      ) : filteredTableList.length === 0 ? (
        <EmptyState
          message="条件に一致する卓記録がありません"
          actionLabel="フィルターをリセット"
          onAction={handleResetFilter}
        />
      ) : (
        <>
          <div className="space-y-2">
            {paginatedTableList.map(renderTableListItem)}
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      {/* フィルターモーダル */}
      {showFilterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-[var(--color-surface)] rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[var(--color-surface)] border-b border-[var(--color-border)] px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">フィルター</h2>
              <button
                onClick={handleCloseFilter}
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-text)] text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* メインキャスト */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  指名キャスト
                </label>
                <select
                  value={tempFilterMainCastId || ""}
                  onChange={(e) =>
                    setTempFilterMainCastId(
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  className="w-full px-3 py-2.5 min-h-[44px] bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-base"
                >
                  <option value="">すべて</option>
                  {castList.map((cast) => (
                    <option key={cast.id} value={cast.id}>
                      {cast.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* ヘルプキャスト */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  ヘルプキャスト
                </label>
                <select
                  value={tempFilterHelpCastId || ""}
                  onChange={(e) =>
                    setTempFilterHelpCastId(
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  className="w-full px-3 py-2.5 min-h-[44px] bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-base"
                >
                  <option value="">すべて</option>
                  {castList.map((cast) => (
                    <option key={cast.id} value={cast.id}>
                      {cast.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 姫 */}
              <div>
                <label className="block text-sm font-medium mb-2">姫</label>
                <select
                  value={tempFilterHimeId || ""}
                  onChange={(e) =>
                    setTempFilterHimeId(
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  className="w-full px-3 py-2.5 min-h-[44px] bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-base"
                >
                  <option value="">すべて</option>
                  {himeList.map((hime) => (
                    <option key={hime.id} value={hime.id}>
                      {hime.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 売り上げ範囲 */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  売り上げ
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-[var(--color-text-secondary)] mb-1">
                      最小
                    </label>
                    <input
                      type="number"
                      value={tempFilterMinSales}
                      onChange={(e) => setTempFilterMinSales(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2.5 min-h-[44px] bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--color-text-secondary)] mb-1">
                      最大
                    </label>
                    <input
                      type="number"
                      value={tempFilterMaxSales}
                      onChange={(e) => setTempFilterMaxSales(e.target.value)}
                      placeholder="999999"
                      className="w-full px-3 py-2.5 min-h-[44px] bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-base"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleResetFilter}
                  variant="secondary"
                  className="flex-1"
                >
                  リセット
                </Button>
                <Button onClick={handleApplyFilter} className="flex-1">
                  適用
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <TableAddModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            loadTableList();
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
}
