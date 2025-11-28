package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/hostnote/server/internal/models"
	"github.com/hostnote/server/internal/services"
	"gorm.io/gorm"
)

// SubscribePushRequest プッシュ通知の登録リクエスト
type SubscribePushRequest struct {
	Token string `json:"token" binding:"required"`
}

// SubscribePush プッシュ通知トークンを登録
func SubscribePush(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("userID")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			c.Abort()
			return
		}

		var req SubscribePushRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// 既存のトークンを確認
		var existingToken models.PushToken
		result := db.Where("token = ? AND user_id = ?", req.Token, userID.(uint)).First(&existingToken)
		if result.Error == nil {
			// 既に登録されている
			c.JSON(http.StatusOK, gin.H{"message": "Token already registered"})
			return
		}

		// 新しいトークンを登録
		token := models.PushToken{
			UserID: userID.(uint),
			Token:  req.Token,
		}

		if err := db.Create(&token).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to register token"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Token registered successfully"})
	}
}

// UnsubscribePush プッシュ通知トークンを削除
func UnsubscribePush(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("userID")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			c.Abort()
			return
		}
		token := c.Query("token")

		if token == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Token is required"})
			return
		}

		// トークンを削除
		result := db.Where("token = ? AND user_id = ?", token, userID.(uint)).Delete(&models.PushToken{})
		if result.Error != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete token"})
			return
		}

		if result.RowsAffected == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": "Token not found"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Token unregistered successfully"})
	}
}

// SendTestNotification テスト通知を送信
func SendTestNotification(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("userID")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			c.Abort()
			return
		}

		// ユーザーのトークンを取得
		var tokens []models.PushToken
		if err := db.Where("user_id = ?", userID.(uint)).Find(&tokens).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get tokens"})
			return
		}

		if len(tokens) == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "No tokens registered"})
			return
		}

		// テスト通知を送信
		tokenStrings := make([]string, len(tokens))
		for i, t := range tokens {
			tokenStrings[i] = t.Token
		}

		err := services.SendNotificationToMultiple(
			tokenStrings,
			"こんにちは",
			"これはテスト通知です",
			map[string]string{"type": "test"},
		)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send notification"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Notification sent successfully"})
	}
}
