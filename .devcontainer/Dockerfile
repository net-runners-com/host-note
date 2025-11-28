FROM mcr.microsoft.com/devcontainers/base:ubuntu-22.04

# 必要なツールのインストール
RUN apt-get update && apt-get install -y \
    git \
    curl \
    wget \
    vim \
    build-essential \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Go のインストール
ARG GO_VERSION=1.22.3
RUN curl -fsSL https://go.dev/dl/go${GO_VERSION}.linux-amd64.tar.gz | tar -xz -C /usr/local && \
    echo 'export PATH=$PATH:/usr/local/go/bin' >> /etc/profile.d/go.sh && \
    echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc

# Node.js のインストール（フロントエンド開発用）
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs

# Go のパスを環境変数に設定
ENV PATH=$PATH:/usr/local/go/bin

# Go ツールのインストール（Goがインストールされた後）
# airは後で必要に応じてインストール（Go 1.25が必要なため）
RUN /usr/local/go/bin/go install golang.org/x/tools/cmd/goimports@latest && \
    /usr/local/go/bin/go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest

# 作業ディレクトリの設定
WORKDIR /workspace


