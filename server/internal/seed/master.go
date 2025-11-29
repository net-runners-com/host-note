package seed

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"

	"github.com/hostnote/server/internal/models"
	"gorm.io/gorm"
)

// MasterData マスタデータの構造
type MasterData struct {
	Settings []interface{} `json:"settings"`
	Menus    []struct {
		ID        uint    `json:"id"`
		Name      string  `json:"name"`
		Price     float64 `json:"price"`
		Category  string  `json:"category"`
		Order     int     `json:"order"`
		CreatedAt string  `json:"createdAt"`
		UpdatedAt string  `json:"updatedAt"`
	} `json:"menus"`
	Options map[string]interface{} `json:"options"`
}

// RunMasterData マスターデータをシードする
func RunMasterData(db *gorm.DB, opts Options) error {
	return db.Transaction(func(tx *gorm.DB) error {
		// Settingsをシード
		if err := ensureSettings(tx); err != nil {
			return err
		}

		// Menusをシード
		if err := ensureMenus(tx); err != nil {
			return err
		}

		log.Println("✅ Master data seeding completed")
		return nil
	})
}

// ensureSettings マスタデータからSettingsを読み込んでシードする
func ensureSettings(db *gorm.DB) error {
	var count int64
	if err := db.Model(&models.Setting{}).Count(&count).Error; err != nil {
		return err
	}

	// Settingsが既に存在する場合はスキップ
	if count > 0 {
		log.Println("• Settings already exist, skipping")
		return nil
	}

	// マスタデータから読み込む
	masterData, err := loadMasterData()
	if err != nil {
		log.Printf("⚠️  Failed to load master data: %v, using default settings", err)
		// フォールバック: デフォルトのSettingsを追加
		defaultSettings := []models.Setting{
			{Key: "iceOptions", Value: `["少なめ","普通","多め"]`},
			{Key: "tobaccoOptions", Value: `["吸わない","紙巻き","加熱式","電子タバコ"]`},
		}
		if err := db.Create(&defaultSettings).Error; err != nil {
			return err
		}
		log.Printf("• Created %d default settings", len(defaultSettings))
		return nil
	}

	settings := make([]models.Setting, 0)

	// Settingsをシード
	if len(masterData.Settings) > 0 {
		for _, s := range masterData.Settings {
			settingMap, ok := s.(map[string]interface{})
			if !ok {
				continue
			}
			key, _ := settingMap["key"].(string)
			value, _ := settingMap["value"].(string)
			if key != "" {
				settings = append(settings, models.Setting{
					Key:   key,
					Value: value,
				})
			}
		}
	}

	// OptionsをSettingsとしてシード
	if masterData.Options != nil && len(masterData.Options) > 0 {
		for key, value := range masterData.Options {
			// valueをJSON文字列に変換
			valueJSON, err := json.Marshal(value)
			if err != nil {
				log.Printf("⚠️  Failed to marshal option %s: %v", key, err)
				continue
			}
			settings = append(settings, models.Setting{
				Key:   key,
				Value: string(valueJSON),
			})
		}
	}

	// Settingsを一括作成
	if len(settings) > 0 {
		if err := db.Create(&settings).Error; err != nil {
			return err
		}
		log.Printf("• Created %d settings from master data (including options)", len(settings))
	}

	return nil
}

// ensureMenus マスタデータからMenusを読み込んでシードする
func ensureMenus(db *gorm.DB) error {
	var count int64
	if err := db.Model(&models.Menu{}).Count(&count).Error; err != nil {
		return err
	}

	// メニューが既に存在する場合はスキップ
	if count > 0 {
		log.Println("• Menus already exist, skipping")
		return nil
	}

	// マスタデータから読み込む
	menus, err := loadMenusFromMasterData()
	if err != nil {
		log.Printf("⚠️  Failed to load menus from master data: %v, using default menus", err)
		// フォールバック: デフォルトのメニューアイテムを追加（共通データ）
		menus = []models.Menu{
			// ボトル系（5000円）
			{Name: "鏡月", Price: 5000, Category: "ボトル系", Order: 1},
			{Name: "Japan", Price: 5000, Category: "ボトル系", Order: 2},
			{Name: "吉四六", Price: 5000, Category: "ボトル系", Order: 3},
			{Name: "Jinro", Price: 5000, Category: "ボトル系", Order: 4},

			// 缶もの（2000円）
			{Name: "氷結 レモン", Price: 2000, Category: "缶もの", Order: 1},
			{Name: "氷結 グレープフルーツ", Price: 2000, Category: "缶もの", Order: 2},
			{Name: "淡麗 グリーン", Price: 2000, Category: "缶もの", Order: 3},
			{Name: "淡麗 ブルー", Price: 2000, Category: "缶もの", Order: 4},
			{Name: "ほろよい グレープ", Price: 2000, Category: "缶もの", Order: 5},
			{Name: "ほろよい カルピス", Price: 2000, Category: "缶もの", Order: 6},
			{Name: "リアルゴールド", Price: 2000, Category: "缶もの", Order: 7},

			// 割物（1000円）
			{Name: "水", Price: 0, Category: "割物", Order: 1},
			{Name: "ウーロン茶", Price: 1000, Category: "割物", Order: 2},
			{Name: "緑茶", Price: 1000, Category: "割物", Order: 3},
			{Name: "午後の紅茶 ミルクティー", Price: 1000, Category: "割物", Order: 4},
			{Name: "午後の紅茶 レモンティー", Price: 1000, Category: "割物", Order: 5},
			{Name: "ジャスミン茶", Price: 1000, Category: "割物", Order: 6},

			// フード系 1000円
			{Name: "乾き物", Price: 1000, Category: "フード系", Order: 1},
			{Name: "だし巻き卵", Price: 1000, Category: "フード系", Order: 2},
			{Name: "味噌汁2杯", Price: 1000, Category: "フード系", Order: 3},
			{Name: "若鶏レバー250g", Price: 1000, Category: "フード系", Order: 4},
			{Name: "白レバー250g", Price: 1000, Category: "フード系", Order: 5},
			{Name: "手羽もと5本", Price: 1000, Category: "フード系", Order: 6},
			{Name: "馬刺し赤身50g", Price: 1000, Category: "フード系", Order: 7},
			{Name: "焼きそば135g", Price: 1000, Category: "フード系", Order: 8},
			{Name: "焼きうどん200g", Price: 1000, Category: "フード系", Order: 9},
			{Name: "枝豆200g", Price: 1000, Category: "フード系", Order: 10},
			{Name: "ポップコーン", Price: 1000, Category: "フード系", Order: 11},
			{Name: "モツ煮310g", Price: 1000, Category: "フード系", Order: 12},
			{Name: "鳥のたたき(親)100g", Price: 1000, Category: "フード系", Order: 13},
			{Name: "鳥のたたき150g", Price: 1000, Category: "フード系", Order: 14},
			{Name: "砂ずり(バジル)150g", Price: 1000, Category: "フード系", Order: 15},
			{Name: "米×2", Price: 1000, Category: "フード系", Order: 16},
			{Name: "うどん×4", Price: 1000, Category: "フード系", Order: 17},

			// フード系 2000円
			{Name: "ペンネ100g", Price: 2000, Category: "フード系", Order: 18},
			{Name: "米 200g", Price: 2000, Category: "フード系", Order: 19},
			{Name: "うどん各種200g", Price: 2000, Category: "フード系", Order: 20},
			{Name: "パスタ100g", Price: 2000, Category: "フード系", Order: 21},
			{Name: "フライドポテト300g", Price: 2000, Category: "フード系", Order: 22},
			{Name: "鰹のタタキ約200g", Price: 2000, Category: "フード系", Order: 23},
			{Name: "手羽元10本", Price: 2000, Category: "フード系", Order: 24},

			// フード系 3000円
			{Name: "オムライス", Price: 3000, Category: "フード系", Order: 25},
			{Name: "鰹のタタキ約280g", Price: 3000, Category: "フード系", Order: 26},

			// フード系 200円（焼き鳥各種）
			{Name: "焼き鳥 とりもも", Price: 200, Category: "フード系", Order: 27},
			{Name: "焼き鳥 ねぎま", Price: 200, Category: "フード系", Order: 28},
			{Name: "焼き鳥 鶏皮", Price: 200, Category: "フード系", Order: 29},

			// その他
			{Name: "場内", Price: 1000, Category: "その他", Order: 1},
			{Name: "飲み放題プラン 男女ペア(2名様) 1時間", Price: 10000, Category: "その他", Order: 2},
			{Name: "飲み放題プラン 男女ペア(2名様) 延長", Price: 5000, Category: "その他", Order: 3},
			{Name: "飲み放題プラン 男性おひとり様", Price: 8000, Category: "その他", Order: 4},
			{Name: "初回料金", Price: 0, Category: "その他", Order: 5},
			{Name: "再訪プラン（初回料金+再訪料金）", Price: 5000, Category: "その他", Order: 6},
		}
	}

	if err := db.Create(&menus).Error; err != nil {
		return err
	}

	log.Printf("• Created %d menu items", len(menus))
	return nil
}

// loadMasterData マスタデータファイルを読み込む
func loadMasterData() (*MasterData, error) {
	// マスタデータファイルのパスを取得
	// server/cmd/seed から実行される場合、../../init/master_data.json
	// server から実行される場合、init/master_data.json
	var masterDataPath string
	if wd, err := os.Getwd(); err == nil {
		if filepath.Base(wd) == "seed" {
			masterDataPath = filepath.Join(wd, "../../init/master_data.json")
		} else if filepath.Base(wd) == "server" {
			masterDataPath = filepath.Join(wd, "init/master_data.json")
		} else {
			masterDataPath = filepath.Join(wd, "server/init/master_data.json")
		}
	} else {
		masterDataPath = "server/init/master_data.json"
	}

	// 絶対パスに変換
	masterDataPath, err := filepath.Abs(masterDataPath)
	if err != nil {
		return nil, fmt.Errorf("failed to get absolute path: %w", err)
	}

	// ファイルを読み込む
	data, err := os.ReadFile(masterDataPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read master data file: %w", err)
	}

	// JSONをパース
	var masterData MasterData
	if err := json.Unmarshal(data, &masterData); err != nil {
		return nil, fmt.Errorf("failed to parse master data JSON: %w", err)
	}

	log.Printf("• Loaded master data from: %s", masterDataPath)
	return &masterData, nil
}

// loadMenusFromMasterData マスタデータからメニューを読み込む
func loadMenusFromMasterData() ([]models.Menu, error) {
	masterData, err := loadMasterData()
	if err != nil {
		return nil, err
	}

	// Menuモデルに変換
	menus := make([]models.Menu, len(masterData.Menus))
	for i, m := range masterData.Menus {
		menus[i] = models.Menu{
			Name:     m.Name,
			Price:    m.Price,
			Category: m.Category,
			Order:    m.Order,
		}
	}

	log.Printf("• Loaded %d menus from master data", len(menus))
	return menus, nil
}
