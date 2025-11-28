package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"time"

	"github.com/hostnote/server/internal/config"
	"github.com/hostnote/server/internal/database"
	"github.com/hostnote/server/internal/models"
)

type MasterData struct {
	Settings   []models.Setting       `json:"settings"`
	Menus      []models.Menu          `json:"menus"`
	Options    map[string]interface{} `json:"options"` // 選択肢データ（デフォルト値）
	ExportedAt time.Time              `json:"exportedAt"`
}

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

	// マスターデータを取得
	masterData := MasterData{
		ExportedAt: time.Now(),
	}

	// Settingデータを取得（選択肢データを含む）
	var settings []models.Setting
	if err := db.Find(&settings).Error; err != nil {
		log.Fatalf("Failed to fetch settings: %v", err)
	}
	masterData.Settings = settings

	// 選択肢データのデフォルト値を設定（Settingテーブルにデータがない場合のフォールバック）
	// analysisTypeOptions, periodOptions, sortOptionsはデータベースで管理しない（フロントエンドのデフォルト値）
	masterData.Options = map[string]interface{}{
		"drinkPreferenceOptions": []string{"超薄め", "薄め", "普通", "濃いめ", "超濃いめ"},
		"iceOptions":             []string{"1個", "2~3個", "満タン"},
		"carbonationOptions":     []string{"OK", "NG"},
		"tobaccoTypeOptions":     []string{"紙タバコ", "アイコス", "両方"},
		"visitTypeOptions": []map[string]string{
			{"value": "normal", "label": "通常"},
			{"value": "first", "label": "初回"},
			{"value": "shimei", "label": "指名あり"},
		},
	}

	// Settingテーブルから取得したデータがあれば、それで上書き
	for _, setting := range settings {
		switch setting.Key {
		case "drinkPreferenceOptions", "iceOptions", "carbonationOptions", "tobaccoTypeOptions":
			var arr []string
			if err := json.Unmarshal([]byte(setting.Value), &arr); err == nil {
				masterData.Options[setting.Key] = arr
			}
		case "visitTypeOptions":
			var arr []map[string]string
			if err := json.Unmarshal([]byte(setting.Value), &arr); err == nil {
				masterData.Options[setting.Key] = arr
			}
		}
	}

	// デバッグ: Settingデータの件数とキーを表示
	fmt.Printf("📋 Settingデータ: %d件\n", len(settings))
	if len(settings) > 0 {
		fmt.Println("   キー一覧:")
		for _, s := range settings {
			fmt.Printf("   - %s\n", s.Key)
		}
	}

	// Menuデータを取得（共通データ）
	var menus []models.Menu
	if err := db.Find(&menus).Error; err != nil {
		log.Fatalf("Failed to fetch menus: %v", err)
	}
	masterData.Menus = menus

	// JSONに変換
	jsonData, err := json.MarshalIndent(masterData, "", "  ")
	if err != nil {
		log.Fatalf("Failed to marshal JSON: %v", err)
	}

	// ファイルに出力（workspaceのルートディレクトリ）
	var outputFile string
	if len(os.Args) > 1 {
		outputFile = os.Args[1]
	} else {
		// デフォルトはworkspaceのルートディレクトリ
		// 現在のディレクトリからworkspaceルートを探す
		wd, err := os.Getwd()
		if err != nil {
			log.Fatalf("Failed to get working directory: %v", err)
		}

		// server/cmd/export から実行される場合、../../.. でworkspaceルートに到達
		// または絶対パス /workspace を使用
		if filepath.Base(wd) == "export" {
			// cmd/export から実行
			outputFile = filepath.Join(wd, "../../../master_data.json")
		} else if filepath.Base(wd) == "server" {
			// server から実行
			outputFile = filepath.Join(wd, "../master_data.json")
		} else {
			// その他の場合は /workspace を直接使用
			outputFile = "/workspace/master_data.json"
		}
		// パスを正規化
		outputFile, _ = filepath.Abs(outputFile)
	}

	if err := os.WriteFile(outputFile, jsonData, 0644); err != nil {
		log.Fatalf("Failed to write file: %v", err)
	}

	fmt.Printf("✅ マスターデータをエクスポートしました: %s\n", outputFile)
	fmt.Printf("   - Settings: %d件\n", len(settings))
	fmt.Printf("   - Menus: %d件\n", len(menus))
	fmt.Printf("   - Options: %d種類（選択肢データ）\n", len(masterData.Options))
}
