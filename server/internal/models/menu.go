package models

import (
	"time"
)

// Menu メニューアイテム（共通データ）
type Menu struct {
	ID        uint       `gorm:"primaryKey" json:"id"`
	Name      string     `gorm:"type:varchar(255);not null" json:"name"`
	Price     float64    `gorm:"not null" json:"price"`
	Category  string     `gorm:"type:varchar(100);not null" json:"category"`
	Order     int        `gorm:"default:0" json:"order"` // 表示順序
	CreatedAt time.Time  `json:"createdAt"`
	UpdatedAt time.Time  `json:"updatedAt"`
	DeletedAt *time.Time `gorm:"index" json:"-"`
}

// TableName テーブル名を指定
func (Menu) TableName() string {
	return "menu"
}
