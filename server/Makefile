.PHONY: run dev build test clean migrate

# サーバーを起動
run:
	go run main.go

# 開発モード（Air使用）
dev:
	air

# ビルド
build:
	go build -o bin/server main.go

# テスト実行
test:
	go test ./...

# クリーンアップ
clean:
	rm -rf bin/
	go clean

# マイグレーション実行
migrate:
	go run cmd/migrate/main.go

# シーダー実行（既存データを保持）
seed:
	go run cmd/seed/main.go

# シーダー実行（既存データを削除して再生成）
seed-force:
	go run cmd/seed/main.go -force

# マスターデータのみシード
seed-master:
	go run cmd/seed/main.go -master-only

# マスターデータのみシード（既存データを削除して再生成）
seed-master-force:
	go run cmd/seed/main.go -master-only -force

# テストデータのみシード
seed-demo:
	go run cmd/seed/main.go -demo-only

# テストデータのみシード（既存データを削除して再生成）
seed-demo-force:
	go run cmd/seed/main.go -demo-only -force

# マスターデータをエクスポート
export:
	go run cmd/export/main.go

# データベーススキーマをエクスポート
schema:
	go run cmd/schema/main.go

# 依存関係の更新
deps:
	go mod download
	go mod tidy

# フォーマット
fmt:
	go fmt ./...

# リント
lint:
	golangci-lint run




