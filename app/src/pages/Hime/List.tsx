import { useEffect, useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { useHimeStore } from "../../stores/himeStore";
import { useCastStore } from "../../stores/castStore";
import { useTableStore } from "../../stores/tableStore";
import { useVisitStore } from "../../stores/visitStore";
import { SearchBar } from "../../components/common/SearchBar";
import { Button } from "../../components/common/Button";
import { EmptyState } from "../../components/common/EmptyState";
import { Skeleton } from "../../components/common/Skeleton";
import { Avatar } from "../../components/common/Avatar";
import { useDebounce } from "../../hooks/useDebounce";
import { format } from "date-fns";
import { ja } from "date-fns/locale/ja";
import { FaFilter } from "react-icons/fa";
import { logError } from "../../utils/errorHandler";
import { Pagination } from "../../components/common/Pagination";
import { HimeAddModal } from "./HimeAddModal";
import { useOptionStore } from "../../stores/optionStore";
import { api } from "../../utils/api";
import { Cast } from "../../types/cast";

export default function HimeListPage() {
  const { himeList, loading, loadHimeList, searchHimeWithFilters } =
    useHimeStore();
  const { castList, loadCastList } = useCastStore();
  const { tableList, loadTableList } = useTableStore();
  const { visitList, loadVisitList } = useVisitStore();
  const { sortOptions, loadOptions } = useOptionStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterTantoCastId, setFilterTantoCastId] = useState<number | null>(
    null
  );
  const [filterMinSales, setFilterMinSales] = useState<string>("");
  const [filterMaxSales, setFilterMaxSales] = useState<string>("");
  const [filterMinVisits, setFilterMinVisits] = useState<string>("");
  const [filterMaxVisits, setFilterMaxVisits] = useState<string>("");
  const [tempFilterTantoCastId, setTempFilterTantoCastId] = useState<
    number | null
  >(null);
  const [tempFilterMinSales, setTempFilterMinSales] = useState<string>("");
  const [tempFilterMaxSales, setTempFilterMaxSales] = useState<string>("");
  const [tempFilterMinVisits, setTempFilterMinVisits] = useState<string>("");
  const [tempFilterMaxVisits, setTempFilterMaxVisits] = useState<string>("");
  const [sortBy, setSortBy] = useState<"sales" | "visits" | "recent">("recent");
  const [currentPage, setCurrentPage] = useState(1);
  const [myCast, setMyCast] = useState<Cast | null>(null);
  const itemsPerPage = 10;
  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    // 並列でデータを取得
    Promise.all([
      loadHimeList(),
      loadCastList(),
      loadTableList(),
      loadVisitList(),
      loadOptions(),
    ]).catch((error) => {
      logError(error, { component: "HimeListPage", action: "loadData" });
    });
    loadMyCast();
  }, [loadHimeList, loadCastList, loadTableList, loadVisitList, loadOptions]);

  const loadMyCast = async () => {
    try {
      const cast = await api.myCast.get();
      setMyCast(cast);
    } catch (error) {
      // 自分のキャスト情報が存在しない場合は無視
      setMyCast(null);
    }
  };

  useEffect(() => {
    const hasFilters = searchQuery || filterTantoCastId !== null;

    if (hasFilters) {
      searchHimeWithFilters({
        query: searchQuery || undefined,
        tantoCastId: filterTantoCastId ?? undefined,
      });
    } else {
      loadHimeList();
    }
  }, [debouncedSearch, filterTantoCastId, searchHimeWithFilters, loadHimeList]);

  const handleOpenFilter = useCallback(() => {
    setTempFilterTantoCastId(filterTantoCastId);
    setTempFilterMinSales(filterMinSales);
    setTempFilterMaxSales(filterMaxSales);
    setTempFilterMinVisits(filterMinVisits);
    setTempFilterMaxVisits(filterMaxVisits);
    setShowFilterModal(true);
  }, [
    filterTantoCastId,
    filterMinSales,
    filterMaxSales,
    filterMinVisits,
    filterMaxVisits,
  ]);

  const handleCloseFilter = useCallback(() => {
    setShowFilterModal(false);
    setTempFilterTantoCastId(filterTantoCastId);
    setTempFilterMinSales(filterMinSales);
    setTempFilterMaxSales(filterMaxSales);
    setTempFilterMinVisits(filterMinVisits);
    setTempFilterMaxVisits(filterMaxVisits);
  }, [
    filterTantoCastId,
    filterMinSales,
    filterMaxSales,
    filterMinVisits,
    filterMaxVisits,
  ]);

  const handleApplyFilter = useCallback(() => {
    setFilterTantoCastId(tempFilterTantoCastId);
    setFilterMinSales(tempFilterMinSales);
    setFilterMaxSales(tempFilterMaxSales);
    setFilterMinVisits(tempFilterMinVisits);
    setFilterMaxVisits(tempFilterMaxVisits);
    setShowFilterModal(false);
  }, [
    tempFilterTantoCastId,
    tempFilterMinSales,
    tempFilterMaxSales,
    tempFilterMinVisits,
    tempFilterMaxVisits,
  ]);

  const handleResetFilter = useCallback(() => {
    setTempFilterTantoCastId(null);
    setTempFilterMinSales("");
    setTempFilterMaxSales("");
    setTempFilterMinVisits("");
    setTempFilterMaxVisits("");
  }, []);

  const hasActiveFilters =
    filterTantoCastId !== null ||
    filterMinSales !== "" ||
    filterMaxSales !== "" ||
    filterMinVisits !== "" ||
    filterMaxVisits !== "";

  // 今月の開始日と終了日を計算
  const currentMonth = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );
    return { start: startOfMonth, end: endOfMonth };
  }, []);

  // 各姫の今月の売上、来店数、直近の来店日を計算
  const himeStats = useMemo(() => {
    const stats: Record<
      number,
      {
        sales: number;
        visitCount: number;
        lastVisitDate: Date | null;
      }
    > = {};

    himeList.forEach((hime) => {
      if (!hime.id) return;
      stats[hime.id] = { sales: 0, visitCount: 0, lastVisitDate: null };
    });

    // テーブル記録から売上と直近の来店日を計算
    tableList.forEach((table) => {
      const tableDate = new Date(table.datetime);
      const isCurrentMonth =
        tableDate >= currentMonth.start && tableDate <= currentMonth.end;

      table.himeList?.forEach((hime) => {
        if (!hime.id || !stats[hime.id]) return;

        const himeStat = stats[hime.id];

        // 今月の売上を計算
        if (isCurrentMonth && table.salesInfo?.total) {
          const himeCount = table.himeList?.length || 1;
          himeStat.sales += table.salesInfo.total / himeCount;
        }

        // 直近の来店日を更新
        if (!himeStat.lastVisitDate || tableDate > himeStat.lastVisitDate) {
          himeStat.lastVisitDate = tableDate;
        }
      });
    });

    // 来店記録から来店数と直近の来店日を計算
    visitList.forEach((visit) => {
      const visitDate = new Date(visit.visitDate);
      const isCurrentMonth =
        visitDate >= currentMonth.start && visitDate <= currentMonth.end;

      if (!visit.himeId || !stats[visit.himeId]) return;

      const himeStat = stats[visit.himeId];

      if (isCurrentMonth) {
        himeStat.visitCount += 1;
      }

      // 直近の来店日を更新
      if (!himeStat.lastVisitDate || visitDate > himeStat.lastVisitDate) {
        himeStat.lastVisitDate = visitDate;
      }
    });

    return stats;
  }, [himeList, tableList, visitList, currentMonth]);

  // フィルタリングとソートされた姫リスト
  const sortedHimeList = useMemo(() => {
    let filtered = [...himeList];

    // 担当キャストでフィルタ
    if (filterTantoCastId !== null) {
      filtered = filtered.filter(
        (hime) => hime.tantoCastId === filterTantoCastId
      );
    }

    // 売り上げと訪問回数でフィルタ
    filtered = filtered.filter((hime) => {
      if (!hime.id) return false;
      const stats = himeStats[hime.id];
      if (!stats) return false;

      const sales = stats.sales;
      if (filterMinSales !== "") {
        const minSales = parseInt(filterMinSales);
        if (!isNaN(minSales) && sales < minSales) {
          return false;
        }
      }
      if (filterMaxSales !== "") {
        const maxSales = parseInt(filterMaxSales);
        if (!isNaN(maxSales) && sales > maxSales) {
          return false;
        }
      }

      const visitCount = stats.visitCount;
      if (filterMinVisits !== "") {
        const minVisits = parseInt(filterMinVisits);
        if (!isNaN(minVisits) && visitCount < minVisits) {
          return false;
        }
      }
      if (filterMaxVisits !== "") {
        const maxVisits = parseInt(filterMaxVisits);
        if (!isNaN(maxVisits) && visitCount > maxVisits) {
          return false;
        }
      }

      return true;
    });

    // ソート
    const sorted = [...filtered];

    sorted.sort((a, b) => {
      const statsA = a.id
        ? himeStats[a.id]
        : { sales: 0, visitCount: 0, lastVisitDate: null };
      const statsB = b.id
        ? himeStats[b.id]
        : { sales: 0, visitCount: 0, lastVisitDate: null };

      switch (sortBy) {
        case "sales":
          // 売上順（降順）
          return statsB.sales - statsA.sales;
        case "visits":
          // 来店回数順（降順）
          return statsB.visitCount - statsA.visitCount;
        case "recent":
          // 直近（最終来店日順、降順）
          if (!statsA.lastVisitDate && !statsB.lastVisitDate) return 0;
          if (!statsA.lastVisitDate) return 1;
          if (!statsB.lastVisitDate) return -1;
          return (
            statsB.lastVisitDate.getTime() - statsA.lastVisitDate.getTime()
          );
        default:
          return 0;
      }
    });

    return sorted;
  }, [
    himeList,
    himeStats,
    sortBy,
    filterTantoCastId,
    filterMinSales,
    filterMaxSales,
    filterMinVisits,
    filterMaxVisits,
  ]);

  // ページネーション
  const totalPages = Math.ceil(sortedHimeList.length / itemsPerPage);
  const paginatedHimeList = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedHimeList.slice(startIndex, endIndex);
  }, [sortedHimeList, currentPage, itemsPerPage]);

  // ページが変更されたら、フィルタやソートが変更されたら1ページ目に戻る
  useEffect(() => {
    setCurrentPage(1);
  }, [
    debouncedSearch,
    filterTantoCastId,
    filterMinSales,
    filterMaxSales,
    filterMinVisits,
    filterMaxVisits,
    sortBy,
  ]);

  const renderHimeListItem = useCallback(
    (hime: (typeof himeList)[0]) => {
      const stats = hime.id
        ? himeStats[hime.id]
        : { sales: 0, visitCount: 0, lastVisitDate: null };
      const isMyHime = myCast && hime.tantoCastId === myCast.id;

      return (
        <Link
          key={hime.id}
          to={`/hime/${hime.id}`}
          className={`block p-4 bg-[var(--color-surface)] rounded-lg border transition-colors relative ${
            isMyHime
              ? "border-[var(--color-primary)] border-2"
              : "border-[var(--color-border)] hover:border-[var(--color-primary)]"
          }`}
        >
          {isMyHime && (
            <span className="absolute top-2 right-2 bg-[var(--color-primary)] text-white text-xs font-semibold px-2 py-1 rounded-full">
              担当
            </span>
          )}
          <div className="flex items-center space-x-4">
            <Avatar src={hime.photoUrl} name={hime.name} size="md" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-[var(--color-text)]">
                  {hime.name}
                </h3>
                {hime.isFirstVisit && (
                  <span className="px-2 py-0.5 text-xs bg-[var(--color-primary)] text-[var(--color-background)] rounded">
                    新規
                  </span>
                )}
              </div>
              <div className="mt-2 space-y-1">
                {hime.birthday && (
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    誕生日:{" "}
                    {format(new Date(hime.birthday), "yyyy年M月d日", {
                      locale: ja,
                    })}
                  </p>
                )}
                <div className="flex gap-4 text-sm flex-wrap">
                  <span className="text-[var(--color-text-secondary)]">
                    今月の売上:{" "}
                    <span className="font-semibold text-[var(--color-primary)]">
                      ¥{Math.round(stats.sales).toLocaleString()}
                    </span>
                  </span>
                  <span className="text-[var(--color-text-secondary)]">
                    来店数:{" "}
                    <span className="font-semibold">{stats.visitCount}回</span>
                  </span>
                  {stats.lastVisitDate && (
                    <span className="text-[var(--color-text-secondary)]">
                      直近来店:{" "}
                      <span className="font-semibold">
                        {format(stats.lastVisitDate, "yyyy年M月d日", {
                          locale: ja,
                        })}
                      </span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Link>
      );
    },
    [himeStats, myCast]
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Skeleton variant="rectangular" width={120} height={32} />
          <div className="flex items-center gap-2">
            <Skeleton variant="rectangular" width={100} height={40} />
            <Skeleton variant="rectangular" width={120} height={40} />
          </div>
        </div>

        <div className="space-y-4">
          <Skeleton variant="rectangular" width="100%" height={48} />
          <Skeleton variant="rectangular" width="100%" height={80} />
        </div>

        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton variant="rectangular" key={i} width="100%" height={80} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">姫一覧</h1>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant={hasActiveFilters ? "primary" : "secondary"}
            onClick={handleOpenFilter}
            className="flex items-center gap-2 flex-1 sm:flex-none"
          >
            <FaFilter className="mr-2" />
            フィルター
          </Button>
          <Button
            onClick={() => setShowAddModal(true)}
            className="flex-1 sm:flex-none"
          >
            + 姫を追加
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="姫を検索..."
            />
          </div>
          <div className="w-full sm:w-auto">
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as "sales" | "visits" | "recent")
              }
              className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-base"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

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
              {/* 担当キャスト */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  担当キャスト
                </label>
                <select
                  value={tempFilterTantoCastId || ""}
                  onChange={(e) =>
                    setTempFilterTantoCastId(
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

              {/* 訪問回数範囲 */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  訪問回数
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-[var(--color-text-secondary)] mb-1">
                      最小
                    </label>
                    <input
                      type="number"
                      value={tempFilterMinVisits}
                      onChange={(e) => setTempFilterMinVisits(e.target.value)}
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
                      value={tempFilterMaxVisits}
                      onChange={(e) => setTempFilterMaxVisits(e.target.value)}
                      placeholder="999"
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

      {sortedHimeList.length === 0 ? (
        <EmptyState
          message={
            searchQuery || hasActiveFilters
              ? "検索結果が見つかりませんでした"
              : "姫が登録されていません"
          }
          actionLabel={
            !searchQuery && !hasActiveFilters ? "姫を追加" : undefined
          }
          onAction={
            !searchQuery && !hasActiveFilters
              ? () => setShowAddModal(true)
              : undefined
          }
        />
      ) : (
        <>
          <div className="space-y-2">
            {paginatedHimeList.map(renderHimeListItem)}
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      {showAddModal && (
        <HimeAddModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            loadHimeList();
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
}
