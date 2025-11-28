# GitHubへのプッシュ方法

## 認証方法の選択

GitHubにプッシュするには、以下のいずれかの方法で認証する必要があります：

### 方法1: SSH（推奨）

SSHキーを設定している場合：

```bash
# リモートURLをSSHに変更（既に実行済み）
git remote set-url origin git@github.com:net-runners-com/host-note.git

# プッシュ
git push -u origin main
```

SSHキーを設定していない場合：
1. [GitHub SSH設定ガイド](https://docs.github.com/ja/authentication/connecting-to-github-with-ssh)を参照
2. SSHキーを生成してGitHubに追加

### 方法2: Personal Access Token（HTTPS）

1. [GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)](https://github.com/settings/tokens)にアクセス
2. "Generate new token (classic)"をクリック
3. スコープで`repo`にチェック
4. トークンを生成してコピー
5. 以下のコマンドを実行：

```bash
# リモートURLをHTTPSに戻す
git remote set-url origin https://github.com/net-runners-com/host-note.git

# プッシュ（ユーザー名とパスワードを求められたら、パスワードの代わりにトークンを入力）
git push -u origin main
```

### 方法3: GitHub CLI

GitHub CLIをインストールしている場合：

```bash
# 認証
gh auth login

# プッシュ
git push -u origin main
```

## 現在の状態

- ✅ Gitリポジトリは初期化済み
- ✅ リモートリポジトリは設定済み（SSH URLに変更済み）
- ✅ 初回コミットは完了
- ⏳ GitHubへのプッシュ待ち

## 次のステップ

1. 上記のいずれかの方法で認証を設定
2. `git push -u origin main`を実行
3. VercelとRailwayでリポジトリを接続

