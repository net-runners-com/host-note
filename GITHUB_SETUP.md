# GitHub リポジトリ設定ガイド

このガイドでは、プロジェクトを GitHub にアップロードして、Vercel と Railway でデプロイできるようにする手順を説明します。

## ステップ 1: GitHub リポジトリの作成

1. [GitHub](https://github.com)にログイン
2. 右上の"+" → "New repository"をクリック
3. リポジトリ情報を入力：
   - **Repository name**: `hostnote`（任意の名前）
   - **Description**: ホストクラブ向け姫・キャスト管理アプリ
   - **Visibility**: Public または Private（お好みで）
   - **Initialize this repository with**: チェックを外す（既存のコードをプッシュするため）
4. "Create repository"をクリック

## ステップ 2: ローカルリポジトリの初期化

ターミナルで以下を実行：

```bash
cd /workspace

# Gitリポジトリを初期化（まだ初期化されていない場合）
git init

# リモートリポジトリを追加
git remote add origin https://github.com/<your-username>/<repository-name>.git

# または、SSHを使用する場合
git remote add origin git@github.com:<your-username>/<repository-name>.git
```

## ステップ 3: ファイルの追加とコミット

```bash
# すべてのファイルをステージング
git add .

# 初回コミット
git commit -m "Initial commit: HostNote application"

# メインブランチにプッシュ
git branch -M main
git push -u origin main
```

## ステップ 4: .gitignore の確認

以下のファイルが`.gitignore`に含まれていることを確認：

- `.env`ファイル（環境変数）
- `node_modules/`
- `dist/`（ビルド成果物）
- `bin/`（Go のビルド成果物）
- その他の一時ファイル

## ステップ 5: 環境変数のテンプレート

`.env`ファイルは GitHub にアップロードしないため、以下のテンプレートファイルを作成することを推奨：

- `server/.env.example`
- `app/.env.example`

これらには実際の値ではなく、必要な環境変数のリストを記載します。

## ステップ 6: Vercel と Railway での接続

### Vercel

1. Vercel ダッシュボードで"Add New..." → "Project"
2. "Import Git Repository"を選択
3. GitHub アカウントを接続（まだの場合）
4. 作成したリポジトリを選択
5. プロジェクト設定を適用

### Railway

1. Railway ダッシュボードで"New Project"
2. "Deploy from GitHub repo"を選択
3. GitHub アカウントを接続（まだの場合）
4. 作成したリポジトリを選択
5. ルートディレクトリを`server`に設定

## 注意事項

### 機密情報の管理

以下のファイルは**絶対に**GitHub にコミットしないでください：

- `server/.env`
- `app/.env`
- `server/firebase-service-account-key.json`（Firebase 認証情報）
- その他の認証情報や秘密鍵

### 環境変数の設定

Vercel と Railway では、環境変数をダッシュボードから設定します：

- **Vercel**: Settings → Environment Variables
- **Railway**: Variables タブ

### 継続的デプロイ

GitHub にプッシュすると、自動的にデプロイが実行されます：

- **Vercel**: `app`ディレクトリの変更を検知
- **Railway**: `server`ディレクトリの変更を検知

## トラブルシューティング

### プッシュが拒否される場合

```bash
# リモートの変更を取得
git pull origin main --allow-unrelated-histories

# 再度プッシュ
git push -u origin main
```

### 大きなファイルが含まれている場合

`.gitignore`を確認し、不要なファイルが除外されているか確認してください。

### 環境変数が漏洩した場合

1. すぐに GitHub から削除（履歴に残るため、機密情報を変更）
2. 漏洩した認証情報を無効化
3. 新しい認証情報を生成
4. `.gitignore`を確認して再発防止
