# HostNote Web版 設計書

## 1. 技術スタック選定

### 1.1 コアフレームワーク
- **React 18.x**
  - 理由: 豊富なエコシステム、開発速度、PWA対応可能
  - Vite使用（高速ビルド）

### 1.2 言語
- **TypeScript 5.x**
  - 型安全性によるバグ削減
  - IDE補完による開発効率向上
  - 保守性の向上

### 1.3 主要ライブラリ
- **React Router v6**: ルーティング
- **Dexie.js**: IndexedDB操作（ローカルDB）
- **Zustand**: 状態管理（軽量）
- **React Calendar / React Big Calendar**: カレンダーUI
- **DiceBear**: アバター自動生成
- **date-fns**: 日付操作
- **React Hook Form**: フォーム管理
- **Zod**: バリデーション
- **TanStack Query (React Query)**: データフェッチング・キャッシング
- **Tailwind CSS**: スタイリング
- **Shadcn/ui**: UIコンポーネント

### 1.4 PWA対応
- **Workbox**: Service Worker管理
- **Web Push API**: プッシュ通知
- **Notification API**: ブラウザ通知
- **IndexedDB**: オフラインデータ

### 1.5 開発ツール
- **Vite**: ビルドツール
- **ESLint + Prettier**: コード品質管理
- **TypeScript strict mode**: 型チェック強化
- **Vitest**: ユニットテスト

---

## 2. システム構成

### 2.1 アーキテクチャパターン
- **MVVM (Model-View-ViewModel)**
  - Model: データベース層（IndexedDB / Dexie）
  - View: Reactコンポーネント
  - ViewModel: 状態管理（Zustand Store）

### 2.2 ディレクトリ構成
```
hostnote-web/
├── public/
│   ├── manifest.json              # PWA manifest
│   ├── service-worker.js          # Service Worker
│   ├── icons/                     # アプリアイコン
│   └── favicon.ico
├── src/
│   ├── App.tsx                    # アプリケーションルート
│   ├── main.tsx                   # エントリーポイント
│   ├── vite-env.d.ts
│   │
│   ├── components/                # 再利用可能コンポーネント
│   │   ├── common/                # 共通コンポーネント
│   │   │   ├── Avatar.tsx         # アバター表示
│   │   │   ├── Button.tsx         # カスタムボタン
│   │   │   ├── Card.tsx           # カード型UI
│   │   │   ├── SearchBar.tsx      # 検索バー
│   │   │   ├── EmptyState.tsx     # 空状態表示
│   │   │   ├── Loading.tsx        # ローディング
│   │   │   └── Modal.tsx          # モーダル
│   │   ├── layout/                # レイアウトコンポーネント
│   │   │   ├── Header.tsx         # ヘッダー
│   │   │   ├── Sidebar.tsx        # サイドバー
│   │   │   ├── BottomNav.tsx      # ボトムナビ（モバイル）
│   │   │   └── Layout.tsx         # 共通レイアウト
│   │   ├── hime/                  # 姫専用コンポーネント
│   │   │   ├── HimeCard.tsx       # 姫カード
│   │   │   ├── HimeForm.tsx       # 姫入力フォーム
│   │   │   └── HimeDetail.tsx     # 姫詳細表示
│   │   ├── cast/                  # キャスト専用コンポーネント
│   │   │   ├── CastCard.tsx       # キャストカード
│   │   │   ├── CastForm.tsx       # キャスト入力フォーム
│   │   │   └── CastDetail.tsx     # キャスト詳細表示
│   │   ├── table/                 # 卓記録専用コンポーネント
│   │   │   ├── TableCard.tsx      # 卓カード
│   │   │   ├── TableForm.tsx      # 卓入力フォーム
│   │   │   └── TableDetail.tsx    # 卓詳細表示
│   │   └── calendar/              # カレンダー専用コンポーネント
│   │       ├── CalendarView.tsx   # カレンダー表示
│   │       └── EventMarker.tsx    # イベントマーカー
│   │
│   ├── pages/                     # ページコンポーネント
│   │   ├── Home/
│   │   │   └── index.tsx          # ホーム画面
│   │   ├── Hime/
│   │   │   ├── List.tsx           # 姫一覧
│   │   │   ├── Detail.tsx         # 姫詳細
│   │   │   ├── Add.tsx            # 姫追加
│   │   │   └── Edit.tsx           # 姫編集
│   │   ├── Cast/
│   │   │   ├── List.tsx           # キャスト一覧
│   │   │   ├── Detail.tsx         # キャスト詳細
│   │   │   ├── Add.tsx            # キャスト追加
│   │   │   └── Edit.tsx           # キャスト編集
│   │   ├── Table/
│   │   │   ├── List.tsx           # 卓記録一覧
│   │   │   ├── Detail.tsx         # 卓詳細
│   │   │   ├── Add.tsx            # 卓記録追加
│   │   │   └── Edit.tsx           # 卓記録編集
│   │   ├── Calendar/
│   │   │   └── index.tsx          # カレンダー画面
│   │   └── Settings/
│   │       └── index.tsx          # 設定画面
│   │
│   ├── database/                  # データベース層
│   │   ├── db.ts                  # Dexie初期化
│   │   ├── schema.ts              # スキーマ定義
│   │   ├── migrations.ts          # マイグレーション
│   │   └── repositories/          # リポジトリパターン
│   │       ├── HimeRepository.ts
│   │       ├── CastRepository.ts
│   │       ├── TableRepository.ts
│   │       └── ScheduleRepository.ts
│   │
│   ├── stores/                    # 状態管理（Zustand）
│   │   ├── himeStore.ts           # 姫の状態管理
│   │   ├── castStore.ts           # キャストの状態管理
│   │   ├── tableStore.ts          # 卓記録の状態管理
│   │   ├── scheduleStore.ts       # スケジュールの状態管理
│   │   └── settingsStore.ts       # 設定の状態管理
│   │
│   ├── hooks/                     # カスタムフック
│   │   ├── useDatabase.ts         # データベース操作
│   │   ├── useNotification.ts     # 通知管理
│   │   ├── useTheme.ts            # テーマ切り替え
│   │   ├── useMediaQuery.ts       # レスポンシブ対応
│   │   └── usePWA.ts              # PWA機能
│   │
│   ├── services/                  # サービス層
│   │   ├── NotificationService.ts # 通知サービス
│   │   ├── AvatarService.ts       # アバター生成
│   │   ├── StorageService.ts      # ストレージ管理
│   │   └── ExportService.ts       # データエクスポート
│   │
│   ├── types/                     # TypeScript型定義
│   │   ├── hime.ts
│   │   ├── cast.ts
│   │   ├── table.ts
│   │   ├── schedule.ts
│   │   └── common.ts
│   │
│   ├── utils/                     # ユーティリティ関数
│   │   ├── date.ts                # 日付操作
│   │   ├── validation.ts          # バリデーション
│   │   └── format.ts              # フォーマット
│   │
│   ├── constants/                 # 定数定義
│   │   ├── colors.ts              # カラーパレット
│   │   ├── themes.ts              # テーマ設定
│   │   └── config.ts              # アプリ設定
│   │
│   └── styles/                    # グローバルスタイル
│       ├── globals.css            # グローバルCSS
│       └── themes.css             # テーマCSS
│
├── vite.config.ts                 # Vite設定
├── tsconfig.json                  # TypeScript設定
├── tailwind.config.js             # Tailwind設定
├── postcss.config.js              # PostCSS設定
├── .eslintrc.js                   # ESLint設定
├── .prettierrc                    # Prettier設定
└── package.json                   # 依存関係
```

---

## 3. データモデル設計

### 3.1 IndexedDB スキーマ（Dexie.js）

#### 3.1.1 Dexie定義
```typescript
import Dexie, { Table } from 'dexie';

export class HostNoteDatabase extends Dexie {
  hime!: Table<Hime, number>;
  cast!: Table<Cast, number>;
  tableRecord!: Table<TableRecord, number>;
  tableHime!: Table<TableHime, number>;
  tableCast!: Table<TableCast, number>;
  schedule!: Table<Schedule, number>;
  settings!: Table<Setting, string>;

  constructor() {
    super('HostNoteDB');
    
    this.version(1).stores({
      hime: '++id, name, birthday, tantoCastId, createdAt',
      cast: '++id, name, birthday, createdAt',
      tableRecord: '++id, datetime, createdAt',
      tableHime: '++id, tableId, himeId, [tableId+himeId]',
      tableCast: '++id, tableId, castId, role',
      schedule: '++id, himeId, scheduledDatetime, notificationSent',
      settings: 'key'
    });
  }
}

export const db = new HostNoteDatabase();
```

### 3.2 TypeScript型定義

#### types/hime.ts
```typescript
export interface Hime {
  id?: number;
  name: string;
  photoUrl: string | null;  // Base64 or Blob URL
  snsInfo: SnsInfo | null;
  birthday: string | null;  // ISO 8601 date
  isFirstVisit: boolean;
  tantoCastId: number | null;
  drinkPreference: string | null;
  mixerPreference: string | null;
  memo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SnsInfo {
  twitter?: string;
  instagram?: string;
  line?: string;
}

export interface HimeWithCast extends Hime {
  tantoCast: Cast | null;
}

export interface HimeFormData {
  name: string;
  photo?: File | null;
  snsInfo?: SnsInfo;
  birthday?: string;
  isFirstVisit: boolean;
  tantoCastId?: number;
  drinkPreference?: string;
  mixerPreference?: string;
  memo?: string;
}
```

#### types/cast.ts
```typescript
export interface Cast {
  id?: number;
  name: string;
  photoUrl: string | null;
  snsInfo: SnsInfo | null;
  birthday: string | null;
  memo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CastFormData {
  name: string;
  photo?: File | null;
  snsInfo?: SnsInfo;
  birthday?: string;
  memo?: string;
}
```

#### types/table.ts
```typescript
export interface TableRecord {
  id?: number;
  datetime: string;  // ISO 8601
  tableNumber: string | null;
  memo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TableRecordWithDetails extends TableRecord {
  himeList: Hime[];
  mainCast: Cast | null;
  helpCasts: Cast[];
}

export interface TableHime {
  id?: number;
  tableId: number;
  himeId: number;
}

export interface TableCast {
  id?: number;
  tableId: number;
  castId: number;
  role: 'main' | 'help';
}

export interface TableFormData {
  datetime: string;
  tableNumber?: string;
  himeIds: number[];
  mainCastId: number;
  helpCastIds: number[];
  memo?: string;
}
```

#### types/schedule.ts
```typescript
export interface Schedule {
  id?: number;
  himeId: number;
  scheduledDatetime: string;  // ISO 8601
  memo: string | null;
  notificationSent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleWithHime extends Schedule {
  hime: Hime;
}

export interface ScheduleFormData {
  himeId: number;
  scheduledDatetime: string;
  memo?: string;
}
```

---

## 4. UI設計

### 4.1 レスポンシブデザイン

#### ブレークポイント
```typescript
export const breakpoints = {
  mobile: '640px',   // スマートフォン
  tablet: '768px',   // タブレット
  desktop: '1024px', // デスクトップ
  wide: '1280px',    // ワイドスクリーン
} as const;
```

#### Tailwind設定
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    screens: {
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
  },
};
```

### 4.2 カラーテーマ定義

#### 4.2.1 Lokat オリジナルテーマ
```typescript
export const lokatOriginalTheme = {
  primary: '#D4AF37',      // ゴールド
  secondary: '#1A1A1A',    // ブラック
  background: '#0D0D0D',   // ダークブラック
  surface: '#1F1F1F',      // カードサーフェス
  text: '#FFFFFF',         // ホワイト
  textSecondary: '#B8B8B8', // グレー
  border: '#333333',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  accent: '#FFD700',       // ブライトゴールド
};
```

#### 4.2.2 CSS Variables
```css
/* src/styles/themes.css */
:root[data-theme="lokat-original"] {
  --color-primary: #D4AF37;
  --color-secondary: #1A1A1A;
  --color-background: #0D0D0D;
  --color-surface: #1F1F1F;
  --color-text: #FFFFFF;
  --color-text-secondary: #B8B8B8;
  --color-border: #333333;
  --color-success: #4CAF50;
  --color-warning: #FF9800;
  --color-error: #F44336;
  --color-accent: #FFD700;
}

:root[data-theme="dark"] {
  --color-primary: #BB86FC;
  --color-secondary: #03DAC6;
  --color-background: #121212;
  --color-surface: #1E1E1E;
  --color-text: #FFFFFF;
  --color-text-secondary: #B0B0B0;
  --color-border: #2C2C2C;
  --color-success: #4CAF50;
  --color-warning: #FF9800;
  --color-error: #CF6679;
  --color-accent: #03DAC6;
}

:root[data-theme="light"] {
  --color-primary: #6200EE;
  --color-secondary: #03DAC6;
  --color-background: #FFFFFF;
  --color-surface: #F5F5F5;
  --color-text: #000000;
  --color-text-secondary: #666666;
  --color-border: #E0E0E0;
  --color-success: #4CAF50;
  --color-warning: #FF9800;
  --color-error: #B00020;
  --color-accent: #018786;
}
```

### 4.3 レイアウト構成

#### デスクトップレイアウト
```
┌─────────────────────────────────────────┐
│  [Logo]  ホーム 姫 キャスト 卓 📅  ⚙️ │ ← Header
├──────┬──────────────────────────────────┤
│      │                                  │
│ 🏠   │   メインコンテンツエリア          │
│ 👸   │                                  │
│ 🎭   │                                  │
│ 📋   │                                  │
│ 📅   │                                  │
│      │                                  │
│ Sidebar                                 │
└──────┴──────────────────────────────────┘
```

#### モバイルレイアウト
```
┌─────────────────────────────────┐
│  [Logo]              ⚙️ ☰      │ ← Header
├─────────────────────────────────┤
│                                  │
│   メインコンテンツエリア          │
│                                  │
│                                  │
│                                  │
├─────────────────────────────────┤
│  🏠   👸   🎭   📋   📅        │ ← BottomNav
└─────────────────────────────────┘
```

### 4.4 主要画面設計

#### 4.4.1 ホーム画面
```typescript
// pages/Home/index.tsx
export default function HomePage() {
  return (
    <div className="space-y-6">
      {/* 今日の来店予定 */}
      <Section title="今日の来店予定">
        <ScheduleList schedules={todaySchedules} />
      </Section>

      {/* 直近の卓記録 */}
      <Section title="直近の卓記録">
        <TableList tables={recentTables} limit={5} />
      </Section>

      {/* 今月の誕生日 */}
      <Section title="今月の誕生日">
        <BirthdayList birthdays={thisMonthBirthdays} />
      </Section>
    </div>
  );
}
```

#### 4.4.2 姫一覧画面
```typescript
// pages/Hime/List.tsx
export default function HimeListPage() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <SearchBar 
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="姫を検索..."
        />
        <Button onClick={handleAdd}>
          + 姫を追加
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {himeList.map((hime) => (
          <HimeCard key={hime.id} hime={hime} />
        ))}
      </div>
    </div>
  );
}
```

#### 4.4.3 姫詳細画面
```typescript
// pages/Hime/Detail.tsx
export default function HimeDetailPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <Button variant="ghost" onClick={goBack}>
          ← 戻る
        </Button>
        <div className="flex gap-2">
          <Button onClick={handleEdit}>編集</Button>
          <Button variant="danger" onClick={handleDelete}>削除</Button>
        </div>
      </div>

      {/* プロフィール */}
      <Card>
        <div className="flex items-start gap-6">
          <Avatar src={hime.photoUrl} name={hime.name} size="xl" />
          <div className="flex-1 space-y-4">
            <h1 className="text-3xl font-bold">{hime.name}</h1>
            <InfoGrid>
              <InfoItem label="誕生日" value={formatDate(hime.birthday)} />
              <InfoItem label="SNS" value={hime.snsInfo?.twitter} />
              <InfoItem label="初回" value={hime.isFirstVisit ? 'はい' : 'いいえ'} />
              <InfoItem label="担当" value={hime.tantoCast?.name} />
            </InfoGrid>
          </div>
        </div>
      </Card>

      {/* 好みの情報 */}
      <Card title="お酒の好み">
        <PreferenceSection
          drink={hime.drinkPreference}
          mixer={hime.mixerPreference}
        />
      </Card>

      {/* メモ */}
      <Card title="メモ">
        <p className="whitespace-pre-wrap">{hime.memo}</p>
      </Card>

      {/* 来店履歴 */}
      <Card title="来店履歴">
        <VisitHistory himeId={hime.id} />
      </Card>
    </div>
  );
}
```

---

## 5. コア処理設計

### 5.1 データベースリポジトリ

#### HimeRepository
```typescript
import { db } from '../database/db';
import { Hime, HimeWithCast } from '../types/hime';

export class HimeRepository {
  // CRUD操作
  async create(hime: Omit<Hime, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const now = new Date().toISOString();
    return await db.hime.add({
      ...hime,
      createdAt: now,
      updatedAt: now,
    });
  }

  async findById(id: number): Promise<HimeWithCast | null> {
    const hime = await db.hime.get(id);
    if (!hime) return null;

    const tantoCast = hime.tantoCastId
      ? await db.cast.get(hime.tantoCastId)
      : null;

    return { ...hime, tantoCast };
  }

  async findAll(): Promise<Hime[]> {
    return await db.hime.toArray();
  }

  async update(id: number, data: Partial<Hime>): Promise<void> {
    await db.hime.update(id, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  }

  async delete(id: number): Promise<void> {
    await db.hime.delete(id);
  }

  // 検索
  async search(query: string): Promise<Hime[]> {
    const lowerQuery = query.toLowerCase();
    return await db.hime
      .filter((hime) => hime.name.toLowerCase().includes(lowerQuery))
      .toArray();
  }

  // 誕生日関連
  async findBirthdayThisMonth(): Promise<Hime[]> {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;

    return await db.hime
      .filter((hime) => {
        if (!hime.birthday) return false;
        const birthMonth = new Date(hime.birthday).getMonth() + 1;
        return birthMonth === currentMonth;
      })
      .toArray();
  }

  // 統計
  async getVisitCount(himeId: number): Promise<number> {
    return await db.tableHime
      .where('himeId')
      .equals(himeId)
      .count();
  }

  async getLastVisitDate(himeId: number): Promise<string | null> {
    const lastTable = await db.tableHime
      .where('himeId')
      .equals(himeId)
      .last();

    if (!lastTable) return null;

    const table = await db.tableRecord.get(lastTable.tableId);
    return table?.datetime || null;
  }
}

export const himeRepository = new HimeRepository();
```

#### TableRepository
```typescript
import { db } from '../database/db';
import { TableRecord, TableRecordWithDetails, TableFormData } from '../types/table';

export class TableRepository {
  async create(data: TableFormData): Promise<number> {
    const now = new Date().toISOString();
    
    // トランザクション処理
    return await db.transaction('rw', [db.tableRecord, db.tableHime, db.tableCast], async () => {
      // 卓記録を作成
      const tableId = await db.tableRecord.add({
        datetime: data.datetime,
        tableNumber: data.tableNumber || null,
        memo: data.memo || null,
        createdAt: now,
        updatedAt: now,
      });

      // 姫のリレーション作成
      for (const himeId of data.himeIds) {
        await db.tableHime.add({ tableId, himeId });
      }

      // メインキャストのリレーション作成
      await db.tableCast.add({
        tableId,
        castId: data.mainCastId,
        role: 'main',
      });

      // ヘルプキャストのリレーション作成
      for (const castId of data.helpCastIds) {
        await db.tableCast.add({
          tableId,
          castId,
          role: 'help',
        });
      }

      return tableId;
    });
  }

  async findById(id: number): Promise<TableRecordWithDetails | null> {
    const table = await db.tableRecord.get(id);
    if (!table) return null;

    // 姫リストを取得
    const tableHimeList = await db.tableHime
      .where('tableId')
      .equals(id)
      .toArray();
    const himeList = await Promise.all(
      tableHimeList.map((th) => db.hime.get(th.himeId))
    ).then((list) => list.filter((h) => h !== undefined) as Hime[]);

    // キャストを取得
    const tableCastList = await db.tableCast
      .where('tableId')
      .equals(id)
      .toArray();

    const mainCastEntry = tableCastList.find((tc) => tc.role === 'main');
    const mainCast = mainCastEntry
      ? await db.cast.get(mainCastEntry.castId)
      : null;

    const helpCastEntries = tableCastList.filter((tc) => tc.role === 'help');
    const helpCasts = await Promise.all(
      helpCastEntries.map((tc) => db.cast.get(tc.castId))
    ).then((list) => list.filter((c) => c !== undefined) as Cast[]);

    return {
      ...table,
      himeList,
      mainCast: mainCast || null,
      helpCasts,
    };
  }

  async findAll(limit?: number): Promise<TableRecordWithDetails[]> {
    const tables = await db.tableRecord
      .orderBy('datetime')
      .reverse()
      .limit(limit || 1000)
      .toArray();

    return await Promise.all(
      tables.map((table) => this.findById(table.id!))
    ).then((list) => list.filter((t) => t !== null) as TableRecordWithDetails[]);
  }

  async findByDate(date: string): Promise<TableRecordWithDetails[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const tables = await db.tableRecord
      .where('datetime')
      .between(startOfDay.toISOString(), endOfDay.toISOString())
      .toArray();

    return await Promise.all(
      tables.map((table) => this.findById(table.id!))
    ).then((list) => list.filter((t) => t !== null) as TableRecordWithDetails[]);
  }

  async delete(id: number): Promise<void> {
    await db.transaction('rw', [db.tableRecord, db.tableHime, db.tableCast], async () => {
      await db.tableHime.where('tableId').equals(id).delete();
      await db.tableCast.where('tableId').equals(id).delete();
      await db.tableRecord.delete(id);
    });
  }
}

export const tableRepository = new TableRepository();
```

### 5.2 状態管理（Zustand Store）

#### himeStore.ts
```typescript
import { create } from 'zustand';
import { Hime } from '../types/hime';
import { himeRepository } from '../database/repositories/HimeRepository';

interface HimeState {
  himeList: Hime[];
  loading: boolean;
  error: string | null;
  
  loadHimeList: () => Promise<void>;
  addHime: (hime: Omit<Hime, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateHime: (id: number, hime: Partial<Hime>) => Promise<void>;
  deleteHime: (id: number) => Promise<void>;
  searchHime: (query: string) => Promise<void>;
}

export const useHimeStore = create<HimeState>((set, get) => ({
  himeList: [],
  loading: false,
  error: null,

  loadHimeList: async () => {
    set({ loading: true, error: null });
    try {
      const himeList = await himeRepository.findAll();
      set({ himeList, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  addHime: async (hime) => {
    set({ loading: true, error: null });
    try {
      await himeRepository.create(hime);
      await get().loadHimeList();
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  updateHime: async (id, hime) => {
    set({ loading: true, error: null });
    try {
      await himeRepository.update(id, hime);
      await get().loadHimeList();
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  deleteHime: async (id) => {
    set({ loading: true, error: null });
    try {
      await himeRepository.delete(id);
      await get().loadHimeList();
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  searchHime: async (query) => {
    set({ loading: true, error: null });
    try {
      const himeList = query
        ? await himeRepository.search(query)
        : await himeRepository.findAll();
      set({ himeList, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },
}));
```

### 5.3 通知システム（Web Push API）

#### NotificationService
```typescript
export class NotificationService {
  private static instance: NotificationService;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // 通知権限リクエスト
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('このブラウザは通知をサポートしていません');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  // 即座に通知を表示
  async showNotification(title: string, options?: NotificationOptions): Promise<void> {
    const hasPermission = await this.requestPermission();
    if (!hasPermission) return;

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      // Service Worker経由で通知
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        ...options,
      });
    } else {
      // 直接通知
      new Notification(title, {
        icon: '/icons/icon-192x192.png',
        ...options,
      });
    }
  }

  // スケジュール通知（localStorage + Service Worker）
  async scheduleNotification(
    id: string,
    title: string,
    body: string,
    scheduledTime: Date
  ): Promise<void> {
    const hasPermission = await this.requestPermission();
    if (!hasPermission) return;

    // LocalStorageに保存
    const notifications = this.getScheduledNotifications();
    notifications.push({
      id,
      title,
      body,
      scheduledTime: scheduledTime.toISOString(),
    });
    localStorage.setItem('scheduledNotifications', JSON.stringify(notifications));

    // Service Workerに通知
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SCHEDULE_NOTIFICATION',
        data: { id, title, body, scheduledTime: scheduledTime.toISOString() },
      });
    }
  }

  // スケジュール通知をキャンセル
  async cancelScheduledNotification(id: string): Promise<void> {
    const notifications = this.getScheduledNotifications();
    const filtered = notifications.filter((n) => n.id !== id);
    localStorage.setItem('scheduledNotifications', JSON.stringify(filtered));

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CANCEL_NOTIFICATION',
        data: { id },
      });
    }
  }

  // スケジュール済み通知を取得
  private getScheduledNotifications(): ScheduledNotification[] {
    const stored = localStorage.getItem('scheduledNotifications');
    return stored ? JSON.parse(stored) : [];
  }

  // 期限切れ通知のチェックと送信
  async checkAndSendPendingNotifications(): Promise<void> {
    const notifications = this.getScheduledNotifications();
    const now = new Date();
    const pending = notifications.filter(
      (n) => new Date(n.scheduledTime) <= now
    );

    for (const notification of pending) {
      await this.showNotification(notification.title, {
        body: notification.body,
      });
      await this.cancelScheduledNotification(notification.id);
    }
  }
}

interface ScheduledNotification {
  id: string;
  title: string;
  body: string;
  scheduledTime: string;
}

export const notificationService = NotificationService.getInstance();
```

---

## 6. PWA対応

### 6.1 manifest.json
```json
{
  "name": "HostNote",
  "short_name": "HostNote",
  "description": "ホストクラブ向け姫・キャスト管理アプリ",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0D0D0D",
  "theme_color": "#D4AF37",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/home.png",
      "sizes": "540x720",
      "type": "image/png",
      "form_factor": "narrow"
    },
    {
      "src": "/screenshots/hime-list.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide"
    }
  ],
  "categories": ["productivity", "business"],
  "lang": "ja"
}
```

### 6.2 Service Worker
```typescript
// public/service-worker.js
const CACHE_NAME = 'hostnote-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  // 他の静的リソース
];

// インストール
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// フェッチ（キャッシュ優先）
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// アクティベーション（古いキャッシュ削除）
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// スケジュール通知処理
self.addEventListener('message', (event) => {
  if (event.data.type === 'SCHEDULE_NOTIFICATION') {
    const { id, title, body, scheduledTime } = event.data.data;
    const delay = new Date(scheduledTime).getTime() - Date.now();

    if (delay > 0) {
      setTimeout(() => {
        self.registration.showNotification(title, {
          body,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
          tag: id,
        });
      }, delay);
    }
  }
});
```

### 6.3 PWA登録（main.tsx）
```typescript
// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';

// Service Worker登録
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        console.log('SW registered:', registration);
      })
      .catch((error) => {
        console.error('SW registration failed:', error);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

---

## 7. ルーティング設計

### 7.1 React Router設定
```typescript
// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';

// Pages
import HomePage from './pages/Home';
import HimeListPage from './pages/Hime/List';
import HimeDetailPage from './pages/Hime/Detail';
import HimeAddPage from './pages/Hime/Add';
import HimeEditPage from './pages/Hime/Edit';
import CastListPage from './pages/Cast/List';
import CastDetailPage from './pages/Cast/Detail';
import CastAddPage from './pages/Cast/Add';
import CastEditPage from './pages/Cast/Edit';
import TableListPage from './pages/Table/List';
import TableDetailPage from './pages/Table/Detail';
import TableAddPage from './pages/Table/Add';
import TableEditPage from './pages/Table/Edit';
import CalendarPage from './pages/Calendar';
import SettingsPage from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          
          {/* 姫 */}
          <Route path="hime">
            <Route index element={<HimeListPage />} />
            <Route path="add" element={<HimeAddPage />} />
            <Route path=":id" element={<HimeDetailPage />} />
            <Route path=":id/edit" element={<HimeEditPage />} />
          </Route>

          {/* キャスト */}
          <Route path="cast">
            <Route index element={<CastListPage />} />
            <Route path="add" element={<CastAddPage />} />
            <Route path=":id" element={<CastDetailPage />} />
            <Route path=":id/edit" element={<CastEditPage />} />
          </Route>

          {/* 卓記録 */}
          <Route path="table">
            <Route index element={<TableListPage />} />
            <Route path="add" element={<TableAddPage />} />
            <Route path=":id" element={<TableDetailPage />} />
            <Route path=":id/edit" element={<TableEditPage />} />
          </Route>

          {/* カレンダー */}
          <Route path="calendar" element={<CalendarPage />} />

          {/* 設定 */}
          <Route path="settings" element={<SettingsPage />} />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 8. ビルド・デプロイ

### 8.1 Vite設定
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*.png'],
      manifest: {
        name: 'HostNote',
        short_name: 'HostNote',
        description: 'ホストクラブ向け姫・キャスト管理アプリ',
        theme_color: '#D4AF37',
        background_color: '#0D0D0D',
        display: 'standalone',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1年
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@database': path.resolve(__dirname, './src/database'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@types': path.resolve(__dirname, './src/types'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@services': path.resolve(__dirname, './src/services'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          database: ['dexie'],
          ui: ['@headlessui/react', 'react-hook-form'],
        },
      },
    },
  },
});
```

### 8.2 デプロイ方法

#### Vercel
```bash
# Vercel CLIインストール
npm install -g vercel

# デプロイ
vercel

# プロダクションデプロイ
vercel --prod
```

#### Netlify
```bash
# Netlify CLIインストール
npm install -g netlify-cli

# ビルド
npm run build

# デプロイ
netlify deploy --prod --dir=dist
```

#### GitHub Pages
```bash
# gh-pages インストール
npm install --save-dev gh-pages

# package.json にスクリプト追加
{
  "scripts": {
    "deploy": "vite build && gh-pages -d dist"
  }
}

# デプロイ
npm run deploy
```

---

## 9. 開発環境セットアップ

### 9.1 必要ツール
- Node.js 18.x 以上
- npm または yarn または pnpm

### 9.2 初期セットアップコマンド
```bash
# プロジェクト作成
npm create vite@latest hostnote-web -- --template react-ts

cd hostnote-web

# 依存関係インストール
npm install react-router-dom
npm install dexie
npm install zustand
npm install date-fns
npm install @tanstack/react-query
npm install react-hook-form zod @hookform/resolvers
npm install @dicebear/core @dicebear/collection

# UI関連
npm install tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install @headlessui/react
npm install react-icons
npm install react-big-calendar
npm install react-toastify

# PWA
npm install -D vite-plugin-pwa

# 開発ツール
npm install -D eslint prettier
npm install -D @typescript-eslint/eslint-plugin @typescript-eslint/parser
npm install -D eslint-plugin-react eslint-plugin-react-hooks

# 開発サーバー起動
npm run dev
```

---

## 10. 今後の拡張性

### 10.1 Phase 2 機能
- **写真複数枚対応**: ギャラリー形式
- **タグ機能**: 姫やキャストにタグ付け
- **売上管理**: 卓記録に売上情報追加
- **統計ダッシュボード**: 月間来店数、人気の姫など
- **データエクスポート**: CSV / JSON / Excel出力
- **印刷機能**: 卓記録やレポートの印刷

### 10.2 Phase 3 機能
- **クラウド同期**: Firebase / Supabase連携
- **マルチユーザー**: 店舗アカウント・キャストアカウント
- **QRコード**: 姫のプロフィールQRコード生成
- **音声メモ**: Web Audio APIでボイスレコーディング
- **チャート可視化**: 売上推移、来店傾向グラフ

### 10.3 技術的改善
- **オフライン対応強化**: Background Sync API
- **リアルタイム同期**: WebSocket
- **パフォーマンス**: Virtual Scroll、画像最適化
- **アクセシビリティ**: ARIA対応、キーボードナビゲーション

---

## まとめ

この設計書に基づいて実装を進めることで、以下が実現されます:

✅ **Webブラウザで動作**: PC・スマホ・タブレット対応  
✅ **PWA対応**: インストール可能、オフライン動作  
✅ **データの安全な管理**: IndexedDBによるローカル保存  
✅ **柔軟なカスタマイズ**: 5種類のテーマ切り替え  
✅ **実用的な通知機能**: Web Push APIで来店予定・誕生日通知  
✅ **拡張性の高い設計**: 将来的な機能追加に対応  
✅ **モダンなUI**: Tailwind CSS + Shadcn/ui  
✅ **レスポンシブデザイン**: デスクトップ・モバイル最適化  

次のステップ: 実装計画書とコンポーネント設計の詳細化