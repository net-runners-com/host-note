# ステージング環境セットアップ

Host Noteのステージング環境は、**フロントエンド（Vercel）**と**バックエンド（Railway）**で構成されます。

## 構成

- **フロントエンド**: Vercel（プレビューデプロイ）
- **バックエンド**: Railway（別プロジェクト）

## 前提条件

- GitHubリポジトリが作成されていること
- Vercelアカウントが作成されていること
- Railwayアカウントが作成されていること

## ステージング環境のデプロイ

### フロントエンド: Vercel（プレビューデプロイ）

Vercelは自動的にブランチごとにプレビューデプロイを作成します。

#### 1. ステージングブランチを作成

```bash
git checkout -b staging
git push origin staging
```

#### 2. Vercelでプロジェクトを作成

1. [Vercel](https://vercel.com)にアクセス
2. 「Add New Project」をクリック
3. GitHubリポジトリを選択
4. プロジェクト設定：
   - **Root Directory**: `app`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. 「Deploy」をクリック

#### 3. 環境変数の設定

1. Vercelのプロジェクト設定を開く
2. 「Settings」>「Environment Variables」を開く
3. 環境変数を追加：
   - **Name**: `VITE_API_URL`
   - **Value**: ステージングバックエンドのURL（後で設定）
   - **Environment**: `Preview` を選択

**注意**: ステージングバックエンドのURLは、Railwayでデプロイ後に設定します。

#### 4. 自動デプロイ

`staging` ブランチにプッシュすると、自動的にプレビューデプロイが作成されます。

プレビューデプロイのURLは、`https://your-app-git-staging-username.vercel.app` の形式です。

### バックエンド: Railway（ステージング環境）

#### 1. Railwayにアカウント作成

1. [Railway](https://railway.app)にアクセス
2. 「Start a New Project」をクリック
3. GitHubアカウントでログイン

#### 2. ステージングプロジェクトを作成

1. 「New Project」をクリック
2. プロジェクト名: `host-note-staging`
3. 「Deploy from GitHub repo」を選択
4. リポジトリを選択
5. 「Deploy Now」をクリック

#### 3. MySQLデータベースを追加

1. プロジェクト内で「+ New」をクリック
2. 「Database」を選択
3. 「Add MySQL」をクリック
4. サービス名: `MySQL-Staging`（自動設定）

**確認**: MySQLサービスの「Variables」タブで、以下の環境変数が自動生成されていることを確認：
- `MYSQLHOST`
- `MYSQLPORT`
- `MYSQLUSER`
- `MYSQLPASSWORD`
- `MYSQLDATABASE`

#### 4. Go APIサービスを追加

1. プロジェクト内で「+ New」をクリック
2. 「GitHub Repo」を選択
3. 同じリポジトリを選択
4. サービスが追加されたら、設定を開く：
   - 「Settings」タブ > 「Root Directory」を `server` に設定
   - 「Settings」タブ > 「Branch」を `staging` に設定（オプション）

#### 5. 環境変数を設定

Goサービスの「Variables」タブで、以下の環境変数を追加：

**MySQL接続情報**:
```
MYSQL_HOST = ${{MySQL-Staging.MYSQLHOST}}
MYSQL_PORT = ${{MySQL-Staging.MYSQLPORT}}
MYSQL_USER = ${{MySQL-Staging.MYSQLUSER}}
MYSQL_PASSWORD = ${{MySQL-Staging.MYSQLPASSWORD}}
MYSQL_DATABASE = ${{MySQL-Staging.MYSQLDATABASE}}
```

**その他の環境変数**:
```
PORT = ${{PORT}}
GIN_MODE = release
CORS_ALLOWED_ORIGINS = https://your-app-git-staging-username.vercel.app
```

**注意**: 
- `${{MySQL-Staging.変数名}}` の形式で、MySQLサービスの環境変数を参照します
- `CORS_ALLOWED_ORIGINS` は、VercelのプレビューデプロイURLに置き換えてください

#### 6. 公開URLを取得

1. Goサービスの「Settings」タブを開く
2. 「Generate Domain」をクリック
3. 生成されたURLをコピー（例: `https://api-staging.railway.app`）

#### 7. フロントエンドの環境変数を更新

Vercelのダッシュボードで、フロントエンドの環境変数を更新：

1. Vercelのプロジェクト設定を開く
2. 「Settings」>「Environment Variables」を開く
3. `VITE_API_URL` を編集：
   - **Value**: Railwayで生成されたAPIのURL（例: `https://api-staging.railway.app`）
   - **Environment**: `Preview` を選択
4. 再デプロイを実行

## デプロイフロー

### ステージング環境へのデプロイ

1. **コードをステージングブランチにプッシュ**
   ```bash
   git checkout staging
   git add .
   git commit -m "feat: new feature"
   git push origin staging
   ```

2. **自動デプロイ**
   - Vercel: 自動的にプレビューデプロイが作成される
   - Railway: 自動的にデプロイが開始される（ブランチ設定している場合）

### 本番環境へのデプロイ

1. **ステージングでテスト**
2. **mainブランチにマージ**
   ```bash
   git checkout main
   git merge staging
   git push origin main
   ```

3. **自動デプロイ**
   - Vercel: 本番環境に自動デプロイ
   - Railway: 本番環境に自動デプロイ（別プロジェクト）

## 確認事項

### ステージング環境

- [ ] フロントエンドがステージングバックエンドに接続できているか
- [ ] CORS設定が正しいか
- [ ] データベースが分離されているか（本番データに影響しないか）
- [ ] 環境変数が正しく設定されているか

## トラブルシューティング

### ステージング環境でCORSエラーが発生する

Railwayのステージング環境の環境変数で、VercelのプレビューデプロイURLを許可：

```
CORS_ALLOWED_ORIGINS = https://your-app-git-staging-username.vercel.app
```

VercelのプレビューデプロイURLは、`https://your-app-git-{branch}-{username}.vercel.app` の形式です。

### 環境変数が反映されない

1. 環境変数を設定した後、再デプロイが必要な場合があります
2. Vercelでは、環境変数を変更した後、手動で再デプロイを実行してください
3. Railwayでは、環境変数を変更すると自動的に再デプロイされます

### データベースが共有されている

ステージング環境では、本番環境とは別のMySQLサービスを使用してください。

## Railwayの料金

- 初回登録: $5の無料クレジット（30日間）
- 毎月: $1のクレジットが自動付与
- 小規模アプリ: ほぼ無料で運用可能

詳細は [RAILWAY-DEPLOY.md](./RAILWAY-DEPLOY.md) を参照してください。
