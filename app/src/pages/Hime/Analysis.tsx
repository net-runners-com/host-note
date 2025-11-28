import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../../utils/api";
import { Hime } from "../../types/hime";
import { Cast } from "../../types/cast";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Loading } from "../../components/common/Loading";
import { Avatar } from "../../components/common/Avatar";
import {
  format,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  isWithinInterval,
  parseISO,
  eachDayOfInterval,
  eachMonthOfInterval,
  startOfDay,
} from "date-fns";
import { ja } from "date-fns/locale/ja";
import { toast } from "react-toastify";
import { logError } from "../../utils/errorHandler";
import { TableRecordWithDetails } from "../../types/table";
import { useMenuStore } from "../../stores/menuStore";
import {
  LineChart,
  Line,
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
  [key: string]: string | number; // カテゴリー別の売上
}

type PeriodType = "week" | "month" | "year";

export default function HimeAnalysisPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlightedHimeId = searchParams.get("himeId")
    ? parseInt(searchParams.get("himeId")!)
    : null;
  const { menuList, loadMenuList, getCategories } = useMenuStore();
  const categories = getCategories();
  const [analysisData, setAnalysisData] = useState<AnalysisData[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodType, setPeriodType] = useState<PeriodType>("month");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [myCast, setMyCast] = useState<Cast | null>(null);

  useEffect(() => {
    if (menuList.length === 0) {
      loadMenuList();
    }
    loadMyCast();
  }, [menuList.length, loadMenuList]);

  const loadMyCast = async () => {
    try {
      const cast = await api.myCast.get();
      setMyCast(cast);
    } catch (error) {
      logError(error, { component: "HimeAnalysisPage", action: "loadMyCast" });
    }
  };

  useEffect(() => {
    if (myCast !== null) {
      loadAnalysisData();
    }
  }, [
    periodType,
    selectedYear,
    selectedMonth,
    selectedWeek,
    highlightedHimeId,
    myCast,
  ]);

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
      const [himeList, tableList] = await Promise.all([
        api.hime.list(),
        api.table.list(),
      ]);

      // 自分の担当姫だけにフィルタリング
      const myHimeList = myCast
        ? himeList.filter((h) => h.tantoCastId === myCast.id)
        : [];

      // 特定の姫に絞り込む（自分の担当姫の中から）
      const targetHime: Hime | null = highlightedHimeId
        ? myHimeList.find((h) => h.id === highlightedHimeId) || null
        : null;

      // 期間内の卓記録をフィルタリング
      let filteredTables = tableList.filter((table: TableRecordWithDetails) => {
        if (!table.datetime) return false;
        const tableDate = parseISO(table.datetime);
        return isWithinInterval(tableDate, { start: startDate, end: endDate });
      });

      // 特定の姫が指定されている場合は、その姫が参加した卓記録のみに絞り込む
      if (targetHime) {
        filteredTables = filteredTables.filter(
          (table: TableRecordWithDetails) => {
            return table.himeList?.some((h) => h.id === targetHime!.id);
          }
        );
      }

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

      // 初期化：対象の姫のみ追加（特定の姫が指定されていない場合は自分の担当姫全て）
      const targetHimes = targetHime ? [targetHime] : myHimeList;
      targetHimes.forEach((hime) => {
        const salesByCategory: Record<string, number> = {};
        categories.forEach((cat) => {
          salesByCategory[cat] = 0;
        });
        if (hime.id) {
          analysisMap.set(hime.id, {
            hime,
            visitCount: 0,
            sales: 0,
            salesByCategory,
          });
        }
      });

      // 卓記録から集計
      filteredTables.forEach((table: TableRecordWithDetails) => {
        if (!table.himeList || table.himeList.length === 0 || !table.salesInfo)
          return;

        // 特定の姫が指定されている場合は、その姫が参加した卓記録のみを集計
        const targetHimesInTable = targetHime
          ? table.himeList.filter((h) => h.id === targetHime!.id)
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
        .filter((item) => item.visitCount > 0 || targetHime) // 特定の姫が指定されている場合は来店回数0でも表示
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

        // 特定の姫が指定されている場合は、その姫が参加した卓記録のみを集計
        const targetHimesInTable = targetHime
          ? table.himeList?.filter((h) => h.id === targetHime!.id) || []
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
      logError(error, { component: "HimeAnalysisPage", action: "loadData" });
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
    return <Loading />;
  }

  // 対象の姫を取得
  const targetHime =
    analysisData.length > 0 && highlightedHimeId
      ? analysisData.find((item) => item.hime.id === highlightedHimeId)?.hime
      : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {targetHime ? `${targetHime.name}の分析` : "姫の分析"}
          </h1>
          {targetHime && (
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              {getPeriodLabel()}のデータ
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          onClick={() =>
            navigate(targetHime ? `/hime/${targetHime.id}` : "/hime")
          }
          className="min-h-[44px]"
        >
          ← 戻る
        </Button>
      </div>

      {/* 期間タイプ選択 */}
      <Card>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <label className="text-base font-medium min-w-[60px]">期間:</label>
            <div className="flex gap-3 w-full sm:w-auto">
              <Button
                variant={periodType === "week" ? "primary" : "secondary"}
                size="md"
                onClick={() => setPeriodType("week")}
                className="flex-1 sm:flex-none min-h-[44px]"
              >
                週
              </Button>
              <Button
                variant={periodType === "month" ? "primary" : "secondary"}
                size="md"
                onClick={() => setPeriodType("month")}
                className="flex-1 sm:flex-none min-h-[44px]"
              >
                月
              </Button>
              <Button
                variant={periodType === "year" ? "primary" : "secondary"}
                size="md"
                onClick={() => setPeriodType("year")}
                className="flex-1 sm:flex-none min-h-[44px]"
              >
                年
              </Button>
            </div>
          </div>

          {periodType === "week" && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <label className="text-base font-medium min-w-[60px]">週:</label>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => handleWeekChange("prev")}
                  className="min-h-[44px] min-w-[44px]"
                >
                  ←
                </Button>
                <input
                  type="date"
                  value={format(selectedWeek, "yyyy-MM-dd")}
                  onChange={(e) => setSelectedWeek(new Date(e.target.value))}
                  className="flex-1 sm:flex-none px-4 py-3 text-base border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] text-[var(--color-text)] min-h-[44px]"
                />
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => handleWeekChange("next")}
                  className="min-h-[44px] min-w-[44px]"
                >
                  →
                </Button>
              </div>
              <div className="w-full sm:w-auto mt-2 sm:mt-0">
                <span className="text-sm text-[var(--color-text-secondary)] block sm:inline">
                  {getPeriodLabel()}
                </span>
              </div>
            </div>
          )}

          {periodType === "month" && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <label className="text-base font-medium min-w-[60px]">
                期間:
              </label>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <div className="flex items-center gap-3 flex-1 sm:flex-none">
                  <label className="text-base font-medium whitespace-nowrap">
                    年:
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="flex-1 sm:flex-none px-4 py-3 text-base border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] text-[var(--color-text)] min-h-[44px]"
                  >
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}年
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-3 flex-1 sm:flex-none">
                  <label className="text-base font-medium whitespace-nowrap">
                    月:
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="flex-1 sm:flex-none px-4 py-3 text-base border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] text-[var(--color-text)] min-h-[44px]"
                  >
                    {months.map((month) => (
                      <option key={month} value={month}>
                        {month}月
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {periodType === "year" && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <label className="text-base font-medium min-w-[60px]">年:</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="flex-1 sm:flex-none px-4 py-3 text-base border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] text-[var(--color-text)] min-h-[44px]"
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <div className="text-center py-4">
            <p className="text-base text-[var(--color-text-secondary)] mb-2">
              総来店回数
            </p>
            <p className="text-3xl font-bold text-[var(--color-primary)]">
              {totalVisits}回
            </p>
          </div>
        </Card>
        <Card>
          <div className="text-center py-4">
            <p className="text-base text-[var(--color-text-secondary)] mb-2">
              総売上
            </p>
            <p className="text-3xl font-bold text-[var(--color-primary)]">
              ¥{totalSales.toLocaleString()}
            </p>
          </div>
        </Card>
      </div>

      {/* 時系列グラフ */}
      {timeSeriesData.length > 0 && (
        <>
          <Card title={`${getPeriodLabel()}の推移`}>
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
                    yAxisId="left"
                    stroke="var(--color-text-secondary)"
                    tick={{ fill: "var(--color-text-secondary)", fontSize: 12 }}
                    tickFormatter={(value) => `¥${(value / 1000).toFixed(0)}k`}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="var(--color-text-secondary)"
                    tick={{ fill: "var(--color-text-secondary)", fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "8px",
                      color: "var(--color-text)",
                    }}
                    labelStyle={{ color: "var(--color-text-secondary)" }}
                    formatter={(value: number, name: string) => {
                      if (name === "sales") {
                        return [`¥${value.toLocaleString()}`, "売上"];
                      } else if (name === "visitCount") {
                        return [`${value}回`, "来店回数"];
                      }
                      return [value, name];
                    }}
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
                    yAxisId="left"
                    type="monotone"
                    dataKey="sales"
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                    dot={{ fill: "var(--color-primary)", r: 4 }}
                    activeDot={{ r: 6 }}
                    name="売上"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="visitCount"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: "#10b981", r: 4 }}
                    activeDot={{ r: 6 }}
                    name="来店回数"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

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
                        `${name} ${percent ? (percent * 100).toFixed(1) : 0}%`
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
        </>
      )}

      {/* 分析データ一覧 */}
      <Card title={`${getPeriodLabel()}の分析結果`}>
        {analysisData.length === 0 ? (
          <p className="text-[var(--color-text-secondary)] text-center py-8">
            データがありません
          </p>
        ) : (
          <>
            {/* デスクトップ: テーブル表示 */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-[var(--color-border)]">
                    <th className="py-3 px-4 text-left text-sm font-semibold text-[var(--color-text-secondary)]">
                      姫
                    </th>
                    <th className="py-3 px-4 text-right text-sm font-semibold text-[var(--color-text-secondary)]">
                      来店回数
                    </th>
                    <th className="py-3 px-4 text-right text-sm font-semibold text-[var(--color-text-secondary)]">
                      売上
                    </th>
                    <th className="py-3 px-4 text-right text-sm font-semibold text-[var(--color-text-secondary)]">
                      平均売上/回
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {analysisData.map((item) => {
                    const avgSales =
                      item.visitCount > 0
                        ? Math.round(item.sales / item.visitCount)
                        : 0;
                    const isHighlighted = highlightedHimeId === item.hime.id;

                    return (
                      <tr
                        key={item.hime.id}
                        className={`border-b border-[var(--color-border)] hover:bg-[var(--color-background)] cursor-pointer transition-colors ${
                          isHighlighted
                            ? "bg-[var(--color-primary)]/10 border-[var(--color-primary)]"
                            : ""
                        }`}
                        onClick={() => navigate(`/hime/${item.hime.id}`)}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <Avatar
                              src={item.hime.photoUrl}
                              name={item.hime.name}
                              size="sm"
                            />
                            <div>
                              <p className="font-medium">{item.hime.name}</p>
                              {item.hime.isFirstVisit && (
                                <span className="text-xs text-[var(--color-primary)]">
                                  新規
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-semibold">
                            {item.visitCount}回
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex flex-col items-end">
                            <span className="font-semibold text-[var(--color-primary)]">
                              ¥{item.sales.toLocaleString()}
                            </span>
                            <div className="text-xs text-[var(--color-text-secondary)] mt-1 space-y-0.5">
                              {Object.entries(item.salesByCategory)
                                .filter(([_, value]) => value > 0)
                                .map(([category, value]) => (
                                  <div key={category}>
                                    {category}: ¥{value.toLocaleString()}
                                  </div>
                                ))}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-sm text-[var(--color-text-secondary)]">
                            {avgSales > 0
                              ? `¥${avgSales.toLocaleString()}`
                              : "-"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* モバイル: カード表示 */}
            <div className="md:hidden space-y-3">
              {analysisData.map((item) => {
                const avgSales =
                  item.visitCount > 0
                    ? Math.round(item.sales / item.visitCount)
                    : 0;
                const isHighlighted = highlightedHimeId === item.hime.id;

                return (
                  <div
                    key={item.hime.id}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      isHighlighted
                        ? "bg-[var(--color-primary)]/10 border-[var(--color-primary)]"
                        : "bg-[var(--color-surface)] border-[var(--color-border)]"
                    }`}
                    onClick={() => navigate(`/hime/${item.hime.id}`)}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar
                        src={item.hime.photoUrl}
                        name={item.hime.name}
                        size="md"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-base">
                          {item.hime.name}
                        </p>
                        {item.hime.isFirstVisit && (
                          <span className="text-xs text-[var(--color-primary)]">
                            新規
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-[var(--color-text-secondary)] mb-1">
                          来店回数
                        </p>
                        <p className="font-semibold text-base">
                          {item.visitCount}回
                        </p>
                      </div>
                      <div>
                        <p className="text-[var(--color-text-secondary)] mb-1">
                          売上
                        </p>
                        <p className="font-semibold text-base text-[var(--color-primary)]">
                          ¥{item.sales.toLocaleString()}
                        </p>
                        {Object.entries(item.salesByCategory).some(
                          ([_, value]) => value > 0
                        ) && (
                          <div className="text-xs text-[var(--color-text-secondary)] mt-1 space-y-0.5">
                            {Object.entries(item.salesByCategory)
                              .filter(([_, value]) => value > 0)
                              .map(([category, value]) => (
                                <div key={category}>
                                  {category}: ¥{value.toLocaleString()}
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                      {avgSales > 0 && (
                        <div className="col-span-2">
                          <p className="text-[var(--color-text-secondary)] mb-1">
                            平均売上/回
                          </p>
                          <p className="font-semibold text-base">
                            ¥{avgSales.toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
