package models

import (
	"time"
)

// PushToken FCMプッシュ通知トークン
type PushToken struct {
	ID        uint       `gorm:"primaryKey" json:"id"`
	UserID    uint       `gorm:"not null;index" json:"userId"`
	Token     string     `gorm:"not null;uniqueIndex;size:500" json:"token"`
	CreatedAt time.Time  `json:"createdAt"`
	UpdatedAt time.Time  `json:"updatedAt"`
	DeletedAt *time.Time `gorm:"index" json:"-"`

	// リレーション
	User *User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

// TableName テーブル名を指定
func (PushToken) TableName() string {
	return "push_tokens"
}
