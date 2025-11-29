import { useEffect, useState, useMemo } from "react";
import { useCastStore } from "../../stores/castStore";
import { useHimeStore } from "../../stores/himeStore";
import { SearchBar } from "../../components/common/SearchBar";
import { Button } from "../../components/common/Button";
import { EmptyState } from "../../components/common/EmptyState";
import { Skeleton } from "../../components/common/Skeleton";
import { MemoizedListItem } from "../../components/common/MemoizedListItem";
import { useDebounce } from "../../hooks/useDebounce";
import { FaFilter } from "react-icons/fa";
import { Pagination } from "../../components/common/Pagination";
import { CastAddModal } from "./CastAddModal";
import { api } from "../../utils/api";
import { Cast } from "../../types/cast";

export default function CastListPage() {
  const { castList, loading, loadCastList, searchCastWithFilters } =
    useCastStore();
  const { himeList, loadHimeList } = useHimeStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterHimeId, setFilterHimeId] = useState<number | null>(null);
  const [tempFilterHimeId, setTempFilterHimeId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [myCast, setMyCast] = useState<Cast | null>(null);
  const itemsPerPage = 10;
  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    loadCastList();
    loadHimeList();
    loadMyCast();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // マウント時のみ実行

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
    const hasFilters = debouncedSearch || filterHimeId !== null;

    if (hasFilters) {
      searchCastWithFilters({
        query: debouncedSearch || undefined,
        himeId: filterHimeId ?? undefined,
      });
    } else {
      loadCastList();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, filterHimeId]); // 検索条件のみを依存配列に

  const handleOpenFilter = () => {
    setTempFilterHimeId(filterHimeId);
    setShowFilterModal(true);
  };

  const handleCloseFilter = () => {
    setShowFilterModal(false);
    setTempFilterHimeId(filterHimeId);
  };

  const handleApplyFilter = () => {
    setFilterHimeId(tempFilterHimeId);
    setShowFilterModal(false);
  };

  const handleResetFilter = () => {
    setTempFilterHimeId(null);
  };

  const hasActiveFilters = filterHimeId !== null;

  // ページネーション
  const totalPages = Math.ceil(castList.length / itemsPerPage);
  const paginatedCastList = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return castList.slice(startIndex, endIndex);
  }, [castList, currentPage, itemsPerPage]);

  // ページが変更されたら、フィルタや検索が変更されたら1ページ目に戻る
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, filterHimeId]);

  const renderCastListItem = useMemo(
    () => (cast: (typeof castList)[0]) => {
      const isMyCast = myCast && cast.id === myCast.id;
      return (
        <MemoizedListItem
          key={cast.id}
          id={cast.id}
          name={cast.name}
          photoUrl={cast.photoUrl}
          birthday={cast.birthday}
          champagneCallSong={cast.champagneCallSong}
          memos={cast.memos}
          to={`/cast/${cast.id}`}
          badge={isMyCast ? { text: "自分" } : undefined}
        />
      );
    },
    [myCast]
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
        <h1 className="text-xl sm:text-2xl font-bold">キャスト一覧</h1>
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
            + キャストを追加
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="キャストを検索..."
        />
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
              <div>
                <label className="block text-sm font-medium mb-2">
                  担当している姫
                </label>
                <select
                  value={tempFilterHimeId || ""}
                  onChange={(e) =>
                    setTempFilterHimeId(
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  className="w-full px-3 py-2.5 min-h-[44px] bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-base"
                >
                  <option value="">すべての姫</option>
                  {himeList.map((hime) => (
                    <option key={hime.id} value={hime.id}>
                      {hime.name}
                    </option>
                  ))}
                </select>
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

      {castList.length === 0 ? (
        <EmptyState
          message={
            searchQuery || filterHimeId
              ? "検索結果が見つかりませんでした"
              : "キャストが登録されていません"
          }
          actionLabel={
            !searchQuery && !filterHimeId ? "キャストを追加" : undefined
          }
          onAction={
            !searchQuery && !filterHimeId
              ? () => setShowAddModal(true)
              : undefined
          }
        />
      ) : (
        <>
          <div className="space-y-2" style={{ minHeight: "400px" }}>
            {paginatedCastList.map(renderCastListItem)}
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      {showAddModal && (
        <CastAddModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            loadCastList();
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
}
