# Host Note

ホストクラブ向けの姫・キャスト管理アプリケーション

## プロジェクト構成

```
host-note/
├── app/              # フロントエンド（React + TypeScript + Vite）
├── server/           # バックエンド（Go + Gin + GORM + MySQL）
├── doc/              # ドキュメント
└── .devcontainer/    # VS Code Dev Container設定（Docker）
```

## 環境構成

### 開発環境
- **構成**: Docker（VS Code Dev Container）
- **詳細**: [README-DEV.md](./README-DEV.md)

### ステージング環境
- **フロントエンド**: Vercel（プレビューデプロイ）
- **バックエンド**: Railway（別プロジェクト）
- **詳細**: [STAGING.md](./STAGING.md)

### 本番環境
- **フロントエンド**: Vercel
- **バックエンド**: Railway
- **詳細**: [DEPLOY.md](./DEPLOY.md)

## クイックスタート

### 開発環境の起動（Docker推奨）

1. VS Codeでプロジェクトを開く
2. 「Reopen in Container」を選択
3. 自動的に環境がセットアップされます

詳細は [README-DEV.md](./README-DEV.md) を参照してください。

## 機能

- 姫管理（登録、編集、削除、検索）
- キャスト管理
- 卓記録管理
- 来店履歴管理
- カレンダー表示
- AI分析機能
- データエクスポート（JSON/CSV/TSV）

## 技術スタック

### フロントエンド
- React 19
- TypeScript
- Vite
- Tailwind CSS
- Dexie (IndexedDB)
- Zustand (状態管理)

### バックエンド
- Go 1.22+
- Gin (Webフレームワーク)
- GORM (ORM)
- MySQL 8.0

## ドキュメント

- [開発環境セットアップ](./README-DEV.md) - Docker環境のセットアップ
- [ステージング環境](./STAGING.md) - Vercel + Railwayでのステージング環境
- [本番環境デプロイ](./DEPLOY.md) - 本番環境へのデプロイ手順
- [Railwayデプロイ詳細](./RAILWAY-DEPLOY.md) - Railwayの詳細なデプロイ手順

## ライセンス

ISC
