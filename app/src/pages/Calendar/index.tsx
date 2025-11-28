import { useEffect, useState, useMemo, useRef } from "react";
import {
  Calendar,
  momentLocalizer,
  View,
  SlotInfo,
  Components,
} from "react-big-calendar";
import moment from "moment";
import "moment/locale/ja";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "../../styles/calendar.css";
import { format } from "date-fns";
import { ja } from "date-fns/locale/ja";
import { useTableStore } from "../../stores/tableStore";
import { useScheduleStore } from "../../stores/scheduleStore";
import { useVisitStore } from "../../stores/visitStore";
import { useHimeStore } from "../../stores/himeStore";
import { Card } from "../../components/common/Card";
import { Skeleton } from "../../components/common/Skeleton";
import { Button } from "../../components/common/Button";
import { AddScheduleModal } from "./AddScheduleModal";
import { DayEventsModal } from "./DayEventsModal";
import { ScheduleDetailModal } from "./ScheduleDetailModal";
import { TableDetailModal } from "./TableDetailModal";
import { VisitDetailModal } from "./VisitDetailModal";
import { TableRecordWithDetails } from "../../types/table";
import { ScheduleWithHime } from "../../types/schedule";
import { VisitRecordWithHime } from "../../types/visit";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

moment.locale("ja");
const localizer = momentLocalizer(moment);

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: {
    type: "schedule" | "table" | "visit";
    data: ScheduleWithHime | TableRecordWithDetails | VisitRecordWithHime;
  };
}

interface CalendarType {
  id: string;
  name: string;
  color: string;
  visible: boolean;
}

export default function CalendarPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { tableList, loadTableList } = useTableStore();
  const { scheduleList, loadScheduleList } = useScheduleStore();
  const { visitList, loadVisitList } = useVisitStore();
  const { himeList, loadHimeList } = useHimeStore();
  const [currentView, setCurrentView] = useState<View>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDayEventsModal, setShowDayEventsModal] = useState(false);
  const [showScheduleDetailModal, setShowScheduleDetailModal] = useState(false);
  const [showTableDetailModal, setShowTableDetailModal] = useState(false);
  const [showVisitDetailModal, setShowVisitDetailModal] = useState(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(
    null
  );
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [selectedVisitId, setSelectedVisitId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDayForEvents, setSelectedDayForEvents] = useState<Date | null>(
    null
  );
  const [sidebarOpen, setSidebarOpen] = useState(false); // モバイルではデフォルトで非表示
  const [isShowMoreClick, setIsShowMoreClick] = useState(false); // 他N件クリック検出用
  const eventClickRef = useRef<string | null>(null); // イベントクリック検出用（より確実に）

  const [calendarTypes, setCalendarTypes] = useState<CalendarType[]>([
    { id: "schedule", name: "予定", color: "#FF6B6B", visible: true }, // 赤系
    { id: "table", name: "卓記録", color: "#4A90E2", visible: true }, // 青系
    { id: "visit", name: "来店履歴", color: "#F5A623", visible: true }, // オレンジ系
  ]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        loadTableList(),
        loadScheduleList(),
        loadVisitList(),
        loadHimeList(),
      ]);
      setLoading(false);
    };
    loadData();
  }, [loadTableList, loadScheduleList, loadVisitList, loadHimeList]);

  // URLパラメータからモーダルの状態を復元
  useEffect(() => {
    const scheduleIdParam = searchParams.get("scheduleId");
    if (scheduleIdParam) {
      const id = parseInt(scheduleIdParam);
      if (!isNaN(id)) {
        // 既に同じモーダルが開いている場合は何もしない
        if (showScheduleDetailModal && selectedScheduleId === id) {
          return;
        }
        setSelectedScheduleId(id);
        setShowScheduleDetailModal(true);
      }
    } else {
      // URLパラメータが削除された場合はモーダルを閉じる
      if (showScheduleDetailModal) {
        setShowScheduleDetailModal(false);
        setSelectedScheduleId(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // 全イベントリスト（モーダル表示用）
  const allEvents: CalendarEvent[] = useMemo(() => {
    const events: CalendarEvent[] = [];

    // 予定
    if (calendarTypes.find((t) => t.id === "schedule")?.visible) {
      const scheduleEvents: CalendarEvent[] = scheduleList
        .map((schedule) => {
          const hime = himeList.find((h) => h.id === schedule.himeId);
          if (!hime) return null;

          const scheduleWithHime: ScheduleWithHime = {
            ...schedule,
            hime,
          };

          const startDate = new Date(schedule.scheduledDatetime);
          const endDate = moment(startDate).endOf("day").toDate();
          return {
            id: `schedule-${schedule.id}`,
            title: `${hime.name}`,
            start: startDate,
            end: endDate,
            resource: {
              type: "schedule" as const,
              data: scheduleWithHime,
            },
          } as CalendarEvent;
        })
        .filter((event): event is CalendarEvent => event !== null);
      events.push(...scheduleEvents);
    }

    // 卓記録
    if (calendarTypes.find((t) => t.id === "table")?.visible) {
      const tableEvents: CalendarEvent[] = tableList
        .filter((table) => table.himeList && table.himeList.length > 0)
        .map((table) => {
          const startDate = new Date(table.datetime);
          const endDate = moment(startDate).endOf("day").toDate();
          const himeNames =
            table.himeList?.map((h) => h.name).join(", ") || "なし";
          return {
            id: `table-${table.id}`,
            title: himeNames,
            start: startDate,
            end: endDate,
            resource: {
              type: "table",
              data: table,
            },
          };
        });
      events.push(...tableEvents);
    }

    // 来店履歴
    if (calendarTypes.find((t) => t.id === "visit")?.visible) {
      const visitEvents: CalendarEvent[] = visitList
        .filter((visit) => visit.hime)
        .map((visit) => {
          const startDate = new Date(visit.visitDate);
          const endDate = moment(startDate).endOf("day").toDate();
          return {
            id: `visit-${visit.id}`,
            title: visit.hime?.name || "不明",
            start: startDate,
            end: endDate,
            resource: {
              type: "visit",
              data: visit,
            },
          };
        });
      events.push(...visitEvents);
    }

    return events;
  }, [scheduleList, tableList, visitList, himeList, calendarTypes]);

  // カレンダー表示用イベント（すべて個別に表示）
  const events: CalendarEvent[] = useMemo(() => {
    // 時間順にソートして返す
    const sortedEvents = [...allEvents].sort(
      (a, b) => a.start.getTime() - b.start.getTime()
    );
    return sortedEvents;
  }, [allEvents]);

  const handleSelectSlot = (slotInfo: SlotInfo) => {
    // 日付セルをクリックしたら、その日のイベント一覧を表示
    setSelectedDayForEvents(slotInfo.start);
    setShowDayEventsModal(true);
  };

  const handleShowMore = (_events: CalendarEvent[], date: Date) => {
    // 他N件クリックを検出
    setIsShowMoreClick(true);

    // 日付が現在の月の範囲外（前の月や次の月）の場合は、現在の月の最初の日付に正規化
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const dateMonth = date.getMonth();
    const dateYear = date.getFullYear();

    // 現在の月の範囲内の日付を使用
    const normalizedDate =
      dateMonth === currentMonth && dateYear === currentYear
        ? date
        : new Date(currentYear, currentMonth, 1);

    setSelectedDayForEvents(normalizedDate);
    setShowDayEventsModal(true);

    // デフォルトの日カレンダー遷移を防ぐ
    return false;
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    // 重複実行を防ぐ（同じイベントIDで100ms以内のクリックを無視）
    const eventId = event.id;
    const now = Date.now();
    const lastClickKey = `${eventId}-${Math.floor(now / 100)}`;

    if (eventClickRef.current === lastClickKey) {
      return;
    }
    eventClickRef.current = lastClickKey;

    if (event.resource.type === "schedule") {
      const schedule = event.resource.data as ScheduleWithHime;
      // 既に同じモーダルが開いている場合は何もしない
      if (showScheduleDetailModal && selectedScheduleId === schedule.id) {
        return;
      }
      setSelectedScheduleId(schedule.id!);
      setShowScheduleDetailModal(true);
      // URLパラメータに追加して履歴に保存
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set("scheduleId", schedule.id!.toString());
      setSearchParams(newSearchParams, { replace: false });
    } else if (event.resource.type === "table") {
      const table = event.resource.data as TableRecordWithDetails;
      navigate(`/table/${table.id}`);
    } else if (event.resource.type === "visit") {
      const visit = event.resource.data as VisitRecordWithHime;
      navigate(`/hime/${visit.hime.id}`);
    }
  };

  const handleCloseScheduleModal = () => {
    // まずURLパラメータを削除（これによりuseEffectが実行されるが、パラメータがないのでモーダルは閉じられる）
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete("scheduleId");
    setSearchParams(newSearchParams, { replace: true });
    // その後、状態を更新
    setShowScheduleDetailModal(false);
    setSelectedScheduleId(null);
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    const type = calendarTypes.find((t) => t.id === event.resource.type);
    const color = type?.color || "#D4AF37";

    // 色に応じてテキストの色を調整
    const textColor = "#FFFFFF";

    return {
      style: {
        backgroundColor: color,
        borderColor: color,
        color: textColor,
        borderRadius: "4px",
        border: "none",
        padding: "2px 4px",
        fontSize: "0.625rem",
        fontWeight: 500,
        opacity: type?.visible ? 1 : 0.3,
        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
        lineHeight: "1.2",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      },
    };
  };

  const toggleCalendarType = (id: string) => {
    setCalendarTypes((prev) =>
      prev.map((type) =>
        type.id === id ? { ...type, visible: !type.visible } : type
      )
    );
  };

  // カスタムイベントコンポーネント
  const EventComponent = ({ event, ...props }: any) => {
    const type = calendarTypes.find((t) => t.id === event.resource.type);
    const color = type?.color || "#D4AF37";
    const textColor =
      event.resource.type === "schedule" ? "#FFFFFF" : "#000000";

    // DOM要素に渡すべきでないプロパティを除外（すべてのイベントハンドラーを除外）
    const {
      continuesPrior,
      continuesAfter,
      isAllDay,
      slotStart,
      slotEnd,
      onClick: _onClick,
      onDoubleClick: _onDoubleClick,
      onMouseDown: _onMouseDown,
      onMouseUp: _onMouseUp,
      onTouchStart: _onTouchStart,
      onTouchEnd: _onTouchEnd,
      ...domProps
    } = props;

    return (
      <div
        {...domProps}
        style={{
          ...domProps.style,
          backgroundColor: color,
          borderColor: color,
          color: textColor,
          borderRadius: "4px",
          border: "none",
          padding: "2px 4px",
          fontSize: "0.625rem",
          fontWeight: 500,
          opacity: type?.visible ? 1 : 0.3,
          boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
          cursor: "pointer",
          lineHeight: "1.2",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.nativeEvent.stopImmediatePropagation();
          handleSelectEvent(event);
        }}
      >
        {event.title}
      </div>
    );
  };

  // カスタムヘッダーコンポーネント（曜日を日本語化）
  const HeaderComponent = ({ date, label, localizer, ...props }: any) => {
    const days = ["日", "月", "火", "水", "木", "金", "土"];
    const dayName = days[date.getDay()];

    return (
      <div {...props} className="rbc-header">
        <div className="text-xs md:text-sm font-semibold">{dayName}</div>
      </div>
    );
  };

  const components: Components<CalendarEvent> = {
    event: EventComponent,
    header: HeaderComponent,
  };

  if (loading) {
    return (
      <div className="fixed inset-0 top-16 md:top-20 bottom-16 md:bottom-0 left-0 right-0 flex flex-col md:flex-row gap-2 md:gap-4 p-1 md:p-6 bg-[var(--color-background)] overflow-hidden">
        <div className="hidden md:block w-64 bg-[var(--color-surface)] border-r border-[var(--color-border)] rounded-2xl p-4">
          <Skeleton
            variant="rectangular"
            width={150}
            height={28}
            className="mb-4"
          />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-4 rounded-xl">
                <Skeleton variant="circular" width={20} height={20} />
                <Skeleton variant="rectangular" width={100} height={20} />
              </div>
            ))}
          </div>
        </div>

        <Card className="flex-1 flex flex-col min-h-0">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <Skeleton variant="rectangular" width={100} height={40} />
              <Skeleton variant="rectangular" width={100} height={40} />
              <Skeleton variant="rectangular" width={100} height={40} />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton variant="rectangular" width={60} height={40} />
              <Skeleton variant="rectangular" width={60} height={40} />
              <Skeleton variant="rectangular" width={80} height={40} />
            </div>
          </div>

          <div className="flex-1 min-h-0">
            <Skeleton variant="rectangular" width="100%" height="100%" />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 top-16 md:top-20 bottom-16 md:bottom-0 left-0 right-0 flex flex-col md:flex-row gap-2 md:gap-4 p-1 md:p-6 bg-[var(--color-background)] overflow-hidden">
      {/* サイドバー - モバイルではオーバーレイ */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 top-16 bottom-16 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        </>
      )}
      <div
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } fixed md:relative left-0 top-16 md:top-0 bottom-16 md:bottom-0 h-auto md:h-full w-64 md:w-64 z-50 md:z-auto transition-transform duration-300 bg-[var(--color-surface)] border-r border-[var(--color-border)] rounded-r-2xl md:rounded-2xl ${
          sidebarOpen ? "" : "md:block"
        }`}
      >
        <div className="p-4 space-y-4 h-full overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">マイカレンダー</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-text)] p-2 rounded-full hover:bg-[var(--color-background)] transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="フィルターを閉じる"
            >
              <FaChevronUp className="rotate-90" />
            </button>
          </div>
          <div className="space-y-1">
            {calendarTypes.map((type) => (
              <label
                key={type.id}
                className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all touch-manipulation min-h-[44px] ${
                  type.visible
                    ? "bg-[var(--color-background)] shadow-sm"
                    : "hover:bg-[var(--color-background)] opacity-60"
                }`}
              >
                <input
                  type="checkbox"
                  checked={type.visible}
                  onChange={() => toggleCalendarType(type.id)}
                  className="w-5 h-5 rounded-full border-2 border-[var(--color-border)] cursor-pointer touch-manipulation"
                  style={{
                    accentColor: type.color,
                  }}
                />
                <div
                  className="w-5 h-5 rounded-full flex-shrink-0 shadow-sm"
                  style={{ backgroundColor: type.color }}
                />
                <span className="text-sm font-medium flex-1">{type.name}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Card className="flex-1 flex flex-col overflow-hidden rounded-xl md:rounded-2xl p-2 md:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 md:mb-4 gap-2 md:gap-3 flex-shrink-0">
            <div className="flex items-center gap-1 md:gap-2">
              {!sidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="text-[var(--color-text-secondary)] hover:text-[var(--color-text)] p-1.5 md:p-2 rounded-full hover:bg-[var(--color-background)] transition-colors touch-manipulation min-h-[36px] md:min-h-[44px] min-w-[36px] md:min-w-[44px] flex items-center justify-center"
                  aria-label="フィルターを開く"
                >
                  <FaChevronDown className="rotate-90 text-sm md:text-base" />
                </button>
              )}
              <h1 className="text-lg md:text-xl lg:text-2xl font-bold">
                カレンダー
              </h1>
              <input
                type="month"
                value={format(currentDate, "yyyy-MM", { locale: ja })}
                onChange={(e) => {
                  if (e.target.value) {
                    const [year, month] = e.target.value.split("-").map(Number);
                    setCurrentDate(new Date(year, month - 1, 1));
                  }
                }}
                className="text-base md:text-lg text-[var(--color-text)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-1.5 md:px-4 md:py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] cursor-pointer touch-manipulation min-h-[36px] md:min-h-[44px]"
              />
            </div>
            <div className="flex gap-1 md:gap-2 flex-wrap">
              <Button
                variant={currentView === "month" ? "primary" : "secondary"}
                onClick={() => setCurrentView("month")}
                size="sm"
                className="touch-manipulation min-h-[36px] md:min-h-[44px] rounded-lg md:rounded-xl text-xs md:text-sm px-2 md:px-4"
              >
                月
              </Button>
              <Button
                onClick={() => {
                  setSelectedDate(new Date());
                  setShowAddModal(true);
                }}
                size="sm"
                className="touch-manipulation min-h-[36px] md:min-h-[44px] rounded-lg md:rounded-xl text-xs md:text-sm px-2 md:px-4"
              >
                + 予定
              </Button>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-hidden">
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              view={currentView}
              onView={(view) => {
                // 日カレンダーへの遷移を防ぐ
                if (view !== "day") {
                  setCurrentView(view);
                }
              }}
              date={currentDate}
              onNavigate={(newDate, view) => {
                // 日カレンダーへの遷移を防ぐ
                if (view === "day") {
                  return;
                }
                // 他N件クリックからの遷移を防ぐ
                if (isShowMoreClick) {
                  // フラグをリセット
                  setIsShowMoreClick(false);
                  return;
                }
                // 月表示の場合、同じ月内の日付変更は無視（他N件クリック時の月遷移を防ぐ）
                if (view === "month") {
                  const currentMonth = currentDate.getMonth();
                  const currentYear = currentDate.getFullYear();
                  const newMonth = newDate.getMonth();
                  const newYear = newDate.getFullYear();

                  // 月が変わった場合
                  if (currentMonth !== newMonth || currentYear !== newYear) {
                    // 現在の日付と新しい日付の差を計算
                    const daysDiff = Math.abs(
                      (newDate.getTime() - currentDate.getTime()) /
                        (1000 * 60 * 60 * 24)
                    );

                    // 7日以内の遷移（他N件クリックによる前月/次月の日付への遷移）は無視
                    // ユーザーが明示的にナビゲーションボタンを押した場合は、通常30日以上の差がある
                    if (daysDiff < 7) {
                      return;
                    }

                    setCurrentDate(newDate);
                  }
                }
              }}
              onSelectSlot={handleSelectSlot}
              onSelectEvent={() => {}} // カスタムEventComponentで処理するため、ここでは何もしない
              onShowMore={handleShowMore}
              selectable
              eventPropGetter={eventStyleGetter}
              components={components}
              popup={false}
              views={["month"]}
              messages={{
                next: "次",
                previous: "前",
                today: "今日",
                month: "月",
                day: "日",
                agenda: "予定表",
                date: "日付",
                time: "時間",
                event: "イベント",
                noEventsInRange: "この期間に予定はありません",
                showMore: (total) => `他${total}件`,
              }}
              formats={{
                dayHeaderFormat: (date) => {
                  const days = ["日", "月", "火", "水", "木", "金", "土"];
                  return days[date.getDay()];
                },
                weekdayFormat: (date) => {
                  const days = ["日", "月", "火", "水", "木", "金", "土"];
                  return days[date.getDay()];
                },
                dayRangeHeaderFormat: ({ start, end }) => {
                  const days = ["日", "月", "火", "水", "木", "金", "土"];
                  const startDay = days[start.getDay()];
                  const endDay = days[end.getDay()];
                  return `${startDay} - ${endDay}`;
                },
              }}
              culture="ja"
              style={{
                height: "100%",
                minHeight: "100%",
              }}
              className="calendar-custom"
            />
          </div>
        </Card>

        {showAddModal && selectedDate && (
          <AddScheduleModal
            selectedDate={selectedDate}
            onClose={() => {
              setShowAddModal(false);
              setSelectedDate(null);
            }}
          />
        )}

        {showEditModal && selectedScheduleId && selectedDate && (
          <AddScheduleModal
            selectedDate={selectedDate}
            scheduleId={selectedScheduleId}
            onClose={() => {
              setShowEditModal(false);
              setSelectedScheduleId(null);
              setSelectedDate(null);
              loadScheduleList();
            }}
          />
        )}

        {showDayEventsModal && selectedDayForEvents && (
          <DayEventsModal
            date={selectedDayForEvents}
            events={allEvents}
            onClose={() => {
              setShowDayEventsModal(false);
              setSelectedDayForEvents(null);
            }}
            onScheduleClick={(scheduleId) => {
              setSelectedScheduleId(scheduleId);
              setShowScheduleDetailModal(true);
              setShowDayEventsModal(false);
              // URLパラメータに追加して履歴に保存
              const newSearchParams = new URLSearchParams(searchParams);
              newSearchParams.set("scheduleId", scheduleId.toString());
              setSearchParams(newSearchParams, { replace: false });
            }}
            onTableClick={(tableId: number) => {
              setSelectedTableId(tableId);
              setShowTableDetailModal(true);
              setShowDayEventsModal(false);
            }}
            onVisitClick={(visitId: number) => {
              setSelectedVisitId(visitId);
              setShowVisitDetailModal(true);
              setShowDayEventsModal(false);
            }}
            onAddSchedule={(date: Date) => {
              setSelectedDate(date);
              setShowAddModal(true);
              setShowDayEventsModal(false);
            }}
          />
        )}

        {showScheduleDetailModal && selectedScheduleId && (
          <ScheduleDetailModal
            scheduleId={selectedScheduleId}
            onClose={handleCloseScheduleModal}
            onEdit={(scheduleId: number) => {
              const schedule = scheduleList.find((s) => s.id === scheduleId);
              if (schedule) {
                setSelectedDate(new Date(schedule.scheduledDatetime));
                setShowEditModal(true);
                setShowScheduleDetailModal(false);
              }
            }}
            onDelete={() => {
              loadScheduleList();
            }}
          />
        )}

        {showTableDetailModal && selectedTableId && (
          <TableDetailModal
            tableId={selectedTableId}
            onClose={() => {
              setShowTableDetailModal(false);
              setSelectedTableId(null);
            }}
          />
        )}

        {showVisitDetailModal && selectedVisitId && (
          <VisitDetailModal
            visitId={selectedVisitId}
            onClose={() => {
              setShowVisitDetailModal(false);
              setSelectedVisitId(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
