# Railway デプロイ設定

## プロジェクト設定

Railwayダッシュボードで以下の設定を行ってください：

### サービス設定

1. "New Project"をクリック
2. "Deploy from GitHub repo"を選択
3. リポジトリを選択
4. ルートディレクトリを`server`に設定

### データベース設定

1. "New" → "Database" → "MySQL"を選択
2. データベースが作成されたら、接続情報をコピー

### 環境変数

以下の環境変数を設定してください：

```env
# データベース接続（Railway MySQLの接続情報を使用）
MYSQL_HOST=${{MySQL.MYSQLHOST}}
MYSQL_PORT=${{MySQL.MYSQLPORT}}
MYSQL_USER=${{MySQL.MYSQLUSER}}
MYSQL_PASSWORD=${{MySQL.MYSQLPASSWORD}}
MYSQL_DATABASE=${{MySQL.MYSQLDATABASE}}

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

### データベースの初期化

デプロイ後、RailwayのターミナルまたはCLIから以下を実行：

```bash
go run cmd/seed/main.go -force
```

または、Railwayダッシュボードの"Deployments"タブから"Run Command"を使用：

```bash
go run cmd/seed/main.go -force
```

## 注意事項

- Railway MySQLの接続情報は`${{MySQL.XXX}}`形式で参照できます
- CORS設定はVercelのURLが確定してから設定してください
- Google OAuthのリダイレクトURIはRailwayのURLに設定してください

