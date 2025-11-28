#!/bin/bash

echo "🚀 Setting up development environment..."

# Go のパスを設定
export PATH=$PATH:/usr/local/go/bin

# フロントエンドの依存関係をインストール
if [ -f "app/package.json" ]; then
    echo "📦 Installing frontend dependencies..."
    cd app
    npm install
    cd ..
fi

# バックエンドの依存関係をインストール
if [ -f "server/go.mod" ]; then
    echo "📦 Installing Go dependencies..."
    cd server
    go mod download
    go mod tidy
    cd ..
fi

# airのインストール（オプション、Go 1.25が必要な場合は後で手動インストール）
echo "📦 Installing Go development tools..."
if go version | grep -q "go1.2[5-9]"; then
    go install github.com/air-verse/air@latest
    echo "✅ Air installed"
else
    echo "⚠️  Air requires Go 1.25+, skipping installation. Use 'go run' instead."
fi

echo "✅ Development environment setup complete!"



