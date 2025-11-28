# Railway 環境変数設定ガイド

## Vercel の URL

- **デプロイ URL**: `host-note-xi.vercel.app`
- **完全な URL**: `https://host-note-xi.vercel.app`

## Railway 環境変数の設定

Railway ダッシュボードの **Variables** タブで以下の環境変数を設定してください。

### 1. データベース接続（Railway MySQL の接続情報を使用）

```env
MYSQL_HOST=${{MySQL.MYSQLHOST}}
MYSQL_PORT=${{MySQL.MYSQLPORT}}
MYSQL_USER=${{MySQL.MYSQLUSER}}
MYSQL_PASSWORD=${{MySQL.MYSQLPASSWORD}}
MYSQL_DATABASE=${{MySQL.MYSQLDATABASE}}
```

**重要**: `${{MySQL.XXX}}` の形式で、Railway が自動的に MySQL の接続情報を設定します。

### 2. サーバー設定

```env
PORT=8080
GIN_MODE=release
```

### 3. CORS 設定（Vercel の URL を設定）

```env
CORS_ALLOWED_ORIGINS=https://host-note-xi.vercel.app,https://*.vercel.app
```

**重要**: 
- Vercel の URL を設定してください。プロトコル（`https://`）を含める必要があります
- カンマ区切りで複数のオリジンを指定可能
- ワイルドカードパターン（`*`）をサポート（例: `https://*.vercel.app` でVercelのすべてのプレビューデプロイメントを許可）

### 4. Google OAuth 設定

```env
GOOGLE_CLIENT_ID=i<)q>XzNpq[^K$|N-q}p$
GOOGLE_CLIENT_SECRET=).aLvF1FtWV9VhK[1_p2h,:?I
GOOGLE_REDIRECT_URL=https://your-railway-app.railway.app/api/v1/auth/google/callback
```

**注意**: `GOOGLE_REDIRECT_URL` は、Railway のデプロイが完了して URL が確定したら更新してください。

### 4-1. フロントエンド URL 設定

```env
FRONTEND_URL=https://host-note-xi.vercel.app
```

**説明**: Google OAuth 認証完了後にフロントエンドにリダイレクトする際に使用されます。

### 5. Firebase 設定（オプション）

```env
FIREBASE_SERVICE_ACCOUNT_KEY=<your-firebase-service-account-json>
```

**重要**:

- Firebase Service Account KeyのJSONを**1行**にする必要があります（改行を`\n`に変換）
- Firebase ConsoleからService Account Keyをダウンロードし、JSONを1行形式に変換してください
- Railway の環境変数設定では、値全体をコピー＆ペーストしてください

### 6. JWT Secret（オプション、既に設定されている場合）

```env
JWT_SECRET=i30_(-ZILG:3J;hN!^?KxpMCMp>o@nQs>).l
```

## 設定手順

### ステップ 1: Railway でプロジェクトを作成

1. [Railway](https://railway.app)にログイン
2. "New Project"をクリック
3. "Deploy from GitHub repo"を選択
4. `net-runners-com/host-note`リポジトリを選択
5. **Root Directory**: `server` に設定

### ステップ 2: MySQL データベースを追加

1. "New" → "Database" → "MySQL"を選択
2. データベースが作成されるまで待つ

### ステップ 3: 環境変数を設定

1. Railway ダッシュボードの **Variables** タブを開く
2. 上記の環境変数を 1 つずつ追加
3. **重要**: `FIREBASE_SERVICE_ACCOUNT_KEY` は、値全体を 1 行でコピー＆ペースト

### ステップ 4: デプロイ確認

1. Railway が自動的にデプロイを開始
2. デプロイが完了したら、生成された URL をコピー（例: `https://xxx.railway.app`）

### ステップ 5: GOOGLE_REDIRECT_URL を更新

Railway の URL が確定したら：

1. Railway ダッシュボードの **Variables** タブ
2. `GOOGLE_REDIRECT_URL` を更新：
   ```
   https://your-railway-app.railway.app/api/v1/auth/google/callback
   ```
3. Railway が自動的に再デプロイ

### ステップ 6: データベースの初期化

Railway ダッシュボードの **Deployments** タブ → **Run Command** で実行：

```bash
go run cmd/seed/main.go -force
```

### ステップ 7: Vercel の環境変数を更新

Railway の URL が確定したら、Vercel の環境変数を更新：

1. Vercel ダッシュボードの **Settings** → **Environment Variables**
2. `VITE_API_BASE_URL` を更新：
   ```
   https://your-railway-app.railway.app/api/v1
   ```
3. **Redeploy** をクリック

## 環境変数の一覧（コピー用）

Railway の環境変数設定画面で、以下の形式で設定してください：

| Key                            | Value                                                                          |
| ------------------------------ | ------------------------------------------------------------------------------ | ------- |
| `MYSQL_HOST`                   | `${{MySQL.MYSQLHOST}}`                                                         |
| `MYSQL_PORT`                   | `${{MySQL.MYSQLPORT}}`                                                         |
| `MYSQL_USER`                   | `${{MySQL.MYSQLUSER}}`                                                         |
| `MYSQL_PASSWORD`               | `${{MySQL.MYSQLPASSWORD}}`                                                     |
| `MYSQL_DATABASE`               | `${{MySQL.MYSQLDATABASE}}`                                                     |
| `PORT`                         | `8080`                                                                         |
| `GIN_MODE`                     | `release`                                                                      |
| `CORS_ALLOWED_ORIGINS`         | `https://host-note-xi.vercel.app`                                              |
| `GOOGLE_CLIENT_ID`             | `i<)q>XzNpq[^K$                                                                | N-q}p$` |
| `GOOGLE_CLIENT_SECRET`         | `).aLvF1FtWV9VhK[1_p2h,:?I`                                                    |
| `GOOGLE_REDIRECT_URL`          | `https://your-railway-app.railway.app/api/v1/auth/google/callback`（後で更新） |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | （上記の JSON 文字列全体）                                                     |
| `JWT_SECRET`                   | `i30_(-ZILG:3J;hN!^?KxpMCMp>o@nQs>).l`                                         |

## 注意事項

1. **FIREBASE_SERVICE_ACCOUNT_KEY**: JSON を 1 行にする必要があります。改行は`\n`に変換してください。
2. **CORS_ALLOWED_ORIGINS**: Vercel の URL（`https://host-note-xi.vercel.app`）を設定してください。
3. **GOOGLE_REDIRECT_URL**: Railway の URL が確定したら更新してください。
4. **MySQL 接続情報**: `${{MySQL.XXX}}` の形式で、Railway が自動的に設定します。

## トラブルシューティング

### データベース接続エラー

- MySQL データベースが作成されているか確認
- 環境変数の `${{MySQL.XXX}}` が正しく設定されているか確認

### CORS エラー

- `CORS_ALLOWED_ORIGINS` に Vercel の URL が正しく設定されているか確認
- プロトコル（`https://`）を含めることを確認

### Firebase 初期化エラー

- `FIREBASE_SERVICE_ACCOUNT_KEY` が 1 行の JSON 文字列になっているか確認
- JSON の構文エラーがないか確認
