package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DBHost             string
	DBPort             string
	DBUser             string
	DBPassword         string
	DBName             string
	Port               string
	Env                string
	GoogleClientID     string
	GoogleClientSecret string
	GoogleRedirectURL  string
}

var AppConfig *Config

func Load() error {
	// .envファイルを読み込む（存在しない場合は無視）
	// カレントディレクトリと親ディレクトリの両方を試す
	_ = godotenv.Load(".env")
	_ = godotenv.Load("../.env")
	_ = godotenv.Load("../../.env")

	googleClientID := getEnv("GOOGLE_CLIENT_ID", "")
	googleClientSecret := getEnv("GOOGLE_CLIENT_SECRET", "")

	AppConfig = &Config{
		DBHost:             getEnv("MYSQL_HOST", "localhost"),
		DBPort:             getEnv("MYSQL_PORT", "3306"),
		DBUser:             getEnv("MYSQL_USER", "hostnote"),
		DBPassword:         getEnv("MYSQL_PASSWORD", "hostnote_dev"),
		DBName:             getEnv("MYSQL_DATABASE", "hostnote"),
		Port:               getEnv("PORT", "8080"),
		Env:                getEnv("GIN_MODE", "debug"),
		GoogleClientID:     googleClientID,
		GoogleClientSecret: googleClientSecret,
		GoogleRedirectURL:  getEnv("GOOGLE_REDIRECT_URL", "http://localhost:8080/api/v1/auth/google/callback"),
	}

	// デバッグログ（本番環境では削除）
	if googleClientID != "" {
		log.Printf("✅ Google OAuth configured (ClientID: %s...)", googleClientID[:20])
	} else {
		log.Printf("⚠️  Google OAuth not configured (GOOGLE_CLIENT_ID is empty)")
	}

	return nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
