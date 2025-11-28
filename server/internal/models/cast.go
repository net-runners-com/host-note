package models

import (
	"time"
)

// Cast キャスト情報
type Cast struct {
	ID                uint       `gorm:"primaryKey" json:"id"`
	UserID            *uint      `gorm:"index" json:"userId"` // ログインユーザー自身のキャスト情報の場合に設定
	Name              string     `gorm:"not null" json:"name"`
	PhotoURL          *string    `json:"photoUrl"`
	Photos            Photos     `gorm:"type:json" json:"photos"`
	SnsInfo           *SnsInfo   `gorm:"column:sn_s_info;type:json" json:"snsInfo"`
	Birthday          *string    `json:"birthday"`
	Age               *int       `json:"age"` // 年齢
	ChampagneCallSong *string    `json:"champagneCallSong"`
	DrinkPreference   *string    `json:"drinkPreference"` // お酒の濃さ: 超薄め、薄め、普通、濃いめ、超濃いめ
	FavoriteDrinkID   *uint      `json:"favoriteDrinkId"` // 好きなお酒（商品メニューID）
	Ice               *string    `json:"ice"`             // 氷: 1個、2~3個、満タン
	Carbonation       *string    `json:"carbonation"`     // 炭酸: OK、NG
	FavoriteMixerID   *uint      `json:"favoriteMixerId"` // 好きな割物（商品メニューID）
	Smokes            *bool      `json:"smokes"`          // タバコを吸うか
	TobaccoType       *string    `json:"tobaccoType"`     // タバコの種類: 紙タバコ、アイコス、両方
	Memos             Memos      `gorm:"type:json" json:"memos"`
	CreatedAt         time.Time  `json:"createdAt"`
	UpdatedAt         time.Time  `json:"updatedAt"`
	DeletedAt         *time.Time `gorm:"index" json:"-"`

	// リレーション
	User *User `gorm:"foreignKey:UserID" json:"-"`
}

// TableName テーブル名を指定
func (Cast) TableName() string {
	return "cast"
}
