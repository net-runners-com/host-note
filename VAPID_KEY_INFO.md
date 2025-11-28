# VAPID_PUBLIC_KEY について

## 概要

`VAPID_PUBLIC_KEY`（正確には `VITE_VAPID_PUBLIC_KEY`）は、**Web Push通知**（Firebase Cloud Messaging）で使用されるVAPID公開鍵です。

## 用途

- ブラウザのプッシュ通知を有効にするために使用
- Firebase Cloud Messaging (FCM) でWeb Push通知を送信する際の認証に使用
- フロントエンド（`app/src/utils/notificationService.ts`）で使用

## Vercelでの設定

### 環境変数として設定

Vercelの環境変数設定で以下を追加：

- **Key**: `VITE_VAPID_PUBLIC_KEY`
- **Value**: `BLpDkPx1q6c84N9Q9tJfsPXUheXxY6VWcGjbg5sX68ramSYZlU96nTby4dIY1NxDqAgSScbH_3ZK2nZpe9-lzvc`

### 設定が必須かどうか

- **プッシュ通知機能を使用する場合**: 必須
- **プッシュ通知機能を使用しない場合**: 省略可能（エラーにはなりません）

## 現在の値

プロジェクトで使用されているVAPID公開鍵：

```
BLpDkPx1q6c84N9Q9tJfsPXUheXxY6VWcGjbg5sX68ramSYZlU96nTby4dIY1NxDqAgSScbH_3ZK2nZpe9-lzvc
```

この値は `ENV_EXAMPLE.md` と `FIREBASE_SETUP.md` に記載されています。

## 使用箇所

- `app/src/utils/notificationService.ts` - プッシュ通知の登録時に使用
- Firebase Cloud Messagingの初期化時に使用

## 注意事項

- この値は**公開鍵**なので、GitHubにコミットしても問題ありません
- ただし、VAPID秘密鍵は機密情報なので、絶対に公開しないでください
- VAPID秘密鍵はバックエンド（Railway）の環境変数 `FIREBASE_SERVICE_ACCOUNT_KEY` に含まれています

## 新しいVAPIDキーを生成する場合

Firebase Consoleで新しいVAPIDキーを生成できます：

1. [Firebase Console](https://console.firebase.google.com/)にアクセス
2. プロジェクトを選択
3. プロジェクト設定 → Cloud Messaging
4. Web Push証明書 → キーペアを生成

