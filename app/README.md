# Host Note Frontend

Host Note のフロントエンドアプリケーション

## 技術スタック

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Dexie (IndexedDB)
- Zustand (状態管理)
- React Router

## セットアップ

```bash
npm install
npm run dev
```

## ビルド

```bash
npm run build
```

## プロジェクト構造

```
app/
├── src/
│   ├── components/    # コンポーネント
│   ├── pages/         # ページ
│   ├── database/      # データベース層
│   ├── stores/        # 状態管理
│   ├── types/         # 型定義
│   └── utils/         # ユーティリティ
├── public/            # 静的ファイル
└── package.json
```

