import { useEffect, useMemo } from "react";
import { SkeletonCard } from "../../components/common/Skeleton";
import { Link } from "react-router-dom";
import { useScheduleStore } from "../../stores/scheduleStore";
import { useTableStore } from "../../stores/tableStore";
import { useHimeStore } from "../../stores/himeStore";
import { useCastStore } from "../../stores/castStore";
import { useVisitStore } from "../../stores/visitStore";
import { Card } from "../../components/common/Card";
import { format } from "date-fns";
import { ja } from "date-fns/locale/ja";

export default function HomePage() {
  const {
    todaySchedules,
    loading: scheduleLoading,
    loadTodaySchedules,
  } = useScheduleStore();
  const { tableList, loading: tableLoading, loadTableList } = useTableStore();
  const { himeList, loading: himeLoading, loadHimeList } = useHimeStore();
  const { castList, loading: castLoading, loadCastList } = useCastStore();
  const { visitList, loading: visitLoading, loadVisitList } = useVisitStore();

  useEffect(() => {
    loadTodaySchedules();
    loadTableList();
    loadHimeList();
    loadCastList();
    loadVisitList();
  }, [loadTodaySchedules, loadTableList, loadHimeList, loadCastList, loadVisitList]);

  const recentTables = tableList.slice(0, 5);

  // 今月の来店予定をフィルタリング
  const thisMonthVisits = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return visitList
      .filter((visit) => {
        const visitDate = new Date(visit.visitDate);
        return (
          visitDate.getFullYear() === currentYear &&
          visitDate.getMonth() === currentMonth
        );
      })
      .sort((a, b) => {
        const dateA = new Date(a.visitDate).getTime();
        const dateB = new Date(b.visitDate).getTime();
        return dateB - dateA; // 新しい順
      });
  }, [visitList]);

  const thisMonthBirthdays = [
    ...himeList.filter((h) => {
      if (!h.birthday) return false;
      const birthMonth = new Date(h.birthday).getMonth() + 1;
      return birthMonth === new Date().getMonth() + 1;
    }),
    ...castList.filter((c) => {
      if (!c.birthday) return false;
      const birthMonth = new Date(c.birthday).getMonth() + 1;
      return birthMonth === new Date().getMonth() + 1;
    }),
  ];

  if (scheduleLoading || tableLoading || himeLoading || castLoading || visitLoading) {
    return (
      <div className="space-y-6">
        <Card title="今日の来店予定">
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </Card>

        <Card title="最近の卓記録">
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </Card>

        <Card title="今月の来店予定">
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </Card>

        <Card title="今月の誕生日">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 今日の来店予定 */}
      <Card title="今日の来店予定">
        {todaySchedules.length === 0 ? (
          <p className="text-[var(--color-text-secondary)]">
            今日の予定はありません
          </p>
        ) : (
          <div className="space-y-2">
            {todaySchedules.map((schedule) => (
              <div
                key={schedule.id}
                className="p-3 bg-[var(--color-background)] rounded border border-[var(--color-border)]"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/hime/${schedule.hime?.id}`}
                      className="font-semibold text-base text-[var(--color-primary)] hover:underline touch-manipulation flex items-center min-h-[44px]"
                    >
                      {schedule.hime?.name || "不明"}
                    </Link>
                    <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                      {format(new Date(schedule.scheduledDatetime), "HH:mm", {
                        locale: ja,
                      })}
                    </p>
                  </div>
                </div>
                {schedule.memo && (
                  <p className="text-sm text-[var(--color-text-secondary)] mt-2">
                    {schedule.memo}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 直近の卓記録 */}
      <Card title="直近の卓記録">
        {recentTables.length === 0 ? (
          <p className="text-[var(--color-text-secondary)]">
            卓記録がありません
          </p>
        ) : (
          <div className="space-y-2">
            {recentTables.map((table) => (
              <Link
                key={table.id}
                to={`/table/${table.id}`}
                className="block p-3 bg-[var(--color-background)] rounded border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors touch-manipulation"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-base">
                      {format(
                        new Date(table.datetime),
                        "yyyy年MM月dd日 HH:mm",
                        { locale: ja }
                      )}
                    </p>
                    <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                      姫: {table.himeList?.length || 0}名 / キャスト:{" "}
                      {table.mainCast ? 1 : 0} + {table.helpCasts?.length || 0}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* 今月の来店予定 */}
      <Card title="今月の来店予定">
        {thisMonthVisits.length === 0 ? (
          <p className="text-[var(--color-text-secondary)]">
            今月の来店予定はありません
          </p>
        ) : (
          <div className="space-y-2">
            {thisMonthVisits.map((visit) => (
              <div
                key={visit.id}
                className="p-3 bg-[var(--color-background)] rounded border border-[var(--color-border)]"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/hime/${visit.hime?.id}`}
                      className="font-semibold text-base text-[var(--color-primary)] hover:underline touch-manipulation flex items-center min-h-[44px]"
                    >
                      {visit.hime?.name || "不明"}
                    </Link>
                    <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                      {format(new Date(visit.visitDate), "MM月dd日", {
                        locale: ja,
                      })}
                    </p>
                  </div>
                </div>
                {visit.memo && (
                  <p className="text-sm text-[var(--color-text-secondary)] mt-2">
                    {visit.memo}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 今月の誕生日 */}
      <Card title="今月の誕生日">
        {thisMonthBirthdays.length === 0 ? (
          <p className="text-[var(--color-text-secondary)]">
            今月の誕生日はありません
          </p>
        ) : (
          <div className="space-y-2">
            {thisMonthBirthdays.map((person) => (
              <div
                key={`${"tantoCastId" in person ? "hime" : "cast"}-${person.id}`}
                className="p-3 bg-[var(--color-background)] rounded border border-[var(--color-border)]"
              >
                <Link
                  to={`/${"tantoCastId" in person ? "hime" : "cast"}/${person.id}`}
                  className="font-semibold text-base text-[var(--color-primary)] hover:underline touch-manipulation flex items-center min-h-[44px]"
                >
                  {person.name}
                </Link>
                {person.birthday && (
                  <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                    {format(new Date(person.birthday), "MM月dd日", {
                      locale: ja,
                    })}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
