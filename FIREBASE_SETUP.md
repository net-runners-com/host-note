# Firebase Cloud Messaging (FCM) セットアップガイド

## 環境変数の設定

### フロントエンド (`app/.env`)

```env
VITE_VAPID_PUBLIC_KEY=BLpDkPx1q6c84N9Q9tJfsPXUheXxY6VWcGjbg5sX68ramSYZlU96nTby4dIY1NxDqAgSScbH_3ZK2nZpe9-lzvc
```

### バックエンド (`server/.env`)

以下のいずれかの方法で設定できます：

#### 方法1: 環境変数として設定

```env
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"test-98925",...}
```

※ JSONを1行に変換して設定してください。

#### 方法2: ファイルパスを指定

```env
FIREBASE_SERVICE_ACCOUNT_KEY_PATH=./test-98925-firebase-adminsdk-24qyg-21dc8f7a53.json
```

または、ファイルを `server/` ディレクトリに配置すると自動的に読み込まれます。

## 動作確認

### 1. フロントエンド

1. アプリを起動
2. 設定ページに移動
3. 「通知設定」セクションで「通知の許可をリクエスト」をクリック
4. 「プッシュ通知を有効にする」をクリック
5. トークンがバックエンドに登録される

### 2. バックエンド

1. サーバーを起動
2. FCMが正常に初期化されると、ログに `✅ FCM initialized successfully` が表示されます
3. テスト通知を送信するには、`POST /api/v1/push/test` エンドポイントを呼び出します

## API エンドポイント

### プッシュ通知トークンの登録

```
POST /api/v1/push/subscribe
Authorization: Bearer <token>
Content-Type: application/json

{
  "token": "FCMトークン"
}
```

### プッシュ通知トークンの削除

```
DELETE /api/v1/push/unsubscribe?token=<FCMトークン>
Authorization: Bearer <token>
```

### テスト通知の送信

```
POST /api/v1/push/test
Authorization: Bearer <token>
```

## トラブルシューティング

### VAPID公開鍵が設定されていない

- `.env` ファイルに `VITE_VAPID_PUBLIC_KEY` が設定されているか確認
- 開発サーバーを再起動

### Firebase Admin SDKの初期化に失敗する

- `FIREBASE_SERVICE_ACCOUNT_KEY` 環境変数が正しく設定されているか確認
- または、`test-98925-firebase-adminsdk-24qyg-21dc8f7a53.json` ファイルが `server/` ディレクトリに存在するか確認
- JSONの形式が正しいか確認（改行や空白が含まれていても自動的に正規化されます）

### プッシュ通知が届かない

- ブラウザの通知許可が有効になっているか確認
- Service Workerが正しく登録されているか確認
- FCMトークンが正しく取得できているか確認（ブラウザのコンソールで確認）

