import { memo } from "react";
import { Link } from "react-router-dom";
import { Avatar } from "./Avatar";
import { format } from "date-fns";
import { ja } from "date-fns/locale/ja";

interface MemoizedHimeListItemProps {
  id: number | undefined;
  name: string;
  photoUrl?: string | null;
  birthday?: string | null;
  isFirstVisit?: boolean;
  tantoCastId?: number | null;
  myCastId?: number;
  stats: {
    sales: number;
    visitCount: number;
    lastVisitDate: Date | null;
    firstVisitDate: Date | null;
  };
}

export const MemoizedHimeListItem = memo<MemoizedHimeListItemProps>(
  ({
    id,
    name,
    photoUrl,
    birthday,
    isFirstVisit,
    tantoCastId,
    myCastId,
    stats,
  }) => {
    const isMyHime = myCastId && tantoCastId === myCastId;

    return (
      <Link
        to={`/hime/${id}`}
        className="block p-4 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors relative"
      >
        {isMyHime && (
          <span className="absolute top-2 right-2 bg-[var(--color-primary)] text-white text-xs font-semibold px-2 py-1 rounded-full">
            担当
          </span>
        )}
        <div className="flex items-center space-x-4">
          <Avatar src={photoUrl} name={name} size="md" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-[var(--color-text)]">{name}</h3>
              {isFirstVisit && (
                <span className="px-2 py-0.5 text-xs bg-[var(--color-primary)] text-[var(--color-background)] rounded">
                  新規
                </span>
              )}
            </div>
            <div className="mt-2 space-y-1">
              {birthday && (
                <p className="text-sm text-[var(--color-text-secondary)]">
                  誕生日:{" "}
                  {format(new Date(birthday), "yyyy年M月d日", { locale: ja })}
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
                <span className="text-[var(--color-text-secondary)]">
                  初回来店:{" "}
                  <span className="font-semibold">
                    {stats.firstVisitDate
                      ? format(stats.firstVisitDate, "yyyy年M月d日", {
                          locale: ja,
                        })
                      : "データなし"}
                  </span>
                </span>
                <span className="text-[var(--color-text-secondary)]">
                  直近来店:{" "}
                  <span className="font-semibold">
                    {stats.lastVisitDate
                      ? format(stats.lastVisitDate, "yyyy年M月d日", {
                          locale: ja,
                        })
                      : "データなし"}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  },
  (prevProps, nextProps) => {
    // カスタム比較関数でパフォーマンス向上
    return (
      prevProps.id === nextProps.id &&
      prevProps.name === nextProps.name &&
      prevProps.photoUrl === nextProps.photoUrl &&
      prevProps.birthday === nextProps.birthday &&
      prevProps.isFirstVisit === nextProps.isFirstVisit &&
      prevProps.tantoCastId === nextProps.tantoCastId &&
      prevProps.myCastId === nextProps.myCastId &&
      prevProps.stats.sales === nextProps.stats.sales &&
      prevProps.stats.visitCount === nextProps.stats.visitCount &&
      prevProps.stats.lastVisitDate?.getTime() ===
        nextProps.stats.lastVisitDate?.getTime() &&
      prevProps.stats.firstVisitDate?.getTime() ===
        nextProps.stats.firstVisitDate?.getTime()
    );
  }
);

MemoizedHimeListItem.displayName = "MemoizedHimeListItem";
