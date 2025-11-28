package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"

	"github.com/hostnote/server/internal/config"
	"github.com/hostnote/server/internal/database"
)

type TableSchema struct {
	TableName   string                 `json:"tableName"`
	Columns     []ColumnInfo           `json:"columns"`
	Indexes     []IndexInfo            `json:"indexes"`
	ForeignKeys []ForeignKeyInfo       `json:"foreignKeys"`
}

type ColumnInfo struct {
	Field      string `json:"field"`
	Type       string `json:"type"`
	Null       string `json:"null"`
	Key        string `json:"key"`
	Default    string `json:"default"`
	Extra      string `json:"extra"`
}

type IndexInfo struct {
	KeyName    string `json:"keyName"`
	ColumnName string `json:"columnName"`
	NonUnique  int    `json:"nonUnique"`
}

type ForeignKeyInfo struct {
	ConstraintName string `json:"constraintName"`
	ColumnName     string `json:"columnName"`
	ReferencedTable string `json:"referencedTable"`
	ReferencedColumn string `json:"referencedColumn"`
}

type DatabaseSchema struct {
	Tables []TableSchema `json:"tables"`
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

	// すべてのテーブル名を取得
	var tableNames []string
	if err := db.Raw("SHOW TABLES").Scan(&tableNames).Error; err != nil {
		log.Fatalf("Failed to get table names: %v", err)
	}

	schema := DatabaseSchema{
		Tables: make([]TableSchema, 0),
	}

	// 各テーブルの構造を取得
	for _, tableName := range tableNames {
		tableSchema := TableSchema{
			TableName: tableName,
		}

		// カラム情報を取得
		var columns []ColumnInfo
		query := fmt.Sprintf("DESCRIBE `%s`", tableName)
		if err := db.Raw(query).Scan(&columns).Error; err != nil {
			log.Printf("Warning: Failed to describe table %s: %v", tableName, err)
			continue
		}
		tableSchema.Columns = columns

		// インデックス情報を取得
		var indexes []IndexInfo
		indexQuery := fmt.Sprintf("SHOW INDEX FROM `%s`", tableName)
		if err := db.Raw(indexQuery).Scan(&indexes).Error; err != nil {
			log.Printf("Warning: Failed to get indexes for table %s: %v", tableName, err)
		} else {
			tableSchema.Indexes = indexes
		}

		// 外部キー情報を取得
		var foreignKeys []ForeignKeyInfo
		fkQuery := `
			SELECT 
				CONSTRAINT_NAME as constraint_name,
				COLUMN_NAME as column_name,
				REFERENCED_TABLE_NAME as referenced_table,
				REFERENCED_COLUMN_NAME as referenced_column
			FROM information_schema.KEY_COLUMN_USAGE
			WHERE TABLE_SCHEMA = DATABASE()
			AND TABLE_NAME = ?
			AND REFERENCED_TABLE_NAME IS NOT NULL
		`
		if err := db.Raw(fkQuery, tableName).Scan(&foreignKeys).Error; err != nil {
			log.Printf("Warning: Failed to get foreign keys for table %s: %v", tableName, err)
		} else {
			tableSchema.ForeignKeys = foreignKeys
		}

		schema.Tables = append(schema.Tables, tableSchema)
	}

	// JSONに変換
	jsonData, err := json.MarshalIndent(schema, "", "  ")
	if err != nil {
		log.Fatalf("Failed to marshal JSON: %v", err)
	}

	// ファイルに出力（workspaceのルートディレクトリ）
	var outputFile string
	if len(os.Args) > 1 {
		outputFile = os.Args[1]
	} else {
		wd, err := os.Getwd()
		if err != nil {
			log.Fatalf("Failed to get working directory: %v", err)
		}

		if filepath.Base(wd) == "schema" {
			outputFile = filepath.Join(wd, "../../../database_schema.json")
		} else if filepath.Base(wd) == "server" {
			outputFile = filepath.Join(wd, "../database_schema.json")
		} else {
			outputFile = "/workspace/database_schema.json"
		}
		outputFile, _ = filepath.Abs(outputFile)
	}

	if err := os.WriteFile(outputFile, jsonData, 0644); err != nil {
		log.Fatalf("Failed to write file: %v", err)
	}

	// コンソールにも表示
	fmt.Println("📊 データベーススキーマ:")
	fmt.Println("=" + string(make([]byte, 80)))
	for _, table := range schema.Tables {
		fmt.Printf("\n📋 テーブル: %s\n", table.TableName)
		fmt.Println("  カラム:")
		for _, col := range table.Columns {
			null := ""
			if col.Null == "YES" {
				null = "NULL"
			} else {
				null = "NOT NULL"
			}
			key := ""
			if col.Key == "PRI" {
				key = " [PRIMARY KEY]"
			} else if col.Key == "UNI" {
				key = " [UNIQUE]"
			} else if col.Key == "MUL" {
				key = " [INDEX]"
			}
			defaultVal := ""
			if col.Default != "" {
				defaultVal = fmt.Sprintf(" DEFAULT %s", col.Default)
			}
			fmt.Printf("    - %s: %s %s%s%s\n", col.Field, col.Type, null, defaultVal, key)
		}
		
		if len(table.ForeignKeys) > 0 {
			fmt.Println("  外部キー:")
			for _, fk := range table.ForeignKeys {
				fmt.Printf("    - %s -> %s.%s\n", fk.ColumnName, fk.ReferencedTable, fk.ReferencedColumn)
			}
		}
	}

	fmt.Printf("\n✅ スキーマをエクスポートしました: %s\n", outputFile)
	fmt.Printf("   - テーブル数: %d\n", len(schema.Tables))
}

