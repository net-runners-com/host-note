# GitHub アップロードコマンド

このファイルには、GitHubにアップロードするためのコマンドを記載しています。

## 初回セットアップ

### 1. GitHubリポジトリを作成

1. [GitHub](https://github.com)にログイン
2. 右上の"+" → "New repository"
3. リポジトリ名を入力（例: `hostnote`）
4. "Create repository"をクリック

### 2. ローカルでGitを初期化（まだの場合）

```bash
cd /workspace
git init
```

### 3. リモートリポジトリを追加

```bash
# HTTPSを使用する場合
git remote add origin https://github.com/<your-username>/<repository-name>.git

# または、SSHを使用する場合
git remote add origin git@github.com:<your-username>/<repository-name>.git
```

### 4. すべてのファイルを追加

```bash
git add .
```

### 5. 初回コミット

```bash
git commit -m "Initial commit: HostNote application with Vercel and Railway deployment setup"
```

### 6. メインブランチにプッシュ

```bash
git branch -M main
git push -u origin main
```

## 既存のリポジトリに接続する場合

```bash
cd /workspace

# リモートリポジトリを確認
git remote -v

# リモートが設定されていない場合
git remote add origin https://github.com/<your-username>/<repository-name>.git

# 既存のリモートを変更する場合
git remote set-url origin https://github.com/<your-username>/<repository-name>.git
```

## 通常の更新フロー

```bash
# 変更を確認
git status

# 変更をステージング
git add .

# コミット
git commit -m "Your commit message"

# プッシュ
git push
```

## 注意事項

### コミット前に確認すること

- `.env`ファイルがコミットされていないか確認
- 機密情報（APIキー、パスワードなど）が含まれていないか確認
- `node_modules`や`dist`が除外されているか確認

### 環境変数の管理

`.env`ファイルはGitHubにアップロードされません。以下の環境変数はVercelとRailwayのダッシュボードで設定してください：

**Vercel:**
- `VITE_API_BASE_URL`
- `VITE_GOOGLE_CLIENT_ID`

**Railway:**
- `MYSQL_HOST`
- `MYSQL_PORT`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `MYSQL_DATABASE`
- `PORT`
- `GIN_MODE`
- `CORS_ALLOWED_ORIGINS`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URL`
- `FIREBASE_SERVICE_ACCOUNT_KEY`（オプション）

## トラブルシューティング

### プッシュが拒否される場合

```bash
# リモートの変更を取得
git pull origin main --allow-unrelated-histories

# コンフリクトが発生した場合は解決してから
git add .
git commit -m "Merge remote changes"
git push
```

### 大きなファイルが含まれている場合

```bash
# .gitignoreを確認
cat .gitignore

# 大きなファイルを削除（履歴からも削除）
git rm --cached <large-file>
git commit -m "Remove large file"
git push
```

### 機密情報を誤ってコミットした場合

1. すぐにGitHubから削除（履歴に残るため、機密情報を変更）
2. 漏洩した認証情報を無効化
3. 新しい認証情報を生成
4. `.gitignore`を確認して再発防止

