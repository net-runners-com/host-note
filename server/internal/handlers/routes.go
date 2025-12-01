package handlers

import (
	"github.com/hostnote/server/internal/middleware"
	"gorm.io/gorm"

	"github.com/gin-gonic/gin"
)

// RegisterRoutes APIルートを登録
func RegisterRoutes(r *gin.RouterGroup, db *gorm.DB) {
	// 認証エンドポイント（認証不要）
	authHandler := NewAuthHandler(db)
	r.POST("/auth/register", authHandler.Register)
	r.POST("/auth/login", authHandler.Login)
	r.GET("/auth/me", middleware.AuthMiddleware(), authHandler.Me)
	r.GET("/auth/google", authHandler.GoogleLogin)
	r.GET("/auth/google/callback", authHandler.GoogleCallback)              // サーバーサイドフロー用
	r.POST("/auth/google/callback", authHandler.GoogleCallbackFromFrontend) // フロントエンド用

	// 認証が必要なエンドポイント
	authenticated := r.Group("")
	authenticated.Use(middleware.AuthMiddleware())
	{
		// 認証関連（パスワード更新やメール更新）
		authenticated.POST("/auth/change-password", authHandler.ChangePassword)
		authenticated.PUT("/auth/email", authHandler.UpdateEmail)
		authenticated.DELETE("/auth/account", authHandler.DeleteAccount)

		// 姫エンドポイント
		himeHandler := NewHimeHandler(db)
		authenticated.GET("/hime", himeHandler.List)
		authenticated.POST("/hime", himeHandler.Create)
		authenticated.POST("/hime/bulk", himeHandler.BulkCreate)
		authenticated.GET("/hime/:id", himeHandler.Get)
		authenticated.PUT("/hime/:id", himeHandler.Update)
		authenticated.DELETE("/hime/:id", himeHandler.Delete)

		// キャストエンドポイント
		castHandler := NewCastHandler(db)
		authenticated.GET("/cast", castHandler.List)
		authenticated.POST("/cast", castHandler.Create)
		authenticated.POST("/cast/bulk", castHandler.BulkCreate)
		authenticated.GET("/cast/:id", castHandler.Get)
		authenticated.PUT("/cast/:id", castHandler.Update)
		authenticated.DELETE("/cast/:id", castHandler.Delete)

		// 卓記録エンドポイント
		tableHandler := NewTableHandler(db)
		authenticated.GET("/table", tableHandler.List)
		authenticated.POST("/table", tableHandler.Create)
		authenticated.POST("/table/bulk", tableHandler.BulkCreate)
		authenticated.GET("/table/:id", tableHandler.Get)
		authenticated.PUT("/table/:id", tableHandler.Update)
		authenticated.DELETE("/table/:id", tableHandler.Delete)
		authenticated.POST("/table-hime", tableHandler.CreateTableHime)
		authenticated.POST("/table-hime/bulk", tableHandler.BulkCreateTableHime)
		authenticated.POST("/table-cast", tableHandler.CreateTableCast)
		authenticated.POST("/table-cast/bulk", tableHandler.BulkCreateTableCast)

		// スケジュールエンドポイント
		scheduleHandler := NewScheduleHandler(db)
		authenticated.GET("/schedule", scheduleHandler.List)
		authenticated.POST("/schedule", scheduleHandler.Create)
		authenticated.POST("/schedule/bulk", scheduleHandler.BulkCreate)
		authenticated.GET("/schedule/:id", scheduleHandler.Get)
		authenticated.PUT("/schedule/:id", scheduleHandler.Update)
		authenticated.DELETE("/schedule/:id", scheduleHandler.Delete)

		// 来店記録エンドポイント
		visitHandler := NewVisitHandler(db)
		authenticated.GET("/visit", visitHandler.List)
		authenticated.POST("/visit", visitHandler.Create)
		authenticated.POST("/visit/bulk", visitHandler.BulkCreate)
		authenticated.GET("/visit/:id", visitHandler.Get)
		authenticated.PUT("/visit/:id", visitHandler.Update)
		authenticated.DELETE("/visit/:id", visitHandler.Delete)

		// 設定エンドポイント
		settingHandler := NewSettingHandler(db)
		authenticated.GET("/setting", settingHandler.List)
		authenticated.POST("/setting", settingHandler.Create)
		authenticated.POST("/setting/bulk", settingHandler.BulkCreate)
		authenticated.GET("/setting/:key", settingHandler.Get)
		authenticated.PUT("/setting/:key", settingHandler.Update)
		authenticated.DELETE("/setting/:key", settingHandler.Delete)

		// AI分析エンドポイント
		aiHandler := NewAIHandler(db)
		authenticated.POST("/ai/analyze", aiHandler.Analyze)
		authenticated.POST("/ai/conversation", aiHandler.AnalyzeConversation)

		// 自分のキャスト情報エンドポイント
		myCastHandler := NewMyCastHandler(db)
		authenticated.GET("/my-cast", myCastHandler.Get)
		authenticated.POST("/my-cast", myCastHandler.Create)
		authenticated.PUT("/my-cast", myCastHandler.Update)
		authenticated.GET("/my-cast/check", myCastHandler.Check)

		// プッシュ通知エンドポイント
		authenticated.POST("/push/subscribe", SubscribePush(db))
		authenticated.DELETE("/push/unsubscribe", UnsubscribePush(db))
		authenticated.POST("/push/test", SendTestNotification(db))

		// メニューエンドポイント
		menuHandler := NewMenuHandler(db)
		authenticated.GET("/menu", menuHandler.List)
		authenticated.POST("/menu", menuHandler.Create)
		authenticated.POST("/menu/bulk", menuHandler.BulkCreate)
		authenticated.GET("/menu/:id", menuHandler.Get)
		authenticated.PUT("/menu/:id", menuHandler.Update)
		authenticated.DELETE("/menu/:id", menuHandler.Delete)
	}
}
