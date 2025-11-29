import { memo } from "react";
import { Link } from "react-router-dom";
import { Avatar } from "./Avatar";
import { format } from "date-fns";
import { ja } from "date-fns/locale/ja";

interface MemoizedListItemProps {
  id: number | undefined;
  name: string;
  photoUrl?: string | null;
  birthday?: string | null;
  champagneCallSong?: string | null;
  memos?: Array<{ content: string }> | null;
  to: string;
  badge?: {
    text: string;
    className?: string;
  };
  className?: string;
}

export const MemoizedListItem = memo<MemoizedListItemProps>(
  ({
    name,
    photoUrl,
    birthday,
    champagneCallSong,
    memos,
    to,
    badge,
    className = "",
  }) => {
    return (
      <Link
        to={to}
        className={`block p-4 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors relative ${className}`}
      >
        {badge && (
          <span
            className={`absolute top-2 right-2 text-white text-xs font-semibold px-2 py-1 rounded-full ${badge.className || "bg-[var(--color-primary)]"}`}
          >
            {badge.text}
          </span>
        )}
        <div className="flex items-center space-x-4">
          <Avatar src={photoUrl} name={name} size="md" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[var(--color-text)]">{name}</h3>
            <div className="mt-2 space-y-1">
              {birthday && (
                <p className="text-sm text-[var(--color-text-secondary)]">
                  誕生日:{" "}
                  {format(new Date(birthday), "yyyy年M月d日", { locale: ja })}
                </p>
              )}
              {champagneCallSong && (
                <p className="text-sm text-[var(--color-text-secondary)]">
                  シャンパンコール: {champagneCallSong}
                </p>
              )}
              {memos && memos.length > 0 && (
                <p className="text-sm text-[var(--color-text-secondary)]">
                  メモ: {memos[0].content}
                </p>
              )}
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
      prevProps.champagneCallSong === nextProps.champagneCallSong &&
      prevProps.memos?.[0]?.content === nextProps.memos?.[0]?.content &&
      prevProps.to === nextProps.to &&
      prevProps.badge?.text === nextProps.badge?.text
    );
  }
);

MemoizedListItem.displayName = "MemoizedListItem";
