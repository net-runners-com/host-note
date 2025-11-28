# 本番環境でのメニュー表示問題のデバッグ手順

## 問題
本番環境（Vercel）でメニューが表示されない

## 確認手順

### 1. ブラウザの開発者ツールで確認

1. 本番環境のサイトを開く
2. F12で開発者ツールを開く
3. **Console**タブを確認
   - `[MenuStore] Loaded menus: X` というログが表示されるか
   - `[MenuStore] Failed to load menus:` というエラーログが表示されるか
   - `[CastDetail] menusByCategory:` というログが表示されるか
4. **Network**タブを確認
   - `/api/v1/menu` へのリクエストが成功しているか（200 OK）
   - リクエストが失敗している場合、エラーメッセージを確認

### 2. Railwayのデータベースを確認

Railwayのデータベースにメニューデータが入っているか確認：

```bash
# Railway CLIを使用する場合
railway run mysql -u $MYSQL_USER -p$MYSQL_PASSWORD -h $MYSQL_HOST -P $MYSQL_PORT $MYSQL_DATABASE -e "SELECT COUNT(*) FROM menu;"
```

または、Railwayのダッシュボードからデータベースに接続して確認。

### 3. Railwayのシーダーが実行されているか確認

Railwayのデプロイログを確認：
- `✅ Master data seeding completed` というメッセージが表示されているか
- `• Created X menu items` というメッセージが表示されているか

### 4. 環境変数の確認

Vercelの環境変数：
- `VITE_API_BASE_URL` が正しく設定されているか
- RailwayのバックエンドURLと一致しているか

Railwayの環境変数：
- `FRONTEND_URL` が正しく設定されているか
- `CORS_ALLOWED_ORIGINS` にVercelのURLが含まれているか

## よくある原因と解決方法

### 原因1: データベースにメニューデータが入っていない

**解決方法:**
Railwayでシーダーを手動実行：

```bash
railway run go run cmd/seed/main.go -master-only
```

または、Railwayのデプロイログでシーダーが実行されているか確認。

### 原因2: APIリクエストが失敗している（CORSエラー）

**解決方法:**
Railwayの環境変数 `CORS_ALLOWED_ORIGINS` にVercelのURLを追加：
```
https://host-note-xi.vercel.app,https://*.vercel.app
```

### 原因3: APIのベースURLが間違っている

**解決方法:**
Vercelの環境変数 `VITE_API_BASE_URL` を確認：
```
https://your-railway-app.railway.app/api/v1
```

### 原因4: 認証トークンがない

**解決方法:**
メニューAPIは認証不要のはずですが、念のため確認。ブラウザの開発者ツールのNetworkタブで、リクエストヘッダーを確認。

## デバッグログの確認

追加したデバッグログで以下を確認：

1. **Consoleログ:**
   - `[MenuStore] Loaded menus: X` - メニューが読み込まれた
   - `[MenuStore] Failed to load menus:` - メニューの読み込みに失敗
   - `[CastDetail] menusByCategory:` - カテゴリ別メニューの状態
   - `[CastDetail] drinkMenus:` - 飲み物メニューの数

2. **UI表示:**
   - 「メニューの読み込みエラー: ...」というエラーメッセージが表示される
   - 「メニューを読み込み中...」というメッセージが表示される

## 次のステップ

1. ブラウザの開発者ツールでエラーログを確認
2. エラーメッセージに基づいて対応
3. 必要に応じてRailwayでシーダーを手動実行

