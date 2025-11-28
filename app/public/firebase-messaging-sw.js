// Firebase Messaging Service Worker
// FCMのプッシュ通知を受信するためのService Worker

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// Firebase設定
const firebaseConfig = {
  apiKey: "AIzaSyCR_OLFTogohGMN0fWocGh3V9K1uBgtKPI",
  authDomain: "test-98925.firebaseapp.com",
  projectId: "test-98925",
  storageBucket: "test-98925.firebasestorage.app",
  messagingSenderId: "868930427893",
  appId: "1:868930427893:web:6c7cb3896288f8d3bd1ebc",
  measurementId: "G-QQZ55JP963"
};

// Firebase初期化
firebase.initializeApp(firebaseConfig);

// Messagingインスタンスを取得
const messaging = firebase.messaging();

// バックグラウンドメッセージのハンドラー
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || '通知';
  const notificationOptions = {
    body: payload.notification?.body || '新しい通知があります',
    icon: payload.notification?.icon || '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: payload.messageId || 'default',
    data: payload.data || {},
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// プッシュ通知を受信したときの処理（フォールバック）
self.addEventListener('push', (event) => {
  console.log('[firebase-messaging-sw.js] Push event received');
  
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: '通知', body: event.data.text() };
    }
  }

  // FCMのペイロード形式に対応
  const notification = data.notification || {};
  const title = notification.title || data.title || '通知';
  const options = {
    body: notification.body || data.body || '新しい通知があります',
    icon: notification.icon || '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: data.messageId || data.tag || 'default',
    data: data.data || {},
    ...notification,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// 通知クリック時の処理
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received');
  
  event.notification.close();
  
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        if (clientList.length > 0) {
          return clientList[0].focus();
        }
        return clients.openWindow('/');
      })
  );
});

