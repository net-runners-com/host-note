package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/hostnote/server/internal/config"
	"github.com/hostnote/server/internal/database"
	"github.com/hostnote/server/internal/handlers"
	"github.com/hostnote/server/internal/middleware"
	"github.com/hostnote/server/internal/services"
)

func main() {
	// 環境変数の読み込み
	if err := config.Load(); err != nil {
		log.Printf("Warning: .env file not found, using environment variables: %v", err)
	}

	// データベース接続
	db, err := database.Connect()
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// マイグレーション実行
	if err := database.Migrate(db); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	// Firebase Admin SDKを初期化
	if err := services.InitFCM(); err != nil {
		log.Printf("Warning: Failed to initialize FCM: %v", err)
		log.Println("Push notifications will not be available")
	} else {
		log.Println("✅ FCM initialized successfully")
		// 通知スケジューラーを開始
		scheduler := services.NewNotificationScheduler(db)
		scheduler.Start()
	}

	// Ginルーターの設定
	if os.Getenv("GIN_MODE") == "" {
		gin.SetMode(gin.DebugMode)
	}

	r := gin.Default()

	// ミドルウェア
	r.Use(middleware.CORS())
	r.Use(middleware.Logger())

	// ヘルスチェック
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"service": "host-note-api",
		})
	})

	// APIルート
	api := r.Group("/api/v1")
	{
		handlers.RegisterRoutes(api, db)
	}

	// 静的ファイルの配信（本番環境用）
	// 環境変数 STATIC_DIR が設定されている場合はそれを使用、なければ ../app/dist を使用
	staticDir := os.Getenv("STATIC_DIR")
	if staticDir == "" {
		// デフォルトは ../app/dist（server ディレクトリから見た相対パス）
		staticDir = filepath.Join("..", "app", "dist")
	}

	// 静的ファイルが存在する場合のみ配信
	if _, err := os.Stat(staticDir); err == nil {
		log.Printf("📁 Serving static files from: %s", staticDir)

		// 静的ファイルを配信（distディレクトリ全体を配信）
		// ただし、index.htmlはNoRouteで配信するため、ここでは除外
		r.StaticFS("/assets", gin.Dir(filepath.Join(staticDir, "assets"), false))
		r.StaticFS("/icons", gin.Dir(filepath.Join(staticDir, "icons"), false))
		r.StaticFile("/favicon-16x16.png", filepath.Join(staticDir, "favicon-16x16.png"))
		r.StaticFile("/favicon-32x32.png", filepath.Join(staticDir, "favicon-32x32.png"))
		r.StaticFile("/manifest.webmanifest", filepath.Join(staticDir, "manifest.webmanifest"))
		r.StaticFile("/registerSW.js", filepath.Join(staticDir, "registerSW.js"))
		r.StaticFile("/service-worker.js", filepath.Join(staticDir, "service-worker.js"))
		r.StaticFile("/sw.js", filepath.Join(staticDir, "sw.js"))
		r.StaticFile("/firebase-messaging-sw.js", filepath.Join(staticDir, "firebase-messaging-sw.js"))

		// workbox-*.js などの動的ファイル名に対応するため、distルートのJSファイルも配信
		// パターンマッチングはできないため、一般的なファイルを個別に登録
		// 実際には、NoRouteでフォールバックされるため、ここでは主要なファイルのみ登録

		// SPAフォールバック: APIルート以外のすべてのリクエストを index.html にフォールバック
		// ただし、実際に存在するファイル（assets, icons, favicon等）は先にマッチするため、それらは配信される
		r.NoRoute(func(c *gin.Context) {
			// APIルートの場合は404を返す
			if strings.HasPrefix(c.Request.URL.Path, "/api") {
				c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
				return
			}

			// 静的ファイル（assets, icons, favicon等）のリクエストの場合は、実際のファイルを探す
			requestedPath := c.Request.URL.Path
			fullPath := filepath.Join(staticDir, requestedPath)

			// ファイルが存在する場合はそれを返す
			if info, err := os.Stat(fullPath); err == nil && !info.IsDir() {
				c.File(fullPath)
				return
			}

			// それ以外は index.html を返す（SPAのルーティングを有効にするため）
			c.File(filepath.Join(staticDir, "index.html"))
		})
	} else {
		log.Printf("⚠️  Static directory not found: %s (skipping static file serving)", staticDir)
	}

	// サーバー起動
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("🚀 Server starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
