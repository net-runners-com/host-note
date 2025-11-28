package main

import (
	"fmt"
	"log"

	"github.com/hostnote/server/internal/config"
	"github.com/hostnote/server/internal/database"
	"github.com/hostnote/server/internal/models"
)

func main() {
	if err := config.Load(); err != nil {
		log.Fatalf("failed to load config: %v", err)
	}

	db, err := database.Connect()
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}

	var userCount, castCount, himeCount, tableCount, scheduleCount, visitCount int64

	db.Model(&models.User{}).Count(&userCount)
	db.Model(&models.Cast{}).Count(&castCount)
	db.Model(&models.Hime{}).Count(&himeCount)
	db.Model(&models.TableRecord{}).Count(&tableCount)
	db.Model(&models.Schedule{}).Count(&scheduleCount)
	db.Model(&models.VisitRecord{}).Count(&visitCount)

	fmt.Println("📊 データベース内のデータ数:")
	fmt.Printf("  ユーザー: %d\n", userCount)
	fmt.Printf("  キャスト: %d\n", castCount)
	fmt.Printf("  姫: %d\n", himeCount)
	fmt.Printf("  卓記録: %d\n", tableCount)
	fmt.Printf("  スケジュール: %d\n", scheduleCount)
	fmt.Printf("  来店記録: %d\n", visitCount)

	if userCount > 0 {
		var demoUser models.User
		if err := db.Where("username = ?", "demo").First(&demoUser).Error; err == nil {
			fmt.Printf("\n✅ デモユーザーが見つかりました: %s (ID: %d)\n", demoUser.Username, demoUser.ID)
			if demoUser.Email != nil {
				fmt.Printf("   メールアドレス: %s\n", *demoUser.Email)
			}
		}
	}

	if castCount > 0 {
		var casts []models.Cast
		db.Limit(3).Find(&casts)
		fmt.Printf("\n📋 キャスト一覧（最初の3件）:\n")
		for _, c := range casts {
			fmt.Printf("  - %s (ID: %d)\n", c.Name, c.ID)
		}
	}

	if himeCount > 0 {
		var himes []models.Hime
		db.Limit(3).Find(&himes)
		fmt.Printf("\n👑 姫一覧（最初の3件）:\n")
		for _, h := range himes {
			fmt.Printf("  - %s (ID: %d)\n", h.Name, h.ID)
		}
	}
}
