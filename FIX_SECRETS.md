# 機密情報の削除手順

## 問題

GitHubのプッシュ保護により、以下の機密情報が検出されました：
- OpenAI API Key（`server/.env.backup`に含まれている）
- Google OAuth Client ID（`server/.env.backup`に含まれている）
- Google OAuth Client Secret（`server/.env.backup`に含まれている）

また、`server/pkg/mod/`ディレクトリ（Goのモジュールキャッシュ）が含まれており、大きなファイルが含まれています。

## 実施した対応

1. ✅ `.gitignore`に`server/.env.backup`を追加
2. ✅ `server/.env.backup`をGitの追跡から削除
3. ✅ `server/pkg/mod/`をGitの追跡から削除
4. ✅ 新しいコミットを作成

## 次のステップ

### オプション1: 新しいコミットをプッシュ（推奨）

機密情報を含むファイルを削除した新しいコミットをプッシュ：

```bash
git push -u origin main
```

### オプション2: 履歴から完全に削除（より安全）

機密情報を完全に履歴から削除する場合（注意：既にプッシュ済みの場合は、他の人と共有しているリポジトリでは推奨されません）：

```bash
# git-filter-repoを使用（推奨）
git filter-repo --path server/.env.backup --invert-paths
git filter-repo --path server/pkg/ --invert-paths

# または、BFG Repo-Cleanerを使用
# bfg --delete-files .env.backup
# bfg --delete-folders server/pkg
```

### オプション3: GitHubのURLから許可（一時的な解決策）

機密情報が既に無効化されている場合、GitHubのURLから一時的に許可することもできます：
- https://github.com/net-runners-com/host-note/security/secret-scanning/unblock-secret/...

**注意**: これは推奨されません。機密情報は無効化して、履歴から削除することを強く推奨します。

## 機密情報の無効化

以下の機密情報を無効化してください：

1. **OpenAI API Key**: OpenAIのダッシュボードで無効化
2. **Google OAuth Client ID/Secret**: Google Cloud Consoleで無効化し、新しい認証情報を生成

## 今後の対策

- `.env`、`.env.*`ファイルは必ず`.gitignore`に含める
- バックアップファイル（`.env.backup`など）も`.gitignore`に追加
- コミット前に`git status`で機密情報が含まれていないか確認
- `server/pkg/`、`server/vendor/`などの依存関係キャッシュは`.gitignore`に追加

