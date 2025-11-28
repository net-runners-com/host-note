package services

import (
	"context"
	"encoding/json"
	"fmt"
	"os"

	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/messaging"
	"google.golang.org/api/option"
)

var fcmClient *messaging.Client

// InitFCM Firebase Admin SDKを初期化
func InitFCM() error {
	// サービスアカウントキーのJSONを環境変数から取得
	serviceAccountKey := os.Getenv("FIREBASE_SERVICE_ACCOUNT_KEY")
	if serviceAccountKey == "" {
		// 環境変数が設定されていない場合は、ファイルから読み込む
		keyPath := os.Getenv("FIREBASE_SERVICE_ACCOUNT_KEY_PATH")
		if keyPath == "" {
			keyPath = "./test-98925-firebase-adminsdk-24qyg-21dc8f7a53.json"
		}
		if keyBytes, err := os.ReadFile(keyPath); err == nil {
			serviceAccountKey = string(keyBytes)
		} else {
			return fmt.Errorf("FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set and key file not found: %w", err)
		}
	}

	// JSONを検証（改行や空白を除去して正規化）
	var keyJSON map[string]interface{}
	if err := json.Unmarshal([]byte(serviceAccountKey), &keyJSON); err != nil {
		return fmt.Errorf("invalid JSON in FIREBASE_SERVICE_ACCOUNT_KEY: %w", err)
	}
	normalizedKey, err := json.Marshal(keyJSON)
	if err != nil {
		return fmt.Errorf("error normalizing JSON: %w", err)
	}

	// Firebase Admin SDKを初期化
	opt := option.WithCredentialsJSON(normalizedKey)
	app, err := firebase.NewApp(context.Background(), nil, opt)
	if err != nil {
		return fmt.Errorf("error initializing Firebase app: %w", err)
	}

	// FCMクライアントを取得
	fcmClient, err = app.Messaging(context.Background())
	if err != nil {
		return fmt.Errorf("error getting FCM client: %w", err)
	}

	return nil
}

// SendNotification FCMを使ってプッシュ通知を送信
func SendNotification(token string, title string, body string, data map[string]string) error {
	if fcmClient == nil {
		return fmt.Errorf("FCM client is not initialized")
	}

	message := &messaging.Message{
		Token: token,
		Notification: &messaging.Notification{
			Title: title,
			Body:  body,
		},
		Data: data,
		Webpush: &messaging.WebpushConfig{
			Notification: &messaging.WebpushNotification{
				Title: title,
				Body:  body,
				Icon:  "/icons/icon-192x192.png",
			},
		},
	}

	_, err := fcmClient.Send(context.Background(), message)
	if err != nil {
		return fmt.Errorf("error sending notification: %w", err)
	}

	return nil
}

// SendNotificationToMultiple 複数のトークンに通知を送信
func SendNotificationToMultiple(tokens []string, title string, body string, data map[string]string) error {
	if fcmClient == nil {
		return fmt.Errorf("FCM client is not initialized")
	}

	messages := make([]*messaging.Message, len(tokens))
	for i, token := range tokens {
		messages[i] = &messaging.Message{
			Token: token,
			Notification: &messaging.Notification{
				Title: title,
				Body:  body,
			},
			Data: data,
			Webpush: &messaging.WebpushConfig{
				Notification: &messaging.WebpushNotification{
					Title: title,
					Body:  body,
					Icon:  "/icons/icon-192x192.png",
				},
			},
		}
	}

	_, err := fcmClient.SendAll(context.Background(), messages)
	if err != nil {
		return fmt.Errorf("error sending notifications: %w", err)
	}

	return nil
}

// ValidateToken トークンが有効かどうかを確認
func ValidateToken(token string) bool {
	if fcmClient == nil {
		return false
	}

	// テストメッセージを送信してトークンの有効性を確認
	message := &messaging.Message{
		Token: token,
		Data:  map[string]string{"test": "true"},
	}

	_, err := fcmClient.Send(context.Background(), message)
	return err == nil
}
