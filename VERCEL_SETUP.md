# Vercel デプロイ設定

## プロジェクト設定

Vercelダッシュボードで以下の設定を行ってください：

### 基本設定

- **Framework Preset**: Vite
- **Root Directory**: `app`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 環境変数

以下の環境変数を設定してください：

```
VITE_API_BASE_URL=https://<your-railway-app>.railway.app/api/v1
VITE_GOOGLE_CLIENT_ID=<your-google-client-id>
```

## デプロイ手順

1. Vercelダッシュボードにログイン
2. "Add New..." → "Project"をクリック
3. GitHubリポジトリを選択
4. 上記の設定を適用
5. 環境変数を設定
6. "Deploy"をクリック

## 注意事項

- ルートディレクトリは必ず`app`に設定してください
- 環境変数はデプロイ前に設定してください
- RailwayのURLが確定してから`VITE_API_BASE_URL`を設定してください

