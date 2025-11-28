# パフォーマンス計測結果の要約

## 計測期間
- 開始時刻: 2025-11-28T23:22:10.211Z
- 計測範囲: 約5.1秒（5114.667ms）

## 主要なボトルネック

### 1. 画像デコード処理（最大の問題）
- **ImageDecodeTask**: 119.75ms
- **Decode LazyPixelRef**: 115.18ms
- **Decode Image**: 103.03ms
- **合計**: 約300ms以上

**問題点**: 画像のデコード処理に時間がかかっている

### 2. RunTask（長時間実行タスク）
- 最大: **543.15ms**
- 2番目: 120.36ms
- その他: 複数の長時間実行タスク

**問題点**: メインスレッドをブロックしている可能性

### 3. JavaScript実行
- **v8.callFunction**: 58.58ms
- **FunctionCall**: 58.52ms
- **V8.StackGuard**: 58.41ms

**問題点**: JavaScriptの実行時間が長い

## カテゴリ別の合計時間

1. **disabled-by-default-devtools.timeline**: 2,503.82ms（10,545件）
2. **navigation**: 531.23ms（522件）
3. **v8.execute**: 197.84ms（98件）
4. **devtools.timeline**: 183.22ms（461件）
5. **v8**: 172.21ms（241件）
6. **loading**: 110.02ms（252件）

## 推奨される最適化

1. **画像最適化**
   - 画像のサイズを最適化
   - WebP形式の使用
   - 遅延読み込み（lazy loading）の実装
   - 画像の圧縮

2. **JavaScript最適化**
   - コード分割（code splitting）
   - 不要な再レンダリングの削減
   - メモ化の活用
   - 重い処理のWeb Worker化

3. **タスクの最適化**
   - 長時間実行タスクの分割
   - requestIdleCallbackの活用
   - バッチ処理の実装

