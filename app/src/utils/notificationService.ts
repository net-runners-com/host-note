import { logError } from './errorHandler';
import { api } from './api';
import { messaging, getToken, onMessage } from '../config/firebase';


class NotificationService {
  private static instance: NotificationService;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // 通知権限リクエスト
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('このブラウザは通知をサポートしていません');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  // FCMトークンを取得
  async getPushSubscription(): Promise<string | null> {
    try {
      if (!messaging) {
        return null;
      }

      // 通知の許可状態を確認
      const permission = this.getPermissionStatus();
      if (permission !== 'granted') {
        // 許可されていない場合はnullを返す（エラーをログに記録しない）
        return null;
      }

      // Service Workerを取得（firebase-messaging-sw.jsを使用）
      let registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        await navigator.serviceWorker.ready;
      }
      
      const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        return null;
      }
      const token = await getToken(messaging, {
        vapidKey: vapidKey,
        serviceWorkerRegistration: registration,
      });

      return token || null;
    } catch (error: any) {
      // 通知の許可がブロックされている場合はエラーをログに記録しない
      if (error?.code === 'messaging/permission-blocked' || error?.code === 'messaging/permission-default') {
        return null;
      }
      logError(error, { component: 'NotificationService', action: 'getPushSubscription' });
      return null;
    }
  }

  // FCMトークンを取得してプッシュ通知を登録
  async subscribeToPush(): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        throw new Error('通知の許可が得られませんでした');
      }

      if (!messaging) {
        throw new Error('Firebase Messagingが初期化されていません');
      }

      // Service Workerを登録（firebase-messaging-sw.jsを使用）
      let registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        // Service Workerがアクティブになるまで待つ
        await navigator.serviceWorker.ready;
      }

      // VAPID公開鍵を取得
      const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        throw new Error('VAPID公開鍵が設定されていません');
      }

      // FCMトークンを取得
      let token: string | null = null;
      try {
        token = await getToken(messaging, {
          vapidKey: vapidKey,
          serviceWorkerRegistration: registration,
        });
      } catch (error: any) {
        // 通知の許可がブロックされている場合のエラーハンドリング
        if (error?.code === 'messaging/permission-blocked') {
          throw new Error('通知の許可がブロックされています。ブラウザの設定から通知を許可してください。');
        }
        if (error?.code === 'messaging/permission-default') {
          throw new Error('通知の許可が必要です。');
        }
        throw error;
      }

      if (!token) {
        throw new Error('FCMトークンの取得に失敗しました');
      }

      // バックエンドにトークンを送信
      await this.sendTokenToServer(token);

      // メッセージ受信時のリスナーを設定
      this.setupMessageListener();

      return token;
    } catch (error) {
      logError(error, { component: 'NotificationService', action: 'subscribeToPush' });
      throw error;
    }
  }

  // プッシュ通知を解除
  async unsubscribeFromPush(): Promise<boolean> {
    try {
      const token = await this.getPushSubscription();
      if (token) {
        // バックエンドからトークンを削除
        await this.removeTokenFromServer(token);
        return true;
      }
      return false;
    } catch (error) {
      logError(error, { component: 'NotificationService', action: 'unsubscribeFromPush' });
      return false;
    }
  }

  // FCMトークンをサーバーに送信
  private async sendTokenToServer(token: string): Promise<void> {
    try {
      await api.push.subscribe({ token });
    } catch (error) {
      logError(error, { component: 'NotificationService', action: 'sendTokenToServer' });
      throw error;
    }
  }

  // FCMトークンをサーバーから削除
  private async removeTokenFromServer(token: string): Promise<void> {
    try {
      await api.push.unsubscribe(token);
    } catch (error) {
      logError(error, { component: 'NotificationService', action: 'removeTokenFromServer' });
    }
  }

  // メッセージ受信時のリスナーを設定
  private setupMessageListener(): void {
    if (!messaging) {
      return;
    }

    // フォアグラウンドでメッセージを受信したとき
    onMessage(messaging, (payload) => {
      const title = payload.notification?.title || '通知';
      const options: NotificationOptions = {
        body: payload.notification?.body || '',
        icon: payload.notification?.icon || '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        tag: payload.messageId || 'default',
        data: payload.data || {},
      };

      // 通知を表示
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification(title, options);
        });
      } else {
        new Notification(title, options);
      }
    });
  }

  // 即座に通知を表示
  async showNotification(title: string, options?: NotificationOptions): Promise<void> {
    try {
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        throw new Error('通知の許可が得られませんでした');
      }

      if ('serviceWorker' in navigator) {
        // Service Worker経由で通知
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, {
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
          ...options,
        });
      } else {
        // 直接通知（フォールバック）
        new Notification(title, {
          icon: '/icons/icon-192x192.png',
          ...options,
        });
      }
    } catch (error) {
      logError(error, { component: 'NotificationService', action: 'showNotification' });
      throw error;
    }
  }

  // 通知権限の状態を取得
  getPermissionStatus(): NotificationPermission {
    if (!('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }

  // プッシュ通知がサポートされているか確認
  isPushSupported(): boolean {
    return 'serviceWorker' in navigator && messaging !== null;
  }
}

export const notificationService = NotificationService.getInstance();

