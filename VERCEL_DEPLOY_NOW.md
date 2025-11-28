# Vercel デプロイ手順（今すぐデプロイ）

## 前提条件

- ✅ GitHubリポジトリ: `https://github.com/net-runners-com/host-note`
- ✅ Vercelアカウント: netrunners.business@gmail.com

## ステップ1: Vercelでプロジェクトを作成

1. [Vercel](https://vercel.com)にログイン
2. ダッシュボードで"Add New..." → "Project"をクリック
3. "Import Git Repository"を選択
4. GitHubアカウントを接続（まだの場合）
5. `net-runners-com/host-note`リポジトリを選択

## ステップ2: プロジェクト設定

以下の設定を適用：

### 基本設定

- **Framework Preset**: `Vite`
- **Root Directory**: `app`（重要！）
- **Build Command**: `npm run build`（自動検出されるはず）
- **Output Directory**: `dist`（自動検出されるはず）
- **Install Command**: `npm install`（自動検出されるはず）

### 環境変数

**重要**: RailwayのURLが確定するまで、一時的にローカルURLを設定できます。

**Settings** → **Environment Variables**で以下を追加：

```env
# API Base URL（RailwayのURL - 後で更新）
VITE_API_BASE_URL=https://your-railway-app.railway.app/api/v1

# Google OAuth Client ID
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

**注意**: RailwayのURLがまだ確定していない場合：
- 一時的に `http://localhost:8080/api/v1` を設定
- Railwayのデプロイ後に更新

## ステップ3: デプロイ

1. "Deploy"をクリック
2. デプロイが完了するまで待つ（通常1-2分）
3. デプロイが完了したら、生成されたURLをコピー（例: `https://host-note-xxx.vercel.app`）

## ステップ4: デプロイ後の確認

1. デプロイされたURLにアクセス
2. アプリケーションが表示されることを確認
3. エラーがないか確認（ブラウザのコンソールを確認）

## ステップ5: RailwayのURLを設定（Railwayデプロイ後）

Railwayのデプロイが完了したら：

1. Vercelダッシュボードの**Settings** → **Environment Variables**
2. `VITE_API_BASE_URL`を更新：
   ```
   https://your-railway-app.railway.app/api/v1
   ```
3. **Redeploy**をクリックして再デプロイ

## トラブルシューティング

### ビルドエラーが出る場合

- **Root Directory**が`app`に設定されているか確認
- **Build Command**が`npm run build`になっているか確認
- Vercelのビルドログを確認

### API接続エラーが出る場合

- `VITE_API_BASE_URL`が正しく設定されているか確認
- Railwayのサービスが起動しているか確認
- CORS設定を確認（Railwayの`CORS_ALLOWED_ORIGINS`にVercelのURLを追加）

### 環境変数が反映されない場合

- 環境変数を設定した後、**Redeploy**が必要
- 環境変数の名前が正しいか確認（`VITE_`プレフィックスが必要）

## カスタムドメインの設定（オプション）

1. Vercelダッシュボードの**Settings** → **Domains**
2. ドメインを追加
3. DNS設定を更新

## 継続的デプロイ

GitHubにプッシュすると、自動的にデプロイが実行されます：

- `app`ディレクトリの変更を検知
- 自動的にビルドとデプロイを実行

## 次のステップ

Vercelのデプロイが完了したら：

1. Railwayのデプロイを実行
2. RailwayのURLをVercelの環境変数に設定
3. RailwayのCORS設定にVercelのURLを追加
4. 動作確認

