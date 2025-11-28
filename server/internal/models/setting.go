package models

import (
	"time"
)

// Setting 設定
type Setting struct {
	Key       string    `gorm:"primaryKey" json:"key"`
	Value     string    `gorm:"not null" json:"value"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// TableName テーブル名を指定
func (Setting) TableName() string {
	return "setting"
}
