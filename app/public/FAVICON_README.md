# Faviconの配置場所とサイズ

## 配置場所

Faviconは以下の2つの場所に配置できます：

### 1. `app/public/` のルート（推奨）
- `favicon.ico` - メインのfavicon（16x16, 32x32を含むICO形式）
- または `favicon.png` - PNG形式（32x32が一般的）

### 2. `app/public/icons/` ディレクトリ
- `favicon-16x16.png` - 16x16ピクセル
- `favicon-32x32.png` - 32x32ピクセル

## 推奨サイズ

- **16x16** - ブラウザタブ用（最小サイズ）
- **32x32** - ブラウザタブ用（標準サイズ、推奨）
- **192x192** - PWA用（`/icons/icon-192x192.png`として使用）
- **512x512** - PWA用（`/icons/icon-512x512.png`として使用）

## 現在の設定

`index.html`では以下のように参照されています：
- `/favicon-32x32.png` - 32x32のfavicon
- `/favicon-16x16.png` - 16x16のfavicon
- `/icons/icon-192x192.png` - Apple Touch Icon

これらのファイルは`app/public/`のルートまたは`app/public/icons/`に配置してください。
