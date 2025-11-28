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

	// メニューの数を確認
	var menuCount int64
	if err := db.Model(&models.Menu{}).Count(&menuCount).Error; err != nil {
		log.Fatalf("failed to count menus: %v", err)
	}
	fmt.Printf("メニュー数: %d\n", menuCount)

	// カテゴリ別のメニュー数を確認
	type CategoryCount struct {
		Category string
		Count    int64
	}
	var categoryCounts []CategoryCount
	if err := db.Model(&models.Menu{}).
		Select("category, COUNT(*) as count").
		Group("category").
		Scan(&categoryCounts).Error; err != nil {
		log.Fatalf("failed to count menus by category: %v", err)
	}
	fmt.Println("\nカテゴリ別メニュー数:")
	for _, cc := range categoryCounts {
		fmt.Printf("  %s: %d\n", cc.Category, cc.Count)
	}

	// ボトル系と缶もののメニューを表示
	var drinkMenus []models.Menu
	if err := db.Where("category IN (?, ?)", "ボトル系", "缶もの").
		Order("category, `order`").
		Limit(10).
		Find(&drinkMenus).Error; err != nil {
		log.Fatalf("failed to get drink menus: %v", err)
	}
	fmt.Println("\nボトル系・缶ものメニュー（最初の10件）:")
	for _, menu := range drinkMenus {
		fmt.Printf("  ID: %d, 名前: %s, カテゴリ: %s\n", menu.ID, menu.Name, menu.Category)
	}

	// Castのfavorite_drink_idを確認
	var castCount int64
	var castWithDrink int64
	if err := db.Model(&models.Cast{}).Count(&castCount).Error; err != nil {
		log.Fatalf("failed to count casts: %v", err)
	}
	if err := db.Model(&models.Cast{}).Where("favorite_drink_id IS NOT NULL").Count(&castWithDrink).Error; err != nil {
		log.Fatalf("failed to count casts with drink: %v", err)
	}
	fmt.Printf("\nキャスト数: %d (好きなお酒が設定されている: %d)\n", castCount, castWithDrink)

	// Himeのfavorite_drink_idを確認
	var himeCount int64
	var himeWithDrink int64
	if err := db.Model(&models.Hime{}).Count(&himeCount).Error; err != nil {
		log.Fatalf("failed to count himes: %v", err)
	}
	if err := db.Model(&models.Hime{}).Where("favorite_drink_id IS NOT NULL").Count(&himeWithDrink).Error; err != nil {
		log.Fatalf("failed to count himes with drink: %v", err)
	}
	fmt.Printf("姫数: %d (好きなお酒が設定されている: %d)\n", himeCount, himeWithDrink)
}
