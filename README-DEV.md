# 開発環境セットアップ

Host Noteの開発環境は**Docker（VS Code Dev Container）**を使用します。

## プロジェクト構造

```
host-note/
├── app/              # フロントエンド（React + TypeScript + Vite）
├── server/           # バックエンド（Go + Gin + GORM + MySQL）
└── .devcontainer/    # VS Code Dev Container設定
    ├── devcontainer.json
    ├── docker-compose.yml
    ├── Dockerfile
    └── post-create.sh
```

## 前提条件

- [Docker Desktop](https://www.docker.com/products/docker-desktop) がインストールされていること
- [VS Code](https://code.visualstudio.com/) がインストールされていること
- [Dev Containers拡張機能](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) がインストールされていること

## 開発環境の起動

### 方法1: VS Code Dev Container（推奨）

1. **VS Codeでプロジェクトを開く**
   ```bash
   code .
   ```

2. **Dev Containerで開く**
   - `F1` キーを押す
   - 「Dev Containers: Reopen in Container」を選択
   - または、通知バーから「Reopen in Container」をクリック

3. **自動セットアップ**
   - Dockerイメージのビルドが開始されます（初回のみ時間がかかります）
   - コンテナが起動すると、自動的に依存関係がインストールされます
   - 完了まで数分かかる場合があります

4. **開発開始**
   - コンテナ内でターミナルを開く
   - フロントエンドとバックエンドを起動

### 方法2: 手動セットアップ（Docker不使用）

Dockerを使用しない場合は、以下の手順でセットアップしてください。

#### フロントエンド

```bash
cd app
npm install
npm run dev
```

フロントエンドは `http://localhost:5173` で起動します。

#### バックエンド

```bash
cd server
go mod download
go run main.go
```

バックエンドAPIは `http://localhost:8080` で起動します。

#### データベース

```bash
docker-compose -f .devcontainer/docker-compose.yml up -d db
```

## 開発環境の構成

### コンテナ構成

- **app**: 開発コンテナ（Go + Node.js）
- **db**: MySQL 8.0

### ポート

- **5173**: フロントエンド（Vite）
- **8080**: バックエンドAPI（Go）
- **3306**: MySQL

### データベース接続情報

- **Host**: `db` (コンテナ内) / `localhost` (ホストマシン)
- **Port**: `3306`
- **Database**: `hostnote`
- **User**: `hostnote`
- **Password**: `hostnote_dev`
- **Root Password**: `root_password`

## 開発フロー

### フロントエンドの開発

```bash
# コンテナ内で実行
cd app
npm run dev
```

### バックエンドの開発

```bash
# コンテナ内で実行
cd server
go run main.go
```

または、ホットリロード（Go 1.25+が必要）:

```bash
cd server
air
```

### データベースの操作

```bash
# MySQLに接続
mysql -h db -u hostnote -phostnote_dev hostnote
```

## 環境変数

### フロントエンド

`app/.env` ファイルを作成（必要に応じて）:

```env
VITE_API_URL=http://localhost:8080
```

### バックエンド

`server/.env` ファイルを作成（必要に応じて）:

```env
MYSQL_HOST=db
MYSQL_PORT=3306
MYSQL_USER=hostnote
MYSQL_PASSWORD=hostnote_dev
MYSQL_DATABASE=hostnote
PORT=8080
GIN_MODE=debug
```

Dev Container内では、`docker-compose.yml`で設定された環境変数が自動的に使用されます。

## トラブルシューティング

### コンテナが起動しない

1. Docker Desktopが起動しているか確認
2. ポートが使用されていないか確認（5173, 8080, 3306）
3. `.devcontainer` ディレクトリの設定を確認

### 依存関係のインストールが失敗する

```bash
# コンテナ内で手動実行
cd app && npm install
cd ../server && go mod download
```

### データベースに接続できない

1. MySQLコンテナが起動しているか確認
   ```bash
   docker-compose -f .devcontainer/docker-compose.yml ps
   ```

2. ヘルスチェックを確認
   ```bash
   docker-compose -f .devcontainer/docker-compose.yml logs db
   ```

### ポートが既に使用されている

`docker-compose.yml` のポート番号を変更するか、使用中のプロセスを終了してください。

## その他の情報

### ORMについて

現在は**GORM**を使用しています。

- **GORM**: 最も人気のあるGoのORM、機能が豊富
- **Ent**: Facebook製、型安全で強力だが学習コストが高い
- **sqlx**: 軽量、ORMではないが使いやすい

GORMのドキュメント: https://gorm.io/docs/
