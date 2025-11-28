# Host Note Server

Host Note のバックエンドAPIサーバー

## 技術スタック

- **言語**: Go 1.22+
- **フレームワーク**: Gin
- **ORM**: GORM
- **データベース**: MySQL 8.0

## セットアップ

### 前提条件

- Go 1.22以上
- MySQL 8.0
- Docker & Docker Compose (推奨)

### 開発環境のセットアップ

1. `.env`ファイルを作成（`.env.example`をコピー）
```bash
cp .env.example .env
```

2. 依存関係のインストール
```bash
go mod download
go mod tidy
```

3. サーバーの起動
```bash
go run main.go
```

### サンプルデータを投入

開発用にデモユーザーや姫・キャスト、卓記録などのデータをまとめて作成できます。

```bash
# 既存データを残したまま不足しているデモデータを作成
go run ./cmd/seed

# ⚠️ 既存データをリセットしてから投入したい場合
go run ./cmd/seed --force
```

`demo / password123` でログインできるユーザーが作成されます。

または、Airを使用したホットリロード（Go 1.25+が必要）:
```bash
air
```

## デプロイ

### Railway（推奨）

1. [Railway](https://railway.app)にアカウント作成
2. プロジェクトを作成
3. MySQLサービスを追加
4. Goサービスを追加（Root Directory: `server`）
5. 環境変数を設定（Railwayが自動生成したMySQL接続情報を使用）

### Render

1. [Render](https://render.com)にアカウント作成
2. Webサービスを作成（Root Directory: `server`）
3. 環境変数を設定

### Fly.io

1. [Fly.io](https://fly.io)にアカウント作成
2. `fly.toml`を作成してデプロイ

## プロジェクト構造

```
server/
├── main.go                 # エントリーポイント
├── internal/
│   ├── config/            # 設定管理
│   ├── database/          # データベース接続・マイグレーション
│   ├── handlers/          # HTTPハンドラー
│   ├── middleware/        # ミドルウェア
│   ├── models/            # データモデル
│   └── services/          # ビジネスロジック
└── go.mod
```

## API エンドポイント

### ヘルスチェック
- `GET /health` - サーバーの状態確認

### AI分析
- `POST /api/v1/ai/analyze` - AI分析を実行

## ORMについて

GORMを使用しています。他の選択肢としては：

- **GORM** (現在使用中): 最も人気のあるGoのORM、機能が豊富
- **Ent**: Facebook製、型安全で強力だが学習コストが高い
- **sqlx**: 軽量、ORMではないが使いやすい

GORMのドキュメント: https://gorm.io/docs/




