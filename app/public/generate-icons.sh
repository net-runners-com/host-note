#!/bin/bash
# ImageMagickが必要です: sudo apt-get install imagemagick または brew install imagemagick

SOURCE="icon.png"
ICONS_DIR="icons"

mkdir -p "$ICONS_DIR"

# 各サイズのアイコンを生成
convert "$SOURCE" -resize 16x16 "$ICONS_DIR/favicon-16x16.png"
convert "$SOURCE" -resize 32x32 "$ICONS_DIR/favicon-32x32.png"
convert "$SOURCE" -resize 180x180 "$ICONS_DIR/apple-touch-icon.png"
convert "$SOURCE" -resize 192x192 "$ICONS_DIR/icon-192x192.png"
convert "$SOURCE" -resize 512x512 "$ICONS_DIR/icon-512x512.png"

# publicルートにもコピー
cp "$ICONS_DIR/favicon-16x16.png" favicon-16x16.png
cp "$ICONS_DIR/favicon-32x32.png" favicon-32x32.png

echo "アイコン生成完了！"
ls -lh "$ICONS_DIR"
