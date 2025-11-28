package models

import (
	"time"
)

// Schedule スケジュール
type Schedule struct {
	ID                uint       `gorm:"primaryKey" json:"id"`
	UserID            uint       `gorm:"not null;index" json:"userId"`
	HimeID            uint       `gorm:"not null;index" json:"himeId"`
	ScheduledDatetime time.Time  `gorm:"not null;index" json:"scheduledDatetime"`
	Memo              *string    `json:"memo"`
	NotificationSent  bool       `gorm:"default:false" json:"notificationSent"`
	CreatedAt         time.Time  `json:"createdAt"`
	UpdatedAt         time.Time  `json:"updatedAt"`
	DeletedAt         *time.Time `gorm:"index" json:"-"`

	// リレーション
	User *User `gorm:"foreignKey:UserID" json:"-"`
	Hime *Hime `gorm:"foreignKey:HimeID" json:"hime,omitempty"`
}

// TableName テーブル名を指定
func (Schedule) TableName() string {
	return "schedule"
}
