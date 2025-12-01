/**
 * エラーハンドリングユーティリティ
 * 本番環境ではconsole.errorを抑制し、開発環境でのみログを出力
 */

const isDevelopment = import.meta.env.DEV;

export interface ErrorContext {
  component?: string;
  action?: string;
  [key: string]: unknown;
}

/**
 * エラーをログに記録（開発環境のみ）
 */
export function logError(error: unknown, context?: ErrorContext): void {
  // 本番環境でも重要なエラーはログに記録（ただし詳細情報は制限）

  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  // Chrome拡張機能のエラーは無視
  if (
    errorStack?.includes("chrome-extension://") ||
    errorMessage.includes("runtime/sendMessage") ||
    errorMessage.includes("message port closed")
  ) {
    return;
  }

  // エラーオブジェクトの詳細情報を取得
  const errorDetails: Record<string, unknown> = {
    message: errorMessage,
    timestamp: new Date().toISOString(),
  };

  // スタックトレースは開発環境のみ
  if (errorStack && isDevelopment) {
    errorDetails.stack = errorStack;
  }

  // コンテキスト情報
  if (context) {
    errorDetails.context = context;
  }

  // ApiErrorの場合は追加情報を記録
  if (error && typeof error === "object" && "status" in error) {
    errorDetails.status = (error as { status: unknown }).status;
    if ("response" in error) {
      errorDetails.response = (error as { response: unknown }).response;
    }
  }

  // エラーログを出力
  if (isDevelopment) {
    console.error("[Error]", errorDetails);
  } else {
    // 本番環境では簡潔なログのみ
    console.error("[Error]", {
      message: errorMessage,
      context: context
        ? { component: context.component, action: context.action }
        : undefined,
      timestamp: errorDetails.timestamp,
    });
  }

  // 500エラーなどの重要なエラーは本番環境でも詳細を記録
  if (
    error &&
    typeof error === "object" &&
    "status" in error &&
    typeof (error as { status: unknown }).status === "number" &&
    (error as { status: number }).status >= 500
  ) {
    console.error("[Server Error]", {
      status: (error as { status: number }).status,
      message: errorMessage,
      context,
      timestamp: errorDetails.timestamp,
    });
  }
}

/**
 * エラーメッセージを取得
 */
export function getErrorMessage(
  error: unknown,
  defaultMessage = "エラーが発生しました"
): string {
  if (error instanceof Error) {
    return error.message || defaultMessage;
  }
  if (typeof error === "string") {
    return error;
  }
  return defaultMessage;
}

/**
 * APIエラーかどうかを判定
 */
export function isApiError(
  error: unknown
): error is { status: number; message: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof (error as { status: unknown }).status === "number"
  );
}
