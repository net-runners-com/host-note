package middleware

import (
	"os"
	"regexp"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/rs/cors"
)

// CORS ミドルウェア
func CORS() gin.HandlerFunc {
	// 環境変数から許可するオリジンを取得
	allowedOrigins := []string{
		"http://localhost:3000",
		"http://localhost:5173",
	}

	// CORS_ALLOWED_ORIGINS環境変数があれば追加（カンマ区切りで複数指定可能）
	// ワイルドカードパターン（例: https://*.vercel.app）もサポート
	if origins := os.Getenv("CORS_ALLOWED_ORIGINS"); origins != "" {
		// カンマ区切りで分割し、空白をトリム
		originList := strings.Split(origins, ",")
		for _, origin := range originList {
			trimmed := strings.TrimSpace(origin)
			if trimmed != "" {
				allowedOrigins = append(allowedOrigins, trimmed)
			}
		}
	}

	// 許可されたオリジンのマップを作成（高速検索のため）
	allowedOriginsMap := make(map[string]bool)
	var wildcardPatterns []*regexp.Regexp

	for _, origin := range allowedOrigins {
		// ワイルドカードパターン（*を含む）を検出
		if strings.Contains(origin, "*") {
			// ワイルドカードパターンを正規表現に変換
			// * を .* に変換（任意の文字列にマッチ）
			pattern := strings.ReplaceAll(regexp.QuoteMeta(origin), "\\*", ".*")
			regex, err := regexp.Compile("^" + pattern + "$")
			if err == nil {
				wildcardPatterns = append(wildcardPatterns, regex)
			}
		} else {
			allowedOriginsMap[origin] = true
		}
	}

	c := cors.New(cors.Options{
		AllowOriginFunc: func(origin string) bool {
			// 完全一致チェック
			if allowedOriginsMap[origin] {
				return true
			}

			// ワイルドカードパターンマッチング
			for _, pattern := range wildcardPatterns {
				if pattern.MatchString(origin) {
					return true
				}
			}

			return false
		},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"},
		AllowedHeaders:   []string{"Origin", "Content-Type", "Accept", "Authorization"},
		AllowCredentials: true,
	})

	return func(ctx *gin.Context) {
		c.HandlerFunc(ctx.Writer, ctx.Request)
		ctx.Next()
	}
}
