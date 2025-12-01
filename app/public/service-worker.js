const CACHE_NAME = "hostnote-v1";
const urlsToCache = ["/", "/index.html"];

// インストール
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // エラーハンドリングを追加：一部のリソースが失敗しても続行
      return Promise.allSettled(
        urlsToCache.map((url) =>
          cache.add(url).catch((err) => {
            console.warn(`Failed to cache ${url}:`, err);
            return null;
          })
        )
      );
    })
  );
  // インストール後すぐにアクティベート
  self.skipWaiting();
});

// フェッチ（キャッシュ優先）
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // WebSocket接続はService Workerで処理しない
  if (url.protocol === "ws:" || url.protocol === "wss:") {
    return;
  }

  // Firebase Messaging Service Workerのリクエストは処理しない
  if (url.pathname.includes("firebase-messaging-sw.js")) {
    return;
  }

  // Vite HMR関連のリクエストは処理しない
  if (
    url.hostname === "localhost" ||
    url.hostname === "127.0.0.1" ||
    url.searchParams.has("token") ||
    url.pathname.includes("/@vite/") ||
    url.pathname.includes("/node_modules/")
  ) {
    return;
  }

  // 外部ドメインのリクエストはService Workerで処理しない
  // （Google Analytics、Google Tag Manager、その他の外部スクリプト）
  const currentOrigin = self.location.origin;
  if (url.origin !== currentOrigin) {
    return;
  }

  // APIリクエストやPOST/PUT/DELETEリクエストはキャッシュしない
  // 大きなデータ（cast, hime, tableなど）は特にキャッシュしない
  if (
    url.pathname.startsWith("/api/") ||
    request.method !== "GET" ||
    url.protocol === "chrome-extension:" ||
    url.protocol === "moz-extension:" ||
    url.pathname.includes("/api/v1/cast") ||
    url.pathname.includes("/api/v1/hime") ||
    url.pathname.includes("/api/v1/table")
  ) {
    // ネットワークリクエストのみ（キャッシュしない）
    // タイムアウト付きfetch
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Request timeout")), 30000); // 30秒タイムアウト
    });

    event.respondWith(
      Promise.race([fetch(request), timeoutPromise])
        .then((response) => {
          if (response instanceof Response) {
            return response;
          }
          throw new Error("Invalid response");
        })
        .catch((error) => {
          // エラー時は空のレスポンスを返す
          console.error("Service Worker fetch error:", error);
          return new Response(JSON.stringify({ error: "Network error" }), {
            status: 408,
            headers: { "Content-Type": "application/json" },
          });
        })
    );
    return;
  }

  // 静的リソースはキャッシュ優先
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      // タイムアウト付きfetch
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Request timeout")), 10000); // 10秒タイムアウト
      });

      return Promise.race([fetch(request), timeoutPromise])
        .then((response) => {
          if (response instanceof Response) {
            // 成功したレスポンスのみキャッシュ
            if (response && response.status === 200) {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseToCache).catch((err) => {
                  console.warn("Failed to cache response:", err);
                });
              });
            }
            return response;
          }
          throw new Error("Invalid response");
        })
        .catch((error) => {
          // ネットワークエラー時はキャッシュがあれば返す
          console.error("Fetch failed:", error);
          return caches.match(request).then((cachedResponse) => {
            return (
              cachedResponse ||
              new Response(JSON.stringify({ error: "Network error" }), {
                status: 408,
                headers: { "Content-Type": "application/json" },
              })
            );
          });
        });
    })
  );
});

// アクティベーション（古いキャッシュ削除）
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// スケジュール通知処理
self.addEventListener("message", (event) => {
  if (event.data.type === "SCHEDULE_NOTIFICATION") {
    const { id, title, body, scheduledTime } = event.data.data;
    const delay = new Date(scheduledTime).getTime() - Date.now();

    if (delay > 0) {
      setTimeout(() => {
        self.registration.showNotification(title, {
          body,
          icon: "/icons/icon-192x192.png",
          badge: "/icons/badge-72x72.png",
          tag: id,
        });
      }, delay);
    }
  }
});

// 通知クリック時の処理
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        if (clientList.length > 0) {
          return clientList[0].focus();
        }
        return clients.openWindow("/");
      })
  );
});

// プッシュ通知を受信したときの処理（FCM用）
self.addEventListener("push", (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: "通知", body: event.data.text() };
    }
  }

  // FCMのペイロード形式に対応
  const notification = data.notification || {};
  const title = notification.title || data.title || "通知";
  const options = {
    body: notification.body || data.body || "新しい通知があります",
    icon: notification.icon || "/icons/icon-192x192.png",
    badge: "/icons/badge-72x72.png",
    tag: data.messageId || data.tag || "default",
    data: data.data || {},
    ...notification,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});
