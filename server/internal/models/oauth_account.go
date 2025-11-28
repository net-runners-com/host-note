package models

import (
	"time"
)

// OAuthAccount OAuthアカウント情報
type OAuthAccount struct {
	ID            uint       `gorm:"primaryKey" json:"id"`
	UserID        uint       `gorm:"not null;index" json:"userId"`
	Provider      string     `gorm:"type:varchar(20);not null;index" json:"provider"` // "google"など
	ProviderID    string     `gorm:"type:varchar(255);not null;index" json:"-"`       // OAuthプロバイダーのユーザーID
	ProviderEmail *string    `gorm:"type:varchar(255)" json:"-"`                      // OAuthから取得したメール
	CreatedAt     time.Time  `json:"createdAt"`
	UpdatedAt     time.Time  `json:"updatedAt"`
	DeletedAt     *time.Time `gorm:"index" json:"-"`

	User User `gorm:"foreignKey:UserID" json:"-"`
}

// TableName テーブル名を指定
func (OAuthAccount) TableName() string {
	return "oauth_account"
}
