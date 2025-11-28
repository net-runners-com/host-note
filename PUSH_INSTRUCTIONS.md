# GitHubへのプッシュ手順

## 現在の状態

- ✅ Gitリポジトリは初期化済み
- ✅ リモートリポジトリは設定済み: `https://github.com/net-runners-com/host-note.git`
- ✅ 初回コミットは完了
- ⏳ GitHubへのプッシュ待ち

## プッシュ方法

### ステップ1: Personal Access Tokenを取得

1. [GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)](https://github.com/settings/tokens)にアクセス
2. "Generate new token (classic)"をクリック
3. **Note**: `host-note-deploy`など任意の名前を入力
4. **Expiration**: お好みの有効期限を選択
5. **Select scopes**: `repo`にチェック（すべてのリポジトリへのアクセス）
6. "Generate token"をクリック
7. **トークンをコピー**（この画面でしか表示されません）

### ステップ2: プッシュを実行

ターミナルで以下を実行：

```bash
cd /workspace
git push -u origin main
```

認証情報を求められたら：
- **Username**: `netrunners.business@gmail.com` または GitHubのユーザー名
- **Password**: 上記で取得したPersonal Access Token（パスワードではない）

### 代替方法: トークンをURLに含める

```bash
# トークンを環境変数に設定（セキュリティのため、使用後は削除）
export GITHUB_TOKEN=your_personal_access_token_here

# リモートURLにトークンを含める
git remote set-url origin https://${GITHUB_TOKEN}@github.com/net-runners-com/host-note.git

# プッシュ
git push -u origin main

# 使用後、トークンをURLから削除（セキュリティのため）
git remote set-url origin https://github.com/net-runners-com/host-note.git
```

## プッシュ後の確認

プッシュが成功したら：

1. [GitHubリポジトリ](https://github.com/net-runners-com/host-note)にアクセス
2. ファイルがアップロードされていることを確認
3. VercelとRailwayでリポジトリを接続

## トラブルシューティング

### 認証エラーが出る場合

- Personal Access Tokenが正しくコピーされているか確認
- トークンのスコープに`repo`が含まれているか確認
- トークンの有効期限が切れていないか確認

### プッシュが拒否される場合

```bash
# リモートの変更を取得
git pull origin main --allow-unrelated-histories

# 再度プッシュ
git push -u origin main
```

