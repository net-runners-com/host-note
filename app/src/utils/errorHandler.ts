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
  if (!isDevelopment) return;

  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  // Chrome拡張機能のエラーは無視
  if (
    errorStack?.includes('chrome-extension://') ||
    errorMessage.includes('runtime/sendMessage') ||
    errorMessage.includes('message port closed')
  ) {
    return;
  }

  console.error('[Error]', {
    message: errorMessage,
    stack: errorStack,
    context,
    timestamp: new Date().toISOString(),
  });
}

/**
 * エラーメッセージを取得
 */
export function getErrorMessage(error: unknown, defaultMessage = 'エラーが発生しました'): string {
  if (error instanceof Error) {
    return error.message || defaultMessage;
  }
  if (typeof error === 'string') {
    return error;
  }
  return defaultMessage;
}

/**
 * APIエラーかどうかを判定
 */
export function isApiError(error: unknown): error is { status: number; message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof (error as { status: unknown }).status === 'number'
  );
}

