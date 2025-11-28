# デプロイ手順

このドキュメントでは、Vercel（フロントエンド）と Railway（バックエンド）へのデプロイ手順を説明します。

## 前提条件

- Vercel アカウント: netrunners.business@gmail.com
- Railway アカウント: netrunners.business@gmail.com
- GitHub リポジトリへのアクセス

## 1. Railway（バックエンド）のデプロイ

### 1.1 Railway プロジェクトの作成

1. [Railway](https://railway.app)にログイン
2. "New Project"をクリック
3. "Deploy from GitHub repo"を選択
4. リポジトリを選択
5. ルートディレクトリを`server`に設定

### 1.2 データベースの設定

1. Railway ダッシュボードで"New" → "Database" → "MySQL"を選択
2. データベースが作成されたら、接続情報をコピー

### 1.3 環境変数の設定

Railway ダッシュボードの"Variables"タブで以下の環境変数を設定：

```env
# データベース接続
MYSQL_HOST=<Railway MySQL Host>
MYSQL_PORT=3306
MYSQL_USER=<Railway MySQL User>
MYSQL_PASSWORD=<Railway MySQL Password>
MYSQL_DATABASE=railway

# サーバー設定
PORT=8080
GIN_MODE=release

# CORS設定（VercelのURLを設定）
CORS_ALLOWED_ORIGINS=https://<your-vercel-app>.vercel.app

# Google OAuth設定
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
GOOGLE_REDIRECT_URL=https://<your-railway-app>.railway.app/api/v1/auth/google/callback

# Firebase設定（オプション）
FIREBASE_SERVICE_ACCOUNT_KEY=<your-firebase-service-account-json>
```

### 1.4 デプロイ

1. Railway が自動的にデプロイを開始します
2. デプロイが完了したら、生成された URL をコピー（例: `https://your-app.railway.app`）

### 1.5 データベースの初期化

Railway のターミナルまたはローカルから：

```bash
# Railway CLIを使用する場合
railway run --service <service-name> go run cmd/seed/main.go -force
```

または、Railway ダッシュボードの"Deployments"タブから"Run Command"を使用：

```bash
go run cmd/seed/main.go -force
```

## 2. Vercel（フロントエンド）のデプロイ

### 2.1 Vercel プロジェクトの作成

1. [Vercel](https://vercel.com)にログイン
2. "Add New..." → "Project"をクリック
3. GitHub リポジトリを選択
4. プロジェクト設定：
   - **Framework Preset**: Vite
   - **Root Directory**: `app`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### 2.2 環境変数の設定

Vercel ダッシュボードの"Settings" → "Environment Variables"で以下を設定：

```env
# API Base URL（RailwayのURL）
VITE_API_BASE_URL=https://<your-railway-app>.railway.app/api/v1

# Google OAuth Client ID
VITE_GOOGLE_CLIENT_ID=<your-google-client-id>
```

### 2.3 デプロイ

1. "Deploy"をクリック
2. デプロイが完了したら、生成された URL をコピー（例: `https://your-app.vercel.app`）

### 2.4 Railway の CORS 設定を更新

Vercel の URL が確定したら、Railway の環境変数を更新：

```env
CORS_ALLOWED_ORIGINS=https://your-app.vercel.app
```

Railway を再デプロイして設定を反映させます。

## 3. Google OAuth 設定

### 3.1 Google Cloud Console での設定

1. [Google Cloud Console](https://console.cloud.google.com)にアクセス
2. プロジェクトを選択または作成
3. "APIs & Services" → "Credentials"に移動
4. OAuth 2.0 Client ID を作成または編集
5. 承認済みのリダイレクト URI に以下を追加：
   - 開発環境: `http://localhost:8080/api/v1/auth/google/callback`
   - 本番環境: `https://<your-railway-app>.railway.app/api/v1/auth/google/callback`
6. 承認済みの JavaScript 生成元に以下を追加：
   - 開発環境: `http://localhost:5173`
   - 本番環境: `https://<your-vercel-app>.vercel.app`

### 3.2 環境変数の設定

作成した Client ID と Client Secret を Railway と Vercel の環境変数に設定します。

## 4. 動作確認

1. Vercel の URL にアクセス
2. ログインページが表示されることを確認
3. 新規登録またはログインを試す
4. 各機能が正常に動作することを確認

## 5. トラブルシューティング

### 5.1 CORS エラー

- Railway の`CORS_ALLOWED_ORIGINS`に Vercel の URL が正しく設定されているか確認
- プロトコル（`https://`）を含めることを確認

### 5.2 データベース接続エラー

- Railway の MySQL 接続情報が正しいか確認
- データベースが作成されているか確認

### 5.3 API 接続エラー

- Vercel の`VITE_API_BASE_URL`が正しいか確認
- Railway のサービスが起動しているか確認

### 5.4 Google OAuth エラー

- Google Cloud Console のリダイレクト URI が正しいか確認
- Client ID と Client Secret が正しく設定されているか確認

## 6. 継続的デプロイ

GitHub にプッシュすると、自動的にデプロイが実行されます：

- **Vercel**: `app`ディレクトリの変更を検知して自動デプロイ
- **Railway**: `server`ディレクトリの変更を検知して自動デプロイ

## 7. カスタムドメインの設定（オプション）

### 7.1 Vercel

1. Vercel ダッシュボードの"Settings" → "Domains"
2. ドメインを追加
3. DNS 設定を更新

### 7.2 Railway

1. Railway ダッシュボードの"Settings" → "Networking"
2. "Generate Domain"をクリック
3. カスタムドメインを設定（有料プランが必要な場合あり）
