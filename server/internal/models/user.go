package models

import (
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// User ユーザー情報
type User struct {
	ID            uint           `gorm:"primaryKey" json:"id"`
	Username      string         `gorm:"type:varchar(50);uniqueIndex;not null" json:"username"`
	Email         *string        `gorm:"type:varchar(255);uniqueIndex" json:"email"`
	Password      *string        `gorm:"type:varchar(255)" json:"-"`                             // OAuthユーザーはNULL可
	Role          string         `gorm:"type:varchar(20);not null;default:'member'" json:"role"` // superadmin, admin, leader, member
	CreatedAt     time.Time      `json:"createdAt"`
	UpdatedAt     time.Time      `json:"updatedAt"`
	DeletedAt     *time.Time     `gorm:"index" json:"-"`
	OAuthAccounts []OAuthAccount `gorm:"foreignKey:UserID" json:"-"`
}

// TableName テーブル名を指定
func (User) TableName() string {
	return "user"
}

// BeforeCreate 作成前にパスワードをハッシュ化
func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.Password != nil && *u.Password != "" {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(*u.Password), bcrypt.DefaultCost)
		if err != nil {
			return err
		}
		hashedStr := string(hashedPassword)
		u.Password = &hashedStr
	}
	return nil
}

// CheckPassword パスワードを検証
func (u *User) CheckPassword(password string) bool {
	if u.Password == nil || *u.Password == "" {
		return false
	}
	err := bcrypt.CompareHashAndPassword([]byte(*u.Password), []byte(password))
	return err == nil
}
