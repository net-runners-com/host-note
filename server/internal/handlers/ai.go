package handlers

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/hostnote/server/internal/services"
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

// ConversationAnalyzeRequest は会話ログ分析用のリクエスト
type ConversationAnalyzeRequest struct {
	SelfProfile    string `json:"selfProfile" binding:"required"`    // 自分（ホスト）の情報
	PartnerProfile string `json:"partnerProfile" binding:"required"` // 相手（姫）の情報
	Goal           string `json:"goal"`                              // この状況からどうしたいか・目標
	ExtraInfo      string `json:"extraInfo"`                         // その他の補足情報
	ChatLog        string `json:"chatLog" binding:"required"`        // 会話ログ（LINEなど）
}

// ConversationAnalyzeResponse は会話ログ分析の応答
type ConversationAnalyzeResponse struct {
	Result string `json:"result"`
}

// AnalyzeConversation は会話ログをもとにAI分析を実行する
func (h *AIHandler) AnalyzeConversation(c *gin.Context) {
	var req ConversationAnalyzeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// リクエスト内容をログ出力（デバッグ用）
	log.Printf("[AIConversation] request: selfProfile=%q partnerProfile=%q goal=%q extraInfo=%q chatLogLen=%d",
		req.SelfProfile,
		req.PartnerProfile,
		req.Goal,
		req.ExtraInfo,
		len(req.ChatLog),
	)

	ctx := c.Request.Context()
	result, err := services.AnalyzeConversationWithOpenAI(ctx, services.ConversationAnalysisInput{
		SelfProfile:    req.SelfProfile,
		PartnerProfile: req.PartnerProfile,
		Goal:           req.Goal,
		ExtraInfo:      req.ExtraInfo,
		ChatLog:        req.ChatLog,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, ConversationAnalyzeResponse{
		Result: result,
	})
}
