package models

import (
	"database/sql/driver"
	"encoding/json"
	"time"
)

// OrderItem 注文アイテム
type OrderItem struct {
	Name      string  `json:"name"`
	Quantity  int     `json:"quantity"`
	UnitPrice float64 `json:"unitPrice"`
	Amount    float64 `json:"amount"`
}

// SalesInfo 売上情報
type SalesInfo struct {
	TableCharge float64     `json:"tableCharge"`
	OrderItems  []OrderItem `json:"orderItems"`
	VisitType   string      `json:"visitType"` // normal, first, shimei
	StayHours   float64     `json:"stayHours"`
	ShimeiFee   float64     `json:"shimeiFee"`
	Subtotal    float64     `json:"subtotal"`
	TaxRate     float64     `json:"taxRate"`
	Tax         float64     `json:"tax"`
	Total       float64     `json:"total"`
}

// Value JSONに変換
func (s SalesInfo) Value() (driver.Value, error) {
	return json.Marshal(s)
}

// Scan JSONから復元
func (s *SalesInfo) Scan(value interface{}) error {
	if value == nil {
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	return json.Unmarshal(bytes, s)
}

// TableRecord 卓記録
type TableRecord struct {
	ID          uint       `gorm:"primaryKey" json:"id"`
	UserID      uint       `gorm:"not null;index" json:"userId"`
	Datetime    time.Time  `gorm:"not null;index" json:"datetime"`
	TableNumber *string    `json:"tableNumber"`
	Memo        *string    `json:"memo"`
	SalesInfo   *SalesInfo `gorm:"type:json" json:"salesInfo"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
	DeletedAt   *time.Time `gorm:"index" json:"-"`

	// リレーション
	User *User `gorm:"foreignKey:UserID" json:"-"`
}

// TableName テーブル名を指定
func (TableRecord) TableName() string {
	return "table_record"
}

// TableHime 卓と姫の関連
type TableHime struct {
	ID      uint `gorm:"primaryKey" json:"id"`
	TableID uint `gorm:"not null;index:idx_table_hime_table_id;index:idx_table_hime_composite" json:"tableId"`
	HimeID  uint `gorm:"not null;index:idx_table_hime_hime_id;index:idx_table_hime_composite" json:"himeId"`
}

// TableName テーブル名を指定
func (TableHime) TableName() string {
	return "table_hime"
}

// TableCast 卓とキャストの関連
type TableCast struct {
	ID      uint   `gorm:"primaryKey" json:"id"`
	TableID uint   `gorm:"not null;index:idx_table_cast_table_id;index:idx_table_cast_composite" json:"tableId"`
	CastID  uint   `gorm:"not null;index:idx_table_cast_cast_id;index:idx_table_cast_composite" json:"castId"`
	Role    string `gorm:"not null;index:idx_table_cast_role;index:idx_table_cast_composite" json:"role"` // main, help
}

// TableName テーブル名を指定
func (TableCast) TableName() string {
	return "table_cast"
}
