# CRUD操作のトランザクション処理レビュー

## 現在の状況

### ✅ トランザクションを使用している操作

1. **TableHandler.Create** - トランザクション使用
   - TableRecord作成
   - TableHime作成
   - TableCast作成
   - VisitRecord作成（自動追加）
   - すべての操作がトランザクション内で実行

2. **TableHandler.Update** - トランザクション使用
   - TableRecord更新
   - TableHime削除・再作成
   - TableCast削除・再作成
   - すべての操作がトランザクション内で実行

3. **AuthHandler.DeleteAccount** - トランザクション使用
   - 複数のテーブルを削除
   - 外部キー制約を考慮した削除順序

### ❌ トランザクション未使用（問題あり）

1. **TableHandler.Delete** - トランザクション未使用
   - TableRecordのみ削除
   - **問題**: TableHime, TableCastの関連データが削除されていない
   - 外部キー制約により削除エラーが発生する可能性

2. **BulkCreate操作** - トランザクション未使用
   - CastHandler.BulkCreate
   - HimeHandler.BulkCreate
   - TableHandler.BulkCreate
   - ScheduleHandler.BulkCreate
   - VisitHandler.BulkCreate
   - **問題**: 一部のレコード作成が失敗した場合、データの整合性が保証されない

3. **その他のCRUD操作** - トランザクション未使用（問題なし）
   - CastHandler.Create/Update/Delete（単一テーブル操作のため問題なし）
   - HimeHandler.Create/Update/Delete（単一テーブル操作のため問題なし）
   - ScheduleHandler.Create/Update/Delete（単一テーブル操作のため問題なし）
   - VisitHandler.Create/Update/Delete（単一テーブル操作のため問題なし）

## 修正が必要な箇所

1. **TableHandler.Delete** - 関連データの削除を追加
2. **BulkCreate操作** - トランザクションを追加（一貫性のため）

