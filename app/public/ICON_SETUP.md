# アイコン画像のセットアップ手順

## 必要なアイコンサイズ

`/public/icon.png`（1024x1024px）から以下のサイズのアイコンを生成してください：

### 1. ブラウザ用Favicon
- `favicon-16x16.png` - 16×16px（ブラウザタブ）
- `favicon-32x32.png` - 32×32px（タスクバー、ブックマーク）

### 2. Apple Touch Icon
- `icons/apple-touch-icon.png` - 180×180px（iOS Safari）

### 3. PWA用アイコン
- `icons/icon-192x192.png` - 192×192px（Android Chrome、PWA）
- `icons/icon-512x512.png` - 512×512px（PWA用、高解像度）

## 生成方法

### 方法1: ImageMagickを使用（推奨）
```bash
cd app/public
chmod +x generate-icons.sh
./generate-icons.sh
```

### 方法2: オンラインツールを使用
以下のオンラインツールで`icon.png`をリサイズ：
- https://www.iloveimg.com/resize-image
- https://imageresizer.com/

### 方法3: 画像編集ソフトを使用
Photoshop、GIMP、Canvaなどで`icon.png`を各サイズにリサイズして保存

## ファイル配置場所

生成したアイコンを以下の場所に配置：

```
app/public/
├── favicon-16x16.png          # 16×16px
├── favicon-32x32.png          # 32×32px
└── icons/
    ├── apple-touch-icon.png   # 180×180px
    ├── icon-192x192.png       # 192×192px
    └── icon-512x512.png       # 512×512px
```

## 確認

すべてのアイコンを配置後、以下を確認：
1. ビルド: `npm run build`
2. `dist/icons/`にすべてのアイコンが含まれているか確認
3. Vercelにデプロイして、ブラウザの開発者ツールでエラーがないか確認
