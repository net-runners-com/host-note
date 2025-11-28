package main

import (
	"log"
	"os"

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
