/**
 * リクエストバッチャー
 * 複数のリクエストをバッチ処理してパフォーマンスを向上
 */

interface PendingRequest<T> {
  resolve: (value: T) => void;
  reject: (error: Error) => void;
}

class RequestBatcher<T> {
  private pendingRequests: Map<string, PendingRequest<T>[]> = new Map();
  private batchTimeout: number = 10; // 10ms以内のリクエストをバッチ処理
  private timer: NodeJS.Timeout | null = null;

  constructor(private batchFn: (keys: string[]) => Promise<Map<string, T>>) {}

  async request(key: string): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.pendingRequests.has(key)) {
        this.pendingRequests.set(key, []);
      }
      this.pendingRequests.get(key)!.push({ resolve, reject });

      if (this.timer) {
        clearTimeout(this.timer);
      }

      this.timer = setTimeout(() => {
        this.flush();
      }, this.batchTimeout);
    });
  }

  private async flush() {
    if (this.pendingRequests.size === 0) return;

    const keys = Array.from(this.pendingRequests.keys());
    const allPending = new Map(this.pendingRequests);
    this.pendingRequests.clear();
    this.timer = null;

    try {
      const results = await this.batchFn(keys);
      allPending.forEach((pending, key) => {
        const result = results.get(key);
        if (result !== undefined) {
          pending.forEach(({ resolve }) => resolve(result));
        } else {
          pending.forEach(({ reject }) =>
            reject(new Error(`No result for key: ${key}`))
          );
        }
      });
    } catch (error) {
      allPending.forEach((pending) => {
        pending.forEach(({ reject }) => reject(error as Error));
      });
    }
  }
}

export { RequestBatcher };

