import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  format,
  parseISO,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  isWithinInterval,
  eachDayOfInterval,
  eachMonthOfInterval,
  startOfDay,
  subWeeks,
  addWeeks,
} from "date-fns";
import { ja } from "date-fns/locale";
import { api } from "../../utils/api";
import { Hime } from "../../types/hime";
import { TableRecordWithDetails } from "../../types/table";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Loading } from "../../components/common/Loading";
import { Skeleton, SkeletonCard } from "../../components/common/Skeleton";
import { MultiSelect } from "../../components/common/MultiSelect";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { toast } from "react-toastify";
import { logError } from "../../utils/errorHandler";
import { useMenuStore } from "../../stores/menuStore";
import { useHimeStore } from "../../stores/himeStore";
import { useCastStore } from "../../stores/castStore";

interface AnalysisData {
  hime: Hime;
  visitCount: number;
  sales: number;
  salesByCategory: Record<string, number>;
}

interface TimeSeriesData {
  date: string;
  sales: number;
  visitCount: number;
  [key: string]: number | string;
}

type PeriodType = "week" | "month" | "year";

export default function AnalysisPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { menuList, loadMenuList, getCategories } = useMenuStore();
  const { himeList, loadHimeList } = useHimeStore();
  const { castList, loadCastList } = useCastStore();
  const categories = getCategories();
  const [analysisData, setAnalysisData] = useState<AnalysisData[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodType, setPeriodType] = useState<PeriodType>("month");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedWeek, setSelectedWeek] = useState(new Date());

  // URLパラメータから初期選択された姫IDを取得
  const initialHimeIds =
    searchParams
      .get("himeIds")
      ?.split(",")
      .map((id) => parseInt(id))
      .filter((id) => !isNaN(id)) || [];
  const [selectedHimeIds, setSelectedHimeIds] =
    useState<number[]>(initialHimeIds);

  useEffect(() => {
    if (menuList.length === 0) {
      loadMenuList();
    }
    if (himeList.length === 0) {
      loadHimeList();
    }
    if (castList.length === 0) {
      loadCastList();
    }
  }, [
    menuList.length,
    loadMenuList,
    himeList.length,
    loadHimeList,
    castList.length,
    loadCastList,
  ]);

  // URLパラメータが変更されたときに選択状態を更新
  useEffect(() => {
    const himeIds =
      searchParams
        .get("himeIds")
        ?.split(",")
        .map((id) => parseInt(id))
        .filter((id) => !isNaN(id)) || [];
    if (himeIds.length > 0) {
      setSelectedHimeIds(himeIds);
    }
  }, [searchParams]);

  useEffect(() => {
    loadAnalysisData();
  }, [periodType, selectedYear, selectedMonth, selectedWeek, selectedHimeIds]);

  const loadAnalysisData = async () => {
    try {
      setLoading(true);

      // 期間の開始日と終了日を計算
      let startDate: Date;
      let endDate: Date;

      if (periodType === "week") {
        startDate = startOfWeek(selectedWeek, { weekStartsOn: 1, locale: ja });
        endDate = endOfWeek(selectedWeek, { weekStartsOn: 1, locale: ja });
      } else if (periodType === "month") {
        startDate = startOfMonth(new Date(selectedYear, selectedMonth - 1, 1));
        endDate = endOfMonth(new Date(selectedYear, selectedMonth - 1, 1));
      } else {
        startDate = startOfYear(new Date(selectedYear, 0, 1));
        endDate = endOfYear(new Date(selectedYear, 0, 1));
      }

      // データを取得
      const tableList = await api.table.list();

      // 期間内の卓記録をフィルタリング
      let filteredTables = tableList.filter((table: TableRecordWithDetails) => {
        if (!table.datetime) return false;
        const tableDate = parseISO(table.datetime);
        return isWithinInterval(tableDate, { start: startDate, end: endDate });
      });

      // 選択された姫が指定されている場合は、その姫が参加した卓記録のみに絞り込む
      if (selectedHimeIds.length > 0) {
        filteredTables = filteredTables.filter(
          (table: TableRecordWithDetails) => {
            return table.himeList?.some(
              (h) => h.id && selectedHimeIds.includes(h.id)
            );
          }
        );
      }

      // 対象の姫を決定（選択されている場合は選択された姫、そうでなければ全て）
      const targetHimes =
        selectedHimeIds.length > 0
          ? himeList.filter((h) => h.id && selectedHimeIds.includes(h.id))
          : himeList;

      // 姫ごとに集計
      const analysisMap = new Map<
        number,
        {
          hime: Hime;
          visitCount: number;
          sales: number;
          salesByCategory: Record<string, number>;
        }
      >();

      // 初期化：対象の姫のみ追加
      targetHimes.forEach((hime) => {
        if (!hime.id) return;
        const salesByCategory: Record<string, number> = {};
        categories.forEach((cat) => {
          salesByCategory[cat] = 0;
        });
        analysisMap.set(hime.id, {
          hime,
          visitCount: 0,
          sales: 0,
          salesByCategory,
        });
      });

      // 卓記録から集計
      filteredTables.forEach((table: TableRecordWithDetails) => {
        if (!table.himeList || table.himeList.length === 0 || !table.salesInfo)
          return;

        // 選択された姫が指定されている場合は、その姫が参加した卓記録のみを集計
        const targetHimesInTable =
          selectedHimeIds.length > 0
            ? table.himeList.filter(
                (h) => h.id && selectedHimeIds.includes(h.id)
              )
            : table.himeList;

        if (targetHimesInTable.length === 0) return;

        // 注文内容からカテゴリー別の売上を計算
        const categorySales: Record<string, number> = {};
        categories.forEach((cat) => {
          categorySales[cat] = 0;
        });

        if (table.salesInfo.orderItems) {
          table.salesInfo.orderItems.forEach((orderItem) => {
            const menuItem = menuList.find(
              (item) => item.name === orderItem.name
            );
            if (menuItem) {
              const category = menuItem.category;
              if (!categorySales[category]) {
                categorySales[category] = 0;
              }
              categorySales[category] += orderItem.amount;
            }
          });
        }

        // 売上を計算（対象の姫に均等に分配）
        const totalSales = table.salesInfo.total || 0;
        const himeCount = targetHimesInTable.length;
        const salesPerHime = himeCount > 0 ? totalSales / himeCount : 0;

        targetHimesInTable.forEach((hime) => {
          if (!hime.id) return;
          const existing = analysisMap.get(hime.id);
          if (existing) {
            existing.visitCount += 1;
            existing.sales += Math.round(salesPerHime);

            // カテゴリー別の売上も分配
            categories.forEach((cat) => {
              if (categorySales[cat]) {
                existing.salesByCategory[cat] += Math.round(
                  categorySales[cat] / himeCount
                );
              }
            });
          }
        });
      });

      // 配列に変換して、来店回数でソート
      const result = Array.from(analysisMap.values())
        .filter((item) => item.visitCount > 0 || selectedHimeIds.length > 0) // 選択されている場合は来店回数0でも表示
        .sort((a, b) => b.visitCount - a.visitCount); // 来店回数の降順

      setAnalysisData(result);

      // 時系列データを集計
      const timeSeriesMap = new Map<
        string,
        {
          sales: number;
          visitCount: number;
          [key: string]: number; // カテゴリー別の売上
        }
      >();

      // 期間内の全ての日付を生成
      let dateKeys: string[] = [];
      if (periodType === "week" || periodType === "month") {
        // 日ごとに集計
        const days = eachDayOfInterval({ start: startDate, end: endDate });
        dateKeys = days.map((day) => format(day, "yyyy-MM-dd"));
      } else {
        // 月ごとに集計
        const months = eachMonthOfInterval({ start: startDate, end: endDate });
        dateKeys = months.map((month) => format(month, "yyyy-MM"));
      }

      // 初期化
      dateKeys.forEach((key) => {
        const data: {
          sales: number;
          visitCount: number;
          [key: string]: number;
        } = {
          sales: 0,
          visitCount: 0,
        };
        categories.forEach((cat) => {
          data[cat] = 0;
        });
        timeSeriesMap.set(key, data);
      });

      // 卓記録から時系列データを集計
      filteredTables.forEach((table: TableRecordWithDetails) => {
        if (!table.datetime || !table.salesInfo) return;

        // 選択された姫が指定されている場合は、その姫が参加した卓記録のみを集計
        const targetHimesInTable =
          selectedHimeIds.length > 0
            ? table.himeList?.filter(
                (h) => h.id && selectedHimeIds.includes(h.id)
              ) || []
            : table.himeList || [];

        if (targetHimesInTable.length === 0) return;

        const tableDate = parseISO(table.datetime);
        let dateKey: string;

        if (periodType === "week" || periodType === "month") {
          dateKey = format(startOfDay(tableDate), "yyyy-MM-dd");
        } else {
          dateKey = format(tableDate, "yyyy-MM");
        }

        const existing = timeSeriesMap.get(dateKey);
        if (existing) {
          // 対象の姫に分配した売上を集計
          const totalSales = table.salesInfo.total || 0;
          const himeCount = targetHimesInTable.length;
          const salesPerHime = himeCount > 0 ? totalSales / himeCount : 0;
          existing.sales += Math.round(salesPerHime);
          existing.visitCount += targetHimesInTable.length;

          // カテゴリー別の売上を集計（対象の姫に分配）
          if (table.salesInfo.orderItems) {
            const categorySales: Record<string, number> = {};
            categories.forEach((cat) => {
              categorySales[cat] = 0;
            });

            table.salesInfo.orderItems.forEach((orderItem) => {
              const menuItem = menuList.find(
                (item) => item.name === orderItem.name
              );
              if (menuItem) {
                const category = menuItem.category;
                categorySales[category] += orderItem.amount;
              }
            });

            categories.forEach((cat) => {
              if (categorySales[cat] && existing[cat] !== undefined) {
                existing[cat] += Math.round(categorySales[cat] / himeCount);
              }
            });
          }
        }
      });

      // 配列に変換してソート
      const timeSeriesResult = Array.from(timeSeriesMap.entries())
        .map(([date, data]) => ({
          date,
          sales: data.sales,
          visitCount: data.visitCount,
          ...categories.reduce(
            (acc, cat) => {
              acc[cat] = data[cat] || 0;
              return acc;
            },
            {} as Record<string, number>
          ),
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      setTimeSeriesData(timeSeriesResult);
    } catch (error) {
      toast.error("分析データの取得に失敗しました");
      logError(error, { component: "AnalysisPage", action: "loadData" });
    } finally {
      setLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const totalVisits = analysisData.reduce(
    (sum, item) => sum + item.visitCount,
    0
  );
  const totalSales = analysisData.reduce((sum, item) => sum + item.sales, 0);

  // カテゴリー別の総売上を集計
  const salesByCategory = categories.reduce(
    (acc, category) => {
      acc[category] = analysisData.reduce(
        (sum, item) => sum + (item.salesByCategory[category] || 0),
        0
      );
      return acc;
    },
    {} as Record<string, number>
  );

  // 円グラフ用のデータ
  const pieChartData = Object.entries(salesByCategory)
    .filter(([_, value]) => value > 0)
    .map(([name, value]) => ({
      name,
      value,
    }));

  // 円グラフの色
  const COLORS: Record<string, string> = {
    ボトル系: "#3b82f6",
    缶もの: "#8b5cf6",
    割物: "#10b981",
    フード系: "#f59e0b",
    その他: "#6b7280",
  };

  const getPeriodLabel = () => {
    if (periodType === "week") {
      const weekStart = startOfWeek(selectedWeek, {
        weekStartsOn: 1,
        locale: ja,
      });
      const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 1, locale: ja });
      return `${format(weekStart, "yyyy年MM月dd日", { locale: ja })} ～ ${format(weekEnd, "yyyy年MM月dd日", { locale: ja })}`;
    } else if (periodType === "month") {
      return `${selectedYear}年${selectedMonth}月`;
    } else {
      return `${selectedYear}年`;
    }
  };

  const handleWeekChange = (direction: "prev" | "next") => {
    if (direction === "prev") {
      setSelectedWeek(subWeeks(selectedWeek, 1));
    } else {
      setSelectedWeek(addWeeks(selectedWeek, 1));
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Skeleton variant="rectangular" width={200} height={32} className="mb-2" />
            <Skeleton variant="text" width={150} height={16} />
          </div>
        </div>
        <SkeletonCard />
        <SkeletonCard />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <SkeletonCard />
      </div>
    );
  }

  // 姫選択のオプション（担当キャスト名も表示）
  const himeOptions = [
    { value: -1, label: "すべて" }, // 「すべて」オプション
    ...himeList.map((hime) => {
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
    }),
  ];

  const handleHimeSelectionChange = (himeIds: number[]) => {
    // 「すべて」が選択されている場合
    if (himeIds.includes(-1)) {
      // 個別の姫も選択されている場合は、「すべて」を除外して個別の姫のみを選択
      const individualHimeIds = himeIds.filter((id) => id !== -1);
      if (individualHimeIds.length > 0) {
        setSelectedHimeIds(individualHimeIds);
        navigate(`/analysis?himeIds=${individualHimeIds.join(",")}`, {
          replace: true,
        });
      } else {
        // 「すべて」のみが選択されている場合
        setSelectedHimeIds([]);
        navigate("/analysis", { replace: true });
      }
    } else {
      // 個別の姫が選択された場合
      setSelectedHimeIds(himeIds);
      // URLパラメータを更新
      if (himeIds.length > 0) {
        navigate(`/analysis?himeIds=${himeIds.join(",")}`, { replace: true });
      } else {
        navigate("/analysis", { replace: true });
      }
    }
  };

  // 「すべて」が選択されているかどうかを判定（selectedHimeIdsが空の場合は「すべて」）
  const isAllSelected = selectedHimeIds.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {selectedHimeIds.length > 0
              ? selectedHimeIds.length === 1
                ? `${himeList.find((h) => h.id === selectedHimeIds[0])?.name || ""}の分析`
                : `${selectedHimeIds.length}名の分析`
              : "担当姫全体の分析"}
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            {getPeriodLabel()}のデータ
          </p>
        </div>
      </div>

      {/* 姫選択 */}
      <Card>
        <div className="space-y-4">
          <label className="block text-sm font-medium">
            分析対象の姫（複数選択可）
          </label>
          <MultiSelect
            options={himeOptions}
            selectedValues={isAllSelected ? [-1] : selectedHimeIds}
            onChange={handleHimeSelectionChange}
            placeholder="姫を選択してください"
          />
        </div>
      </Card>

      {/* 期間タイプ選択 */}
      <Card>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={periodType === "week" ? "primary" : "ghost"}
              onClick={() => setPeriodType("week")}
              className="min-h-[44px]"
            >
              週
            </Button>
            <Button
              variant={periodType === "month" ? "primary" : "ghost"}
              onClick={() => setPeriodType("month")}
              className="min-h-[44px]"
            >
              月
            </Button>
            <Button
              variant={periodType === "year" ? "primary" : "ghost"}
              onClick={() => setPeriodType("year")}
              className="min-h-[44px]"
            >
              年
            </Button>
          </div>

          {/* 期間選択 */}
          {periodType === "week" && (
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="ghost"
                onClick={() => handleWeekChange("prev")}
                className="min-h-[44px]"
              >
                ←
              </Button>
              <span className="text-sm text-[var(--color-text-secondary)] min-w-[200px] text-center">
                {getPeriodLabel()}
              </span>
              <Button
                variant="ghost"
                onClick={() => handleWeekChange("next")}
                className="min-h-[44px]"
              >
                →
              </Button>
            </div>
          )}

          {periodType === "month" && (
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-3 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] text-[var(--color-text)] min-h-[44px]"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}年
                  </option>
                ))}
              </select>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="px-3 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] text-[var(--color-text)] min-h-[44px]"
              >
                {months.map((month) => (
                  <option key={month} value={month}>
                    {month}月
                  </option>
                ))}
              </select>
            </div>
          )}

          {periodType === "year" && (
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-3 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] text-[var(--color-text)] min-h-[44px]"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}年
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </Card>

      {/* サマリー */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <div className="text-sm text-[var(--color-text-secondary)] mb-1">
            総来店回数
          </div>
          <div className="text-2xl font-bold">{totalVisits}回</div>
        </Card>
        <Card>
          <div className="text-sm text-[var(--color-text-secondary)] mb-1">
            総売上
          </div>
          <div className="text-2xl font-bold">
            ¥{totalSales.toLocaleString()}
          </div>
        </Card>
      </div>

      {/* 時系列グラフ */}
      {timeSeriesData.length > 0 && (
        <>
          {/* 売上推移グラフ */}
          <Card title={`${getPeriodLabel()}の売上推移`}>
            <div className="w-full" style={{ height: "350px", minHeight: 0, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={timeSeriesData}
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-border)"
                  />
                  <XAxis
                    dataKey="date"
                    stroke="var(--color-text-secondary)"
                    tick={{ fill: "var(--color-text-secondary)", fontSize: 12 }}
                    tickFormatter={(value) => {
                      if (periodType === "year") {
                        return format(parseISO(value + "-01"), "M月", {
                          locale: ja,
                        });
                      } else {
                        return format(parseISO(value), "M/d", { locale: ja });
                      }
                    }}
                  />
                  <YAxis
                    stroke="var(--color-text-secondary)"
                    tick={{ fill: "var(--color-text-secondary)", fontSize: 12 }}
                    tickFormatter={(value) => `¥${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "8px",
                      color: "var(--color-text)",
                    }}
                    labelStyle={{ color: "var(--color-text-secondary)" }}
                    formatter={(value: number) => [
                      `¥${value.toLocaleString()}`,
                      "売上",
                    ]}
                    labelFormatter={(label) => {
                      if (periodType === "year") {
                        return format(parseISO(label + "-01"), "yyyy年M月", {
                          locale: ja,
                        });
                      } else {
                        return format(parseISO(label), "yyyy年M月d日", {
                          locale: ja,
                        });
                      }
                    }}
                  />
                  <Legend
                    wrapperStyle={{ color: "var(--color-text)" }}
                    iconType="line"
                  />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="売上"
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* 来店回数推移グラフ */}
          <Card title={`${getPeriodLabel()}の来店回数推移`}>
            <div className="w-full" style={{ height: "350px", minHeight: 0, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={timeSeriesData}
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-border)"
                  />
                  <XAxis
                    dataKey="date"
                    stroke="var(--color-text-secondary)"
                    tick={{ fill: "var(--color-text-secondary)", fontSize: 12 }}
                    tickFormatter={(value) => {
                      if (periodType === "year") {
                        return format(parseISO(value + "-01"), "M月", {
                          locale: ja,
                        });
                      } else {
                        return format(parseISO(value), "M/d", { locale: ja });
                      }
                    }}
                  />
                  <YAxis
                    stroke="var(--color-text-secondary)"
                    tick={{ fill: "var(--color-text-secondary)", fontSize: 12 }}
                    tickFormatter={(value) => Math.round(value).toString()}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "8px",
                      color: "var(--color-text)",
                    }}
                    labelStyle={{ color: "var(--color-text-secondary)" }}
                    formatter={(value: number) => [
                      `${Math.round(value)}回`,
                      "来店回数",
                    ]}
                    labelFormatter={(label) => {
                      if (periodType === "year") {
                        return format(parseISO(label + "-01"), "yyyy年M月", {
                          locale: ja,
                        });
                      } else {
                        return format(parseISO(label), "yyyy年M月d日", {
                          locale: ja,
                        });
                      }
                    }}
                  />
                  <Legend
                    wrapperStyle={{ color: "var(--color-text)" }}
                    iconType="square"
                  />
                  <Bar
                    dataKey="visitCount"
                    fill="#10b981"
                    name="来店回数"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </>
      )}

      {/* 売上内訳グラフ */}
      {pieChartData.length > 0 && (
        <Card title={`${getPeriodLabel()}の売上内訳`}>
          <div className="w-full" style={{ height: "350px", minHeight: 0, minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${percent !== undefined ? (percent * 100).toFixed(1) : 0}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[entry.name] || "#6b7280"}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                    color: "var(--color-text)",
                  }}
                  formatter={(value: number) => [
                    `¥${value.toLocaleString()}`,
                    "売上",
                  ]}
                />
                <Legend
                  wrapperStyle={{ color: "var(--color-text)" }}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* 姫別ランキング */}
      {analysisData.length > 0 && (
        <Card title={`${getPeriodLabel()}の姫別ランキング`}>
          <div className="overflow-x-auto">
            {/* デスクトップ表示 */}
            <table className="hidden md:table w-full">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--color-text-secondary)]">
                    順位
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--color-text-secondary)]">
                    姫名
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-[var(--color-text-secondary)]">
                    来店回数
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-[var(--color-text-secondary)]">
                    売上
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-[var(--color-text-secondary)]">
                    平均売上
                  </th>
                </tr>
              </thead>
              <tbody>
                {analysisData.map((item, index) => (
                  <tr
                    key={item.hime.id}
                    className="border-b border-[var(--color-border)] hover:bg-[var(--color-background)] cursor-pointer transition-colors"
                    onClick={() => navigate(`/hime/${item.hime.id}`)}
                  >
                    <td className="py-3 px-4">{index + 1}</td>
                    <td className="py-3 px-4 font-medium">{item.hime.name}</td>
                    <td className="py-3 px-4 text-right">
                      {item.visitCount}回
                    </td>
                    <td className="py-3 px-4 text-right">
                      ¥{item.sales.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      ¥
                      {item.visitCount > 0
                        ? Math.round(
                            item.sales / item.visitCount
                          ).toLocaleString()
                        : 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* モバイル表示 */}
            <div className="md:hidden space-y-3">
              {analysisData.map((item, index) => (
                <div
                  key={item.hime.id}
                  className="p-4 border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-background)] cursor-pointer transition-colors"
                  onClick={() => navigate(`/hime/${item.hime.id}`)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-[var(--color-text-secondary)]">
                        #{index + 1}
                      </span>
                      <span className="font-medium">{item.hime.name}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-[var(--color-text-secondary)]">
                        来店回数:{" "}
                      </span>
                      <span className="font-medium">{item.visitCount}回</span>
                    </div>
                    <div>
                      <span className="text-[var(--color-text-secondary)]">
                        売上:{" "}
                      </span>
                      <span className="font-medium">
                        ¥{item.sales.toLocaleString()}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[var(--color-text-secondary)]">
                        平均売上:{" "}
                      </span>
                      <span className="font-medium">
                        ¥
                        {item.visitCount > 0
                          ? Math.round(
                              item.sales / item.visitCount
                            ).toLocaleString()
                          : 0}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
