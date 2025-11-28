# 環境変数の設定

## フロントエンド (`app/.env`)

```env
# APIサーバーのURL
VITE_API_URL=http://localhost:8080

# Firebase Cloud Messaging用のVAPID公開鍵
VITE_VAPID_PUBLIC_KEY=BLpDkPx1q6c84N9Q9tJfsPXUheXxY6VWcGjbg5sX68ramSYZlU96nTby4dIY1NxDqAgSScbH_3ZK2nZpe9-lzvc
```

## バックエンド (`server/.env`)

```env
# MySQL接続情報
MYSQL_HOST=db
MYSQL_PORT=3306
MYSQL_USER=hostnote
MYSQL_PASSWORD=hostnote_dev
MYSQL_DATABASE=hostnote

# サーバー設定
PORT=8080
GIN_MODE=debug

# Firebase Cloud Messaging用のサービスアカウントキー
# 方法1: 環境変数として設定（JSONを1行に変換）
# FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"test-98925",...}

# 方法2: ファイルパスを指定（推奨）
FIREBASE_SERVICE_ACCOUNT_KEY_PATH=./test-98925-firebase-adminsdk-24qyg-21dc8f7a53.json
```

## 開発環境（Docker使用時）

Dev Containerを使用している場合、`docker-compose.yml`で環境変数が自動設定されるため、`.env`ファイルは**オプション**です。

ただし、Firebase関連の環境変数は必要に応じて設定してください。

## 本番環境（Railway）

Railwayでは、環境変数をRailwayのダッシュボードで設定します。

### フロントエンド（Vercel）

Vercelの環境変数設定で以下を追加：
- `VITE_API_URL`: RailwayのAPI URL
- `VITE_VAPID_PUBLIC_KEY`: VAPID公開鍵

### バックエンド（Railway）

Railwayの環境変数設定で以下を追加：

```
MYSQL_HOST = ${{MySQL.MYSQLHOST}}
MYSQL_PORT = ${{MySQL.MYSQLPORT}}
MYSQL_USER = ${{MySQL.MYSQLUSER}}
MYSQL_PASSWORD = ${{MySQL.MYSQLPASSWORD}}
MYSQL_DATABASE = ${{MySQL.MYSQLDATABASE}}
PORT = ${{PORT}}
GIN_MODE = release
FIREBASE_SERVICE_ACCOUNT_KEY = <JSON文字列>
```

## 注意事項

- `.env`ファイルは`.gitignore`に含まれているため、Gitにコミットされません
- 本番環境の機密情報は、必ず環境変数として設定してください
- Firebaseサービスアカウントキーは機密情報のため、絶対にGitにコミットしないでください

