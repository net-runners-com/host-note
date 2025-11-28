# Vercel 設定ガイド（画面別）

## 1. Build and Output Settings（ビルドと出力設定）

### Build Command（ビルドコマンド）

- **値**: `npm run build`
- **トグル**: **ON**にする（カスタムコマンドを使用する場合）

### Output Directory（出力ディレクトリ）

- **値**: `dist`
- **トグル**: **ON**にする（カスタムディレクトリを使用する場合）

### Install Command（インストールコマンド）

- **値**: `npm install`
- **トグル**: **OFF**のまま（デフォルトで問題なし）

## 2. Environment Variables（環境変数）

以下の環境変数を追加してください：

### 必須の環境変数

1. **VITE_API_BASE_URL**

   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `http://localhost:8080/api/v1`（一時的。Railway デプロイ後に更新）
   - **説明**: バックエンド API のベース URL

2. **VITE_GOOGLE_CLIENT_ID**（Google OAuth を使用する場合）

   - **Key**: `VITE_GOOGLE_CLIENT_ID`
   - **Value**: あなたの Google OAuth Client ID
   - **説明**: Google OAuth 認証用の Client ID

3. **VITE_VAPID_PUBLIC_KEY**（Web Push 通知を使用する場合）
   - **Key**: `VITE_VAPID_PUBLIC_KEY`
   - **Value**: `BLpDkPx1q6c84N9Q9tJfsPXUheXxY6VWcGjbg5sX68ramSYZlU96nTby4dIY1NxDqAgSScbH_3ZK2nZpe9-lzvc`
   - **説明**: Firebase Cloud Messaging (FCM) の Web Push 通知用 VAPID 公開鍵
   - **注意**: プッシュ通知機能を使用しない場合は省略可能

### 環境変数の追加方法

1. "Add More"ボタンをクリック
2. Key と Value を入力
3. 必要に応じて追加

### 注意事項

- 環境変数名は必ず `VITE_` で始める必要があります
- Vite は `VITE_` で始まる環境変数のみをクライアント側で使用可能にします
- 機密情報（シークレット）は環境変数として設定し、コードに直接書かないでください

## 3. Root Directory（ルートディレクトリ）

**重要**: プロジェクト設定の最初の画面で以下を設定：

- **Root Directory**: `app`

これは、Vercel がリポジトリのどのディレクトリをプロジェクトのルートとして扱うかを指定します。

## 4. Framework Preset（フレームワークプリセット）

- **Framework Preset**: `Vite` を選択

## 設定の確認チェックリスト

- [ ] Root Directory: `app` に設定
- [ ] Framework Preset: `Vite` に設定
- [ ] Build Command: `npm run build`（トグル ON）
- [ ] Output Directory: `dist`（トグル ON）
- [ ] Install Command: デフォルト（トグル OFF）
- [ ] 環境変数 `VITE_API_BASE_URL` を追加
- [ ] 環境変数 `VITE_GOOGLE_CLIENT_ID` を追加（必要な場合）

## デプロイ後の更新

Railway のデプロイが完了したら：

1. Vercel ダッシュボードの **Settings** → **Environment Variables** に移動
2. `VITE_API_BASE_URL` の値を更新：
   ```
   https://your-railway-app.railway.app/api/v1
   ```
3. **Redeploy** をクリックして再デプロイ

## トラブルシューティング

### ビルドエラーが出る場合

- Root Directory が `app` に設定されているか確認
- Build Command が `npm run build` になっているか確認
- Output Directory が `dist` になっているか確認

### 環境変数が反映されない場合

- 環境変数名が `VITE_` で始まっているか確認
- 環境変数を設定した後、**Redeploy**が必要
- ビルドログで環境変数が読み込まれているか確認
