package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"
)

// ConversationAnalysisInput は会話分析に必要な入力情報
type ConversationAnalysisInput struct {
	SelfProfile    string
	PartnerProfile string
	Goal           string
	ExtraInfo      string
	ChatLog        string
}

type openAIChatRequest struct {
	Model       string              `json:"model"`
	Messages    []openAIChatMessage `json:"messages"`
	Temperature float32             `json:"temperature"`
	MaxTokens   int                 `json:"max_tokens,omitempty"`
	TopP        float32             `json:"top_p,omitempty"`
	Stream      bool                `json:"stream,omitempty"`
	Tools       []map[string]any    `json:"tools,omitempty"`
	ResponseFmt map[string]string   `json:"response_format,omitempty"`
}

type openAIChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type openAIChatResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
	Error *struct {
		Message string `json:"message"`
		Type    string `json:"type"`
	} `json:"error,omitempty"`
}

// AnalyzeConversationWithOpenAI はOpenAI APIを使って会話分析を実行する
func AnalyzeConversationWithOpenAI(ctx context.Context, input ConversationAnalysisInput) (string, error) {
	apiKey := os.Getenv("OPENAI_API_KEY")
	// 互換性のため、OPEN_AI_KEY もフォールバックとして見る
	if apiKey == "" {
		apiKey = os.Getenv("OPEN_AI_KEY")
	}
	if apiKey == "" {
		return "", fmt.Errorf("OPENAI_API_KEY is not set")
	}

	systemPrompt := `あなたは日本のホストクラブで働くホスト向けの、トップクラスの会話コンサルタントです。
与えられた「自分（ホスト）」と「相手（姫）」の情報、およびLINEなどのチャットログをもとに、
・今どんな関係性か（現状）
・相手のライフスタイルや性格傾向
・こちらへの好意度・興味度
・どの時間帯・タイミングが連絡しやすいか
・相手がどんな言葉や接し方を求めていそうか
・これからどう動くと距離を縮めやすいか（具体的なアクションプラン）
を、「ホスト目線」でわかりやすく日本語で出力してください。

出力は以下のセクション構成でお願いします：

1. 現在の関係性の分析
2. 相手のライフスタイル・性格の仮説
3. 好意度・信頼度の評価（5段階などで）
4. 連絡しやすい時間帯・頻度の提案
5. 相手が言われたい言葉・喜びそうな話題
6. 今後の具体的な立ち回り方（LINEの送り方・会話例・注意点）

ホストが読みやすいように、箇条書きと短めの文章で、ポジティブかつ現実的なアドバイスをしてください。`

	userContent := fmt.Sprintf(
		"【自分（ホスト）の情報】\n%s\n\n【相手（姫）の情報】\n%s\n\n【この状況からどうしたいか・目標】\n%s\n\n【その他の補足情報】\n%s\n\n【チャットログ（古い順に上から）】\n%s\n",
		input.SelfProfile,
		input.PartnerProfile,
		emptyIfTooShort(input.Goal),
		input.ExtraInfo,
		input.ChatLog,
	)

	reqBody := openAIChatRequest{
		Model: "gpt-4o-mini",
		Messages: []openAIChatMessage{
			{Role: "system", Content: systemPrompt},
			{Role: "user", Content: userContent},
		},
		Temperature: 0.8,
		MaxTokens:   1200,
		TopP:        0.9,
	}

	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("failed to marshal OpenAI request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://api.openai.com/v1/chat/completions", bytes.NewReader(bodyBytes))
	if err != nil {
		return "", fmt.Errorf("failed to create OpenAI request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to call OpenAI: %w", err)
	}
	defer resp.Body.Close()

	var oaResp openAIChatResponse
	if err := json.NewDecoder(resp.Body).Decode(&oaResp); err != nil {
		return "", fmt.Errorf("failed to decode OpenAI response: %w", err)
	}

	if oaResp.Error != nil {
		return "", fmt.Errorf("openai error: %s", oaResp.Error.Message)
	}

	if len(oaResp.Choices) == 0 {
		return "", fmt.Errorf("openai returned no choices")
	}

	return oaResp.Choices[0].Message.Content, nil
}

// emptyIfTooShort は空に近い文字列を空文字として扱うヘルパー
func emptyIfTooShort(s string) string {
	if len([]rune(s)) < 3 {
		return "（特になし）"
	}
	return s
}
