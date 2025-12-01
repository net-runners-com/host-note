import { memo, useMemo } from "react";
import { createAvatar } from "@dicebear/core";
import { initials } from "@dicebear/collection";
import { LazyImage } from "./LazyImage";

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
  sm: { class: "w-8 h-8 text-sm", pixel: 32 },
  md: { class: "w-12 h-12 text-base", pixel: 48 },
  lg: { class: "w-16 h-16 text-lg", pixel: 64 },
  xl: { class: "w-24 h-24 text-2xl", pixel: 96 },
};

export const Avatar = memo<AvatarProps>(
  ({ src, name, size = "md", className = "" }) => {
    const sizeConfig = sizeMap[size];
    const sizeClasses = sizeConfig.class;

    // アバターURLをメモ化（srcがない場合のみ生成）
    const avatarUrl = useMemo(() => {
      if (src) return null;
      const avatar = createAvatar(initials, {
        seed: name,
        size: sizeConfig.pixel,
      });
      return avatar.toDataUri();
    }, [src, name, sizeConfig.pixel]);

    if (src) {
      const eager = size === "sm" || size === "md"; // リスト用アイコンは即読み込み
      return (
        <LazyImage
          src={src}
          alt={name}
          width={sizeConfig.pixel}
          height={sizeConfig.pixel}
          eager={eager}
          className={`${sizeClasses} rounded-full object-cover ${className}`}
        />
      );
    }

    return (
      <img
        src={avatarUrl || undefined}
        alt={name}
        width={sizeConfig.pixel}
        height={sizeConfig.pixel}
        className={`${sizeClasses} rounded-full ${className}`}
        loading="lazy"
        decoding="async"
      />
    );
  }
);

Avatar.displayName = "Avatar";
