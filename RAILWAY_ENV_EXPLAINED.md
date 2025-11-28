# Railway環境変数の説明

## FRONTEND_URL と GOOGLE_REDIRECT_URL の違い

### FRONTEND_URL

**用途**: Google OAuth認証完了後に、バックエンドからフロントエンドにリダイレクトする際に使用

**本番環境の値**:
```
FRONTEND_URL=https://host-note-xi.vercel.app
```

**説明**:
- Google OAuth認証が完了すると、バックエンド（Railway）がフロントエンド（Vercel）にリダイレクトします
- このリダイレクト先のURLを指定します
- コード内の使用箇所: `server/internal/handlers/auth.go` の `GoogleCallback` 関数

### GOOGLE_REDIRECT_URL

**用途**: Google OAuthのコールバックURL（Googleが認証後にリダイレクトする先）

**本番環境の値**:
```
GOOGLE_REDIRECT_URL=https://your-railway-app.railway.app/api/v1/auth/google/callback
```

**説明**:
- Google OAuth認証フローで、Googleが認証完了後にリダイレクトするURLです
- これは**バックエンド（Railway）のURL**です
- Google Cloud Consoleでも同じURLを設定する必要があります
- コード内の使用箇所: `server/internal/config/config.go` で読み込まれ、Google OAuth設定に使用

## 設定の流れ

1. **ユーザーがGoogleでログイン** → フロントエンド（Vercel）
2. **Google認証** → Googleサーバー
3. **認証完了** → Googleが `GOOGLE_REDIRECT_URL`（Railway）にリダイレクト
4. **バックエンドでトークン処理** → Railway
5. **フロントエンドにリダイレクト** → `FRONTEND_URL`（Vercel）にリダイレクト

## Railway環境変数の設定

### 必須の環境変数

```env
# フロントエンドURL（VercelのURL）
FRONTEND_URL=https://host-note-xi.vercel.app

# Google OAuthコールバックURL（RailwayのURL - 後で更新）
GOOGLE_REDIRECT_URL=https://your-railway-app.railway.app/api/v1/auth/google/callback
```

## Google Cloud Consoleでの設定

Google Cloud Consoleでも、以下のURLを設定する必要があります：

1. [Google Cloud Console](https://console.cloud.google.com)にアクセス
2. プロジェクトを選択
3. "APIs & Services" → "Credentials"
4. OAuth 2.0 Client IDを編集
5. **承認済みのリダイレクトURI**に以下を追加：
   ```
   https://your-railway-app.railway.app/api/v1/auth/google/callback
   ```
6. **承認済みのJavaScript生成元**に以下を追加：
   ```
   https://host-note-xi.vercel.app
   ```

## まとめ

| 環境変数 | 値 | 説明 |
|---------|-----|------|
| `FRONTEND_URL` | `https://host-note-xi.vercel.app` | フロントエンド（Vercel）のURL |
| `GOOGLE_REDIRECT_URL` | `https://your-railway-app.railway.app/api/v1/auth/google/callback` | バックエンド（Railway）のコールバックURL |

