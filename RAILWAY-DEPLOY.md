# Railway デプロイ手順（詳細版）

## Railwayの料金

- **初回登録**: 30日間有効な$5の無料クレジット
- **毎月**: $1のクレジットが自動付与
- **小規模アプリ**: ほぼ無料で運用可能

## デプロイ手順

### 1. Railwayにアカウント作成

1. [Railway](https://railway.app)にアクセス
2. 「Start a New Project」をクリック
3. GitHubアカウントでログイン

### 2. プロジェクト作成

1. 「New Project」をクリック
2. 「Deploy from GitHub repo」を選択
3. リポジトリを選択
4. 「Deploy Now」をクリック

### 3. MySQLデータベースを追加

1. プロジェクト内で「+ New」をクリック
2. 「Database」を選択
3. 「Add MySQL」をクリック
4. 数秒でMySQLが起動します

**確認**: MySQLサービスの「Variables」タブで、以下の環境変数が自動生成されていることを確認：
- `MYSQLHOST`
- `MYSQLPORT`
- `MYSQLUSER`
- `MYSQLPASSWORD`
- `MYSQLDATABASE`

### 4. Go APIサービスを追加

1. プロジェクト内で「+ New」をクリック
2. 「GitHub Repo」を選択
3. 同じリポジトリを選択
4. サービスが追加されたら、設定を開く

#### 設定変更

1. 「Settings」タブを開く
2. 「Root Directory」を `server` に設定
3. 「Start Command」は空のまま（`go run main.go`が自動実行される）

### 5. 環境変数を設定（重要）

Goサービスの「Variables」タブで、以下の環境変数を追加：

#### MySQL接続情報（Railwayの変数参照）

```
MYSQL_HOST = ${{MySQL.MYSQLHOST}}
MYSQL_PORT = ${{MySQL.MYSQLPORT}}
MYSQL_USER = ${{MySQL.MYSQLUSER}}
MYSQL_PASSWORD = ${{MySQL.MYSQLPASSWORD}}
MYSQL_DATABASE = ${{MySQL.MYSQLDATABASE}}
```

**注意**: 
- `${{MySQL.変数名}}` の形式で、MySQLサービスの環境変数を参照します
- `MySQL` はMySQLサービスの名前です（デフォルトは「MySQL」）

#### その他の環境変数

```
PORT = ${{PORT}}
GIN_MODE = release
```

**注意**: `${{PORT}}` はRailwayが自動的に設定するポート番号です。

### 6. デプロイ確認

1. 環境変数を設定すると、自動的に再デプロイが開始されます
2. 「Deployments」タブでデプロイ状況を確認
3. デプロイが完了したら、ログを確認してエラーがないかチェック

### 7. 公開URLの取得

1. Goサービスの「Settings」タブを開く
2. 「Generate Domain」をクリック
3. 生成されたURLをコピー（例: `https://your-api.railway.app`）

### 8. ヘルスチェック

ブラウザまたはcurlで以下にアクセス：

```
https://your-api.railway.app/health
```

以下のようなJSONが返ってくれば成功：

```json
{
  "status": "ok",
  "service": "host-note-api"
}
```

### 9. フロントエンドの環境変数を設定

Vercelのダッシュボードで、フロントエンドの環境変数を設定：

1. Vercelのプロジェクト設定を開く
2. 「Environment Variables」を開く
3. 以下を追加：
   - `VITE_API_URL` = `https://your-api.railway.app`

4. 再デプロイを実行

## トラブルシューティング

### デプロイが失敗する

1. 「Deployments」タブでログを確認
2. エラーメッセージを確認
3. よくある原因：
   - 環境変数が正しく設定されていない
   - Root Directoryが正しく設定されていない
   - Goの依存関係が不足している

### データベース接続エラー

1. MySQLサービスの「Variables」タブで環境変数を確認
2. Goサービスの環境変数で、`${{MySQL.変数名}}` の形式が正しいか確認
3. MySQLサービスが起動しているか確認

### CORSエラー

Railwayの環境変数で、フロントエンドのURLを許可リストに追加：

Goサービスの「Variables」タブで以下を追加：

```
CORS_ALLOWED_ORIGINS = https://your-frontend.vercel.app
```

複数のURLを許可する場合は、カンマ区切りで指定：

```
CORS_ALLOWED_ORIGINS = https://your-frontend.vercel.app,https://another-domain.com
```

## 料金の確認

1. Railwayのダッシュボードで「Usage」を確認
2. 現在の使用量と残りのクレジットを確認
3. 小規模アプリなら、$1/月で十分運用できます

