import { useState, useRef, useEffect, memo } from "react";

interface LazyImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export const LazyImage = memo<LazyImageProps>(
  ({
    src,
    alt,
    className = "",
    width,
    height,
    placeholder,
    onLoad,
    onError,
  }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(false);
    const [hasError, setHasError] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);

    useEffect(() => {
      if (!imgRef.current || !src) return;

      // Intersection Observerで遅延読み込み
      // パフォーマンス向上のため、より積極的な読み込み
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsInView(true);
              observerRef.current?.disconnect();
            }
          });
        },
        {
          rootMargin: "100px", // 100px手前で読み込み開始（より積極的）
          threshold: 0.01,
        }
      );

      observerRef.current.observe(imgRef.current);

      return () => {
        if (observerRef.current) {
          observerRef.current.disconnect();
        }
      };
    }, [src]);

    const handleLoad = () => {
      setIsLoaded(true);
      onLoad?.();
    };

    const handleError = () => {
      setHasError(true);
      onError?.();
    };

    if (!src) {
      return (
        <div
          className={`bg-[var(--color-background-secondary)] flex items-center justify-center ${className}`}
          style={{ width, height }}
          aria-label={alt}
        >
          {placeholder || (
            <svg
              className="w-8 h-8 text-[var(--color-text-secondary)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          )}
        </div>
      );
    }

    if (hasError) {
      return (
        <div
          className={`bg-[var(--color-background-secondary)] flex items-center justify-center ${className}`}
          style={{ width, height }}
          aria-label={alt}
        >
          <svg
            className="w-8 h-8 text-[var(--color-text-secondary)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      );
    }

    return (
      <div className={`relative ${className}`} style={{ width, height }}>
        {/* プレースホルダー */}
        {!isLoaded && (
          <div
            className="absolute inset-0 bg-[var(--color-background-secondary)] animate-pulse"
            style={{ width, height }}
          />
        )}

        {/* 実際の画像 */}
        {isInView && (
          <img
            ref={imgRef}
            src={src}
            alt={alt}
            width={width}
            height={height}
            loading="lazy"
            decoding="async"
            className={`transition-opacity duration-300 ${
              isLoaded ? "opacity-100" : "opacity-0"
            } ${className}`}
            onLoad={handleLoad}
            onError={handleError}
          />
        )}
      </div>
    );
  }
);

LazyImage.displayName = "LazyImage";
