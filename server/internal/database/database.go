package database

import (
	"fmt"
	"log"
	"strings"

	"github.com/hostnote/server/internal/config"
	"github.com/hostnote/server/internal/models"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// Connect データベースに接続
func Connect() (*gorm.DB, error) {
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		config.AppConfig.DBUser,
		config.AppConfig.DBPassword,
		config.AppConfig.DBHost,
		config.AppConfig.DBPort,
		config.AppConfig.DBName,
	)

	var err error
	DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})

	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	// コネクションプールの設定
	sqlDB, err := DB.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get database instance: %w", err)
	}

	// コネクションプールの最適化
	sqlDB.SetMaxIdleConns(25)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(300) // 5分
	sqlDB.SetConnMaxIdleTime(60)  // 1分

	return DB, nil
}

// Migrate マイグレーションを実行
func Migrate(db *gorm.DB) error {
	// まずテーブルを作成（AutoMigrate）
	if err := db.AutoMigrate(
		&models.User{},
		&models.OAuthAccount{},
		&models.Hime{},
		&models.Cast{},
		&models.TableRecord{},
		&models.TableHime{},
		&models.TableCast{},
		&models.Schedule{},
		&models.VisitRecord{},
		&models.Setting{},
		&models.PushToken{},
		&models.Menu{},
	); err != nil {
		return fmt.Errorf("failed to auto migrate: %w", err)
	}

	// 既存データのマイグレーション（テーブルが存在する場合のみ）
	// エラーが発生しても続行（既存データがない場合は正常）
	if err := migrateExistingData(db); err != nil {
		log.Printf("Warning: failed to migrate existing data (this is normal for new deployments): %v", err)
	}

	// オプション処理（エラーが発生しても続行）
	_ = removeMenuUserID(db)                // menuテーブルからuser_idカラムを削除
	_ = makePasswordNullable(db)            // userテーブルのpasswordカラムをNULL許可に変更
	_ = addOAuthAccountUniqueConstraint(db) // OAuthAccountテーブルに複合ユニーク制約を追加

	return nil
}

// migrateExistingData 既存データのuser_idを設定（既存データがある場合のみ）
func migrateExistingData(db *gorm.DB) error {
	// テーブルが存在しない場合はスキップ（初回デプロイ時）
	if !db.Migrator().HasTable(&models.User{}) {
		return nil
	}

	// 最初のユーザーを取得
	var user models.User
	if err := db.First(&user).Error; err != nil {
		// ユーザーが存在しない場合は既存データがないのでスキップ
		if err == gorm.ErrRecordNotFound {
			return nil
		}
		return fmt.Errorf("failed to get first user: %w", err)
	}

	userID := user.ID
	if userID == 0 {
		return nil
	}

	// 各テーブルに対してuser_idカラムを追加・更新（エラーが発生しても続行）
	tables := []string{"hime", "table_record", "visit_record", "schedule"}
	for _, tableName := range tables {
		if err := migrateTableUserID(db, tableName, userID); err != nil {
			log.Printf("Warning: failed to migrate %s: %v", tableName, err)
			// エラーが発生しても続行
		}
	}

	return nil
}

// migrateTableUserID テーブルのuser_idカラムを追加・更新（既存データがある場合のみ）
func migrateTableUserID(db *gorm.DB, tableName string, userID uint) error {
	// テーブルが存在しない場合はスキップ
	if !db.Migrator().HasTable(tableName) {
		return nil
	}

	// カラムの存在確認（エラーが発生しても続行）
	hasColumn, err := hasColumn(db, tableName, "user_id")
	if err != nil {
		return fmt.Errorf("failed to check column: %w", err)
	}

	// カラムが存在しない場合は追加
	if !hasColumn {
		if err := addUserIDColumn(db, tableName); err != nil {
			return fmt.Errorf("failed to add column: %w", err)
		}
		// すべてのレコードにuser_idを設定
		if err := updateAllRecordsUserID(db, tableName, userID); err != nil {
			return fmt.Errorf("failed to update records: %w", err)
		}
	} else {
		// カラムが存在する場合、無効なuser_idを修正（エラーが発生しても続行）
		_ = fixInvalidUserID(db, tableName, userID)
	}

	// NOT NULL制約を追加（エラーが発生しても続行）
	_ = setNotNullConstraint(db, tableName, "user_id")

	return nil
}

// hasColumn カラムの存在確認
func hasColumn(db *gorm.DB, tableName, columnName string) (bool, error) {
	var count int64
	query := `SELECT COUNT(*) FROM information_schema.COLUMNS 
		WHERE TABLE_SCHEMA = DATABASE() 
		AND TABLE_NAME = ? 
		AND COLUMN_NAME = ?`
	if err := db.Raw(query, tableName, columnName).Scan(&count).Error; err != nil {
		return false, err
	}
	return count > 0, nil
}

// addUserIDColumn user_idカラムを追加
func addUserIDColumn(db *gorm.DB, tableName string) error {
	query := fmt.Sprintf("ALTER TABLE `%s` ADD COLUMN `user_id` BIGINT UNSIGNED NULL", tableName)
	if err := db.Exec(query).Error; err != nil {
		// カラムが既に存在する場合は無視
		if !strings.Contains(err.Error(), "Duplicate column name") {
			return fmt.Errorf("failed to add user_id column to %s: %w", tableName, err)
		}
	}
	return nil
}

// updateAllRecordsUserID すべてのレコードにuser_idを設定
func updateAllRecordsUserID(db *gorm.DB, tableName string, userID uint) error {
	query := fmt.Sprintf("UPDATE `%s` SET `user_id` = ?", tableName)
	if err := db.Exec(query, userID).Error; err != nil {
		return fmt.Errorf("failed to update %s user_id: %w", tableName, err)
	}
	return nil
}

// fixInvalidUserID 無効なuser_idを修正（NULLまたは存在しないユーザーID）
func fixInvalidUserID(db *gorm.DB, tableName string, userID uint) error {
	// テーブル名に応じたエイリアスを使用
	alias := getTableAlias(tableName)
	query := fmt.Sprintf(`
		UPDATE %s %s
		LEFT JOIN user u ON %s.user_id = u.id
		SET %s.user_id = ?
		WHERE %s.user_id IS NULL OR u.id IS NULL
	`, tableName, alias, alias, alias, alias)

	if err := db.Exec(query, userID).Error; err != nil {
		return fmt.Errorf("failed to fix invalid user_id in %s: %w", tableName, err)
	}
	return nil
}

// getTableAlias テーブル名からエイリアスを取得
func getTableAlias(tableName string) string {
	aliases := map[string]string{
		"hime":         "h",
		"table_record": "tr",
		"visit_record": "vr",
		"schedule":     "s",
	}
	if alias, ok := aliases[tableName]; ok {
		return alias
	}
	return "t" // デフォルトエイリアス
}

// setNotNullConstraint NOT NULL制約を追加
func setNotNullConstraint(db *gorm.DB, tableName, columnName string) error {
	// 外部キー制約が存在する場合は一時的に削除
	fkName, hasFK, err := getForeignKeyConstraint(db, tableName, columnName)
	if err != nil {
		return fmt.Errorf("failed to check foreign key constraint: %w", err)
	}

	if hasFK {
		// 外部キー制約を削除
		if err := dropForeignKey(db, tableName, fkName); err != nil {
			// 制約が存在しない場合は無視
			if !strings.Contains(err.Error(), "doesn't exist") {
				return fmt.Errorf("failed to drop foreign key constraint %s: %w", fkName, err)
			}
			hasFK = false // 制約が存在しないので、再作成不要
		}
	}

	// カラムの型を確認して、必要に応じてBIGINT UNSIGNEDに変更
	// user.idはBIGINT UNSIGNEDなので、user_idもBIGINT UNSIGNEDにする必要がある
	var currentType string
	typeQuery := fmt.Sprintf("SELECT DATA_TYPE, COLUMN_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '%s' AND COLUMN_NAME = '%s'", tableName, columnName)
	var typeInfo struct {
		DataType   string
		ColumnType string
	}
	if err := db.Raw(typeQuery).Scan(&typeInfo).Error; err == nil {
		currentType = typeInfo.ColumnType
		// INT UNSIGNEDの場合はBIGINT UNSIGNEDに変更
		if strings.Contains(currentType, "int") && !strings.Contains(currentType, "bigint") {
			// まずNULL許可でBIGINT UNSIGNEDに変更
			alterQuery := fmt.Sprintf("ALTER TABLE `%s` MODIFY COLUMN `%s` BIGINT UNSIGNED NULL", tableName, columnName)
			if err := db.Exec(alterQuery).Error; err != nil {
				return fmt.Errorf("failed to change column type to BIGINT UNSIGNED: %w", err)
			}
		}
	}

	// カラムの型を変更（NOT NULL制約を追加）
	query := fmt.Sprintf("ALTER TABLE `%s` MODIFY COLUMN `%s` BIGINT UNSIGNED NOT NULL", tableName, columnName)
	if err := db.Exec(query).Error; err != nil {
		// 既にNOT NULLの場合は無視
		if !strings.Contains(err.Error(), "doesn't have a default value") &&
			!strings.Contains(err.Error(), "Invalid use of NULL") &&
			!strings.Contains(err.Error(), "incompatible") {
			// エラーが発生した場合、外部キー制約を再作成してからエラーを返す
			if hasFK {
				_ = addForeignKey(db, tableName, columnName, "user", "id", fkName)
			}
			return fmt.Errorf("failed to set NOT NULL on %s.%s: %w", tableName, columnName, err)
		}
	}

	// 外部キー制約を再作成
	if hasFK {
		if err := addForeignKey(db, tableName, columnName, "user", "id", fkName); err != nil {
			// 既に存在する場合は無視
			if !strings.Contains(err.Error(), "Duplicate foreign key") &&
				!strings.Contains(err.Error(), "already exists") &&
				!strings.Contains(err.Error(), "incompatible") {
				return fmt.Errorf("failed to recreate foreign key constraint %s: %w", fkName, err)
			}
		}
	}

	return nil
}

// getForeignKeyConstraint 外部キー制約の存在確認と名前取得
func getForeignKeyConstraint(db *gorm.DB, tableName, columnName string) (string, bool, error) {
	var result struct {
		ConstraintName string
	}
	query := `SELECT CONSTRAINT_NAME as constraint_name
		FROM information_schema.KEY_COLUMN_USAGE
		WHERE TABLE_SCHEMA = DATABASE()
		AND TABLE_NAME = ?
		AND COLUMN_NAME = ?
		AND REFERENCED_TABLE_NAME IS NOT NULL
		LIMIT 1`

	err := db.Raw(query, tableName, columnName).Scan(&result).Error
	if err != nil {
		return "", false, err
	}

	if result.ConstraintName == "" {
		return "", false, nil
	}

	return result.ConstraintName, true, nil
}

// dropForeignKey 外部キー制約を削除
func dropForeignKey(db *gorm.DB, tableName, constraintName string) error {
	query := fmt.Sprintf("ALTER TABLE `%s` DROP FOREIGN KEY `%s`", tableName, constraintName)
	return db.Exec(query).Error
}

// addForeignKey 外部キー制約を追加
func addForeignKey(db *gorm.DB, tableName, columnName, refTable, refColumn, constraintName string) error {
	query := fmt.Sprintf(
		"ALTER TABLE `%s` ADD CONSTRAINT `%s` FOREIGN KEY (`%s`) REFERENCES `%s` (`%s`) ON DELETE RESTRICT ON UPDATE CASCADE",
		tableName, constraintName, columnName, refTable, refColumn,
	)
	return db.Exec(query).Error
}

// dropHostTable hostテーブルを削除
// removeMenuUserID menuテーブルからuser_idカラムを削除
func removeMenuUserID(db *gorm.DB) error {
	// テーブルが存在しない場合はスキップ
	if !db.Migrator().HasTable("menu") {
		return nil
	}

	// カラムの存在確認（エラーが発生しても続行）
	hasColumn, err := hasColumn(db, "menu", "user_id")
	if err != nil {
		return nil // エラーが発生しても続行
	}

	if hasColumn {
		// 外部キー制約がある場合は削除
		type FKInfo struct {
			ConstraintName   string
			ColumnName       string
			ReferencedTable  string
			ReferencedColumn string
		}
		var fks []FKInfo
		fkQuery := `
			SELECT 
				CONSTRAINT_NAME as constraint_name,
				COLUMN_NAME as column_name,
				REFERENCED_TABLE_NAME as referenced_table,
				REFERENCED_COLUMN_NAME as referenced_column
			FROM information_schema.KEY_COLUMN_USAGE
			WHERE TABLE_SCHEMA = DATABASE()
			AND TABLE_NAME = 'menu'
			AND COLUMN_NAME = 'user_id'
			AND REFERENCED_TABLE_NAME IS NOT NULL
		`
		if err := db.Raw(fkQuery).Scan(&fks).Error; err == nil {
			for _, fk := range fks {
				if err := dropForeignKey(db, "menu", fk.ConstraintName); err != nil {
					if !strings.Contains(err.Error(), "doesn't exist") {
						return fmt.Errorf("failed to drop foreign key %s: %w", fk.ConstraintName, err)
					}
				}
			}
		}

		// インデックスを削除（存在確認してから削除）
		var indexCount int64
		indexCheckQuery := `SELECT COUNT(*) FROM information_schema.STATISTICS 
			WHERE TABLE_SCHEMA = DATABASE() 
			AND TABLE_NAME = 'menu' 
			AND INDEX_NAME = 'idx_menu_user_id'`
		if err := db.Raw(indexCheckQuery).Scan(&indexCount).Error; err == nil && indexCount > 0 {
			if err := db.Exec("ALTER TABLE `menu` DROP INDEX `idx_menu_user_id`").Error; err != nil {
				// エラーを無視（インデックスが存在しない場合）
				if !strings.Contains(err.Error(), "doesn't exist") && !strings.Contains(err.Error(), "Unknown key") {
					return fmt.Errorf("failed to drop index: %w", err)
				}
			}
		}

		// カラムを削除
		if err := db.Exec("ALTER TABLE `menu` DROP COLUMN `user_id`").Error; err != nil {
			return fmt.Errorf("failed to drop user_id column from menu: %w", err)
		}
	}

	return nil
}

// makePasswordNullable userテーブルのpasswordカラムをNULL許可に変更
func makePasswordNullable(db *gorm.DB) error {
	// テーブルが存在しない場合はスキップ
	if !db.Migrator().HasTable(&models.User{}) {
		return nil
	}

	// カラムが存在するか確認（エラーが発生しても続行）
	var exists bool
	checkQuery := "SELECT COUNT(*) > 0 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user' AND COLUMN_NAME = 'password'"
	if err := db.Raw(checkQuery).Scan(&exists).Error; err != nil {
		return nil // エラーが発生しても続行
	}

	if !exists {
		// カラムが存在しない場合は何もしない（AutoMigrateで作成される）
		return nil
	}

	// 現在のカラム定義を確認
	var currentType string
	typeQuery := "SELECT COLUMN_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user' AND COLUMN_NAME = 'password'"
	if err := db.Raw(typeQuery).Scan(&currentType).Error; err != nil {
		return fmt.Errorf("failed to get password column type: %w", err)
	}

	// NULL許可に変更（既にNULL許可の場合は何もしない）
	if strings.Contains(strings.ToUpper(currentType), "NULL") {
		return nil
	}

	// VARCHAR(255) NULLに変更
	alterQuery := "ALTER TABLE `user` MODIFY COLUMN `password` VARCHAR(255) NULL"
	if err := db.Exec(alterQuery).Error; err != nil {
		// 既にNULL許可の場合は無視
		if !strings.Contains(err.Error(), "Duplicate") && !strings.Contains(err.Error(), "already") {
			return fmt.Errorf("failed to make password nullable: %w", err)
		}
	}

	return nil
}

// addOAuthAccountUniqueConstraint OAuthAccountテーブルに複合ユニーク制約を追加
func addOAuthAccountUniqueConstraint(db *gorm.DB) error {
	// テーブルが存在しない場合はスキップ
	if !db.Migrator().HasTable(&models.OAuthAccount{}) {
		return nil
	}

	// 既存のインデックスを確認（エラーが発生しても続行）
	var indexExists bool
	checkQuery := "SELECT COUNT(*) > 0 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'oauth_account' AND INDEX_NAME = 'idx_oauth_account_provider_provider_id'"
	if err := db.Raw(checkQuery).Scan(&indexExists).Error; err != nil {
		return nil // エラーが発生しても続行
	}

	if indexExists {
		// 既に存在する場合は何もしない
		return nil
	}

	// 複合ユニーク制約を追加
	alterQuery := "ALTER TABLE `oauth_account` ADD UNIQUE INDEX `idx_oauth_account_provider_provider_id` (`provider`, `provider_id`)"
	if err := db.Exec(alterQuery).Error; err != nil {
		// 既に存在する場合は無視
		if !strings.Contains(err.Error(), "Duplicate") && !strings.Contains(err.Error(), "already exists") {
			return fmt.Errorf("failed to add unique constraint: %w", err)
		}
	}

	return nil
}
