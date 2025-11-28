package seed

import (
	"fmt"
	"log"
	"strings"

	"gorm.io/gorm"
)

// Options controls how seeding is executed.
type Options struct {
	Force bool
}

// Run populates the database with both master data and demo data.
// This is the default behavior for backward compatibility.
func Run(db *gorm.DB, opts Options) error {
	if opts.Force {
		log.Println("⚠️  Force option enabled: truncating all tables before seeding")
		if err := truncateAllTables(db); err != nil {
			return fmt.Errorf("truncate all tables: %w", err)
		}
	}

	// マスターデータを先にシード
	if err := RunMasterData(db, Options{Force: false}); err != nil {
		return fmt.Errorf("seed master data: %w", err)
	}

	// テストデータをシード
	if err := RunDemoData(db, Options{Force: false}); err != nil {
		return fmt.Errorf("seed demo data: %w", err)
	}

	log.Println("✅ All seeding completed")
	return nil
}

// truncateAllTables すべてのテーブルを削除（マスターデータとテストデータの両方）
func truncateAllTables(db *gorm.DB) error {
	// 外部キー制約を無効化
	if err := db.Exec("SET FOREIGN_KEY_CHECKS = 0").Error; err != nil {
		return err
	}

	// すべてのテーブルを削除
	tables := []string{
		"table_cast",
		"table_hime",
		"table_record",
		"visit_record",
		"schedule",
		"push_tokens",
		"oauth_account",
		"setting",
		"menu",
		"hime",
		"cast",
		"user",
	}

	for _, table := range tables {
		// DELETE FROMを使用（TRUNCATEは外部キー制約があると失敗する場合がある）
		if err := db.Exec(fmt.Sprintf("DELETE FROM %s", table)).Error; err != nil {
			// テーブルが存在しない場合はスキップ
			if strings.Contains(err.Error(), "doesn't exist") {
				log.Printf("⚠️  Skipping delete for %s: %v", table, err)
				continue
			}
			return err
		}
	}

	// 外部キー制約を再有効化
	return db.Exec("SET FOREIGN_KEY_CHECKS = 1").Error
}
