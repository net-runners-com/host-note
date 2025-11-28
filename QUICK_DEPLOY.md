# クイックデプロイガイド

このガイドでは、最短でVercelとRailwayにデプロイする手順を説明します。

## 前提条件

- ✅ Vercelアカウント: netrunners.business@gmail.com
- ✅ Railwayアカウント: netrunners.business@gmail.com
- ✅ GitHubリポジトリへのアクセス

## ステップ1: Railway（バックエンド）のデプロイ

### 1.1 プロジェクト作成

1. [Railway](https://railway.app)にログイン
2. "New Project" → "Deploy from GitHub repo"
3. リポジトリを選択
4. **ルートディレクトリ**: `server` に設定

### 1.2 データベース作成

1. "New" → "Database" → "MySQL"を選択
2. データベースが作成されるまで待つ

### 1.3 環境変数設定

Railwayダッシュボードの"Variables"タブで以下を設定：

```env
# データベース（Railway MySQLの接続情報を使用）
MYSQL_HOST=${{MySQL.MYSQLHOST}}
MYSQL_PORT=${{MySQL.MYSQLPORT}}
MYSQL_USER=${{MySQL.MYSQLUSER}}
MYSQL_PASSWORD=${{MySQL.MYSQLPASSWORD}}
MYSQL_DATABASE=${{MySQL.MYSQLDATABASE}}

# サーバー設定
PORT=8080
GIN_MODE=release

# CORS（後でVercelのURLに更新）
CORS_ALLOWED_ORIGINS=https://your-app.vercel.app

# Google OAuth（後で設定）
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URL=https://your-app.railway.app/api/v1/auth/google/callback
```

### 1.4 デプロイ確認

1. Railwayが自動的にデプロイを開始
2. デプロイが完了したら、生成されたURLをコピー（例: `https://xxx.railway.app`）
3. このURLをメモしておく（後でVercelの設定で使用）

### 1.5 データベース初期化

Railwayダッシュボードの"Deployments"タブ → "Run Command"で実行：

```bash
go run cmd/seed/main.go -force
```

## ステップ2: Vercel（フロントエンド）のデプロイ

### 2.1 プロジェクト作成

1. [Vercel](https://vercel.com)にログイン
2. "Add New..." → "Project"
3. GitHubリポジトリを選択
4. プロジェクト設定：
   - **Framework Preset**: Vite
   - **Root Directory**: `app`
   - **Build Command**: `npm run build`（自動検出されるはず）
   - **Output Directory**: `dist`（自動検出されるはず）

### 2.2 環境変数設定

Vercelダッシュボードの"Settings" → "Environment Variables"で設定：

```env
VITE_API_BASE_URL=https://xxx.railway.app/api/v1
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

（`xxx.railway.app`はステップ1.4でメモしたRailwayのURL）

### 2.3 デプロイ

1. "Deploy"をクリック
2. デプロイが完了したら、生成されたURLをコピー（例: `https://xxx.vercel.app`）
3. このURLをメモしておく

## ステップ3: CORS設定の更新

### 3.1 RailwayのCORS設定を更新

VercelのURLが確定したら、Railwayの環境変数を更新：

```env
CORS_ALLOWED_ORIGINS=https://xxx.vercel.app
```

（`xxx.vercel.app`はステップ2.3でメモしたVercelのURL）

### 3.2 Railwayを再デプロイ

環境変数を更新したら、Railwayが自動的に再デプロイします。

## ステップ4: Google OAuth設定（オプション）

### 4.1 Google Cloud Console

1. [Google Cloud Console](https://console.cloud.google.com)にアクセス
2. プロジェクトを選択または作成
3. "APIs & Services" → "Credentials"
4. OAuth 2.0 Client IDを作成または編集
5. 承認済みのリダイレクトURIに追加：
   - `https://xxx.railway.app/api/v1/auth/google/callback`
6. 承認済みのJavaScript生成元に追加：
   - `https://xxx.vercel.app`

### 4.2 環境変数を更新

作成したClient IDとClient Secretを以下に設定：
- Railway: `GOOGLE_CLIENT_ID`、`GOOGLE_CLIENT_SECRET`
- Vercel: `VITE_GOOGLE_CLIENT_ID`

## ステップ5: 動作確認

1. VercelのURLにアクセス
2. ログインページが表示されることを確認
3. 新規登録またはログインを試す
4. 各機能が正常に動作することを確認

## トラブルシューティング

### CORSエラーが出る場合

- Railwayの`CORS_ALLOWED_ORIGINS`にVercelのURLが正しく設定されているか確認
- プロトコル（`https://`）を含めることを確認
- Railwayを再デプロイ

### API接続エラーが出る場合

- Vercelの`VITE_API_BASE_URL`が正しいか確認
- Railwayのサービスが起動しているか確認
- Railwayのログを確認

### データベースエラーが出る場合

- RailwayのMySQL接続情報が正しいか確認
- データベースが作成されているか確認
- データベースの初期化（`go run cmd/seed/main.go -force`）を実行

## 次のステップ

- カスタムドメインの設定（オプション）
- 継続的デプロイの確認（GitHubにプッシュすると自動デプロイ）
- モニタリングとログの確認

詳細は`DEPLOY.md`を参照してください。

