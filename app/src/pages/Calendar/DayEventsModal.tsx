import { useMemo } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale/ja";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { CalendarEvent } from "./index";
import { useNavigate } from "react-router-dom";
import { ScheduleWithHime } from "../../types/schedule";
import { TableRecordWithDetails } from "../../types/table";
import { VisitRecordWithHime } from "../../types/visit";

interface DayEventsModalProps {
  date: Date;
  events: CalendarEvent[];
  onClose: () => void;
  onScheduleClick?: (scheduleId: number) => void;
  onTableClick?: (tableId: number) => void;
  onVisitClick?: (visitId: number) => void;
  onAddSchedule?: (date: Date) => void;
}

export function DayEventsModal({ date, events, onClose, onScheduleClick, onTableClick, onVisitClick, onAddSchedule }: DayEventsModalProps) {
  const navigate = useNavigate();

  const dayEvents = useMemo(() => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return events.filter((event) => {
      const eventDate = new Date(event.start);
      return eventDate >= startOfDay && eventDate <= endOfDay;
    });
  }, [date, events]);

  const handleEventClick = (event: CalendarEvent) => {
    if (event.resource.type === "schedule") {
      const schedule = event.resource.data as ScheduleWithHime;
      if (onScheduleClick && schedule.id) {
        onScheduleClick(schedule.id);
      } else {
        navigate(`/schedule/${schedule.id}`);
      }
    } else if (event.resource.type === "table") {
      const table = event.resource.data as TableRecordWithDetails;
      if (onTableClick && table.id) {
        onTableClick(table.id);
      } else {
        navigate(`/table/${table.id}`);
      }
    } else if (event.resource.type === "visit") {
      const visit = event.resource.data as VisitRecordWithHime;
      if (onVisitClick && visit.id) {
        onVisitClick(visit.id);
      } else {
        navigate(`/hime/${visit.hime?.id}`);
      }
    }
    if (!onScheduleClick || event.resource.type !== "schedule") {
      if (event.resource.type === "table" && onTableClick) {
        // onTableClick が呼ばれた場合は閉じない
        return;
      }
      if (event.resource.type === "visit" && onVisitClick) {
        // onVisitClick が呼ばれた場合は閉じない
        return;
      }
      onClose();
    }
  };

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case "schedule":
        return "予定";
      case "table":
        return "卓記録";
      case "visit":
        return "来店履歴";
      default:
        return "";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <Card className="max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <h2 className="text-xl font-bold">
            {format(date, "yyyy年MM月dd日", { locale: ja })}
          </h2>
          <div className="flex items-center gap-2">
            {onAddSchedule && (
              <Button
                onClick={() => {
                  onAddSchedule(date);
                }}
                size="sm"
              >
                + 予定追加
              </Button>
            )}
            <Button variant="ghost" onClick={onClose}>
              ✕
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {dayEvents.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[var(--color-text-secondary)]">
                この日の予定はありません
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {dayEvents.map((event) => {
                const type = event.resource.type;
                const typeColors: Record<string, string> = {
                  schedule: "#FF6B6B",
                  table: "#4A90E2",
                  visit: "#F5A623",
                };
                const color = typeColors[type] || "#D4AF37";

                return (
                  <div
                    key={event.id}
                    onClick={() => handleEventClick(event)}
                    className="p-4 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors cursor-pointer"
                    style={{
                      borderLeft: `4px solid ${color}`,
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className="px-2 py-1 rounded text-xs font-medium text-white"
                            style={{ backgroundColor: color }}
                          >
                            {getEventTypeLabel(type)}
                          </span>
                          <span className="text-sm text-[var(--color-text-secondary)]">
                            {format(new Date(event.start), "HH:mm", {
                              locale: ja,
                            })}
                          </span>
                        </div>
                        <p className="font-semibold text-[var(--color-text)]">
                          {event.title}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
