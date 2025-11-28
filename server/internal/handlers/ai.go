package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type AIHandler struct {
	db *gorm.DB
}

func NewAIHandler(db *gorm.DB) *AIHandler {
	return &AIHandler{db: db}
}

type AnalyzeRequest struct {
	HimeID       *int   `json:"himeId"`
	AnalysisType string `json:"analysisType" binding:"required"`
	Period       string `json:"period"`
}

type AnalyzeResponse struct {
	Result string `json:"result"`
}

// Analyze AI分析を実行
func (h *AIHandler) Analyze(c *gin.Context) {
	var req AnalyzeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// TODO: 実際のAI分析ロジックを実装
	// 現在はモックレスポンスを返す
	result := "AI分析結果がここに表示されます。\n\nサーバー側の実装が完了次第、実際の分析結果を返します。"

	c.JSON(http.StatusOK, AnalyzeResponse{
		Result: result,
	})
}
