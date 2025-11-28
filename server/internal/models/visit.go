package models

import (
	"time"
)

// VisitRecord 来店記録
type VisitRecord struct {
	ID        uint       `gorm:"primaryKey" json:"id"`
	UserID    uint       `gorm:"not null;index" json:"userId"`
	HimeID    uint       `gorm:"not null;index" json:"himeId"`
	VisitDate time.Time  `gorm:"not null;index" json:"visitDate"`
	Memo      *string    `json:"memo"`
	CreatedAt time.Time  `json:"createdAt"`
	UpdatedAt time.Time  `json:"updatedAt"`
	DeletedAt *time.Time `gorm:"index" json:"-"`

	// リレーション
	User *User `gorm:"foreignKey:UserID" json:"-"`
	Hime *Hime `gorm:"foreignKey:HimeID" json:"hime,omitempty"`
}

// TableName テーブル名を指定
func (VisitRecord) TableName() string {
	return "visit_record"
}
