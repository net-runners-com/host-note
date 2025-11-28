package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// getUserID コンテキストからユーザーIDを取得
func getUserID(c *gin.Context) (uint, bool) {
	userID, exists := c.Get("userID")
	if !exists {
		return 0, false
	}
	uid, ok := userID.(uint)
	return uid, ok
}

// requireAuth 認証が必要な場合にエラーレスポンスを返す
func requireAuth(c *gin.Context) bool {
	_, exists := getUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "認証が必要です"})
		return false
	}
	return true
}

// parseID パラメータからIDを取得
func parseID(c *gin.Context, paramName string) (uint, error) {
	idStr := c.Param(paramName)
	if idStr == "" {
		idStr = c.Param("id")
	}
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		return 0, err
	}
	return uint(id), nil
}

// handleError エラーを処理してレスポンスを返す
func handleError(c *gin.Context, err error, notFoundMsg string) bool {
	if err == nil {
		return false
	}

	if err == gorm.ErrRecordNotFound {
		c.JSON(http.StatusNotFound, gin.H{"error": notFoundMsg})
		return true
	}

	c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
	return true
}

// handleDBError データベースエラーを処理
func handleDBError(c *gin.Context, err error, notFoundMsg string) bool {
	return handleError(c, err, notFoundMsg)
}

