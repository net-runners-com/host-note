package models

import (
	"database/sql/driver"
	"encoding/json"
	"time"
)

// SnsAccount SNSアカウント情報
type SnsAccount struct {
	URL      *string `json:"url,omitempty"`
	Username *string `json:"username,omitempty"`
}

// SnsInfo SNS情報
type SnsInfo struct {
	Twitter   *SnsAccount `json:"twitter,omitempty"`
	Instagram *SnsAccount `json:"instagram,omitempty"`
	Line      *SnsAccount `json:"line,omitempty"`
}

// Value JSONに変換
func (s SnsInfo) Value() (driver.Value, error) {
	return json.Marshal(s)
}

// Scan JSONから復元
func (s *SnsInfo) Scan(value interface{}) error {
	if value == nil {
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	return json.Unmarshal(bytes, s)
}

// Memo メモ
type Memo struct {
	ID        string `json:"id"`
	Content   string `json:"content"`
	CreatedAt string `json:"createdAt"`
}

// Memos メモの配列
type Memos []Memo

// Value JSONに変換
func (m Memos) Value() (driver.Value, error) {
	return json.Marshal(m)
}

// Scan JSONから復元
func (m *Memos) Scan(value interface{}) error {
	if value == nil {
		*m = Memos{}
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	return json.Unmarshal(bytes, m)
}

// Photos 写真の配列
type Photos []string

// Value JSONに変換
func (p Photos) Value() (driver.Value, error) {
	return json.Marshal(p)
}

// Scan JSONから復元
func (p *Photos) Scan(value interface{}) error {
	if value == nil {
		*p = Photos{}
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	return json.Unmarshal(bytes, p)
}

// Hime 姫情報
type Hime struct {
	ID              uint       `gorm:"primaryKey" json:"id"`
	UserID          uint       `gorm:"not null;index" json:"userId"`
	Name            string     `gorm:"not null" json:"name"`
	PhotoURL        *string    `json:"photoUrl"`
	Photos          Photos     `gorm:"type:json" json:"photos"`
	SnsInfo         *SnsInfo   `gorm:"column:sn_s_info;type:json" json:"snsInfo"`
	Birthday        *string    `json:"birthday"`
	Age             *int       `json:"age"` // 年齢
	IsFirstVisit    bool       `gorm:"default:false" json:"isFirstVisit"`
	TantoCastID     *uint      `gorm:"index" json:"tantoCastId"`
	DrinkPreference *string    `json:"drinkPreference"` // お酒の濃さ: 超薄め、薄め、普通、濃いめ、超濃いめ
	FavoriteDrinkID *uint      `json:"favoriteDrinkId"` // 好きなお酒（商品メニューID）
	Ice             *string    `json:"ice"`             // 氷: 1個、2~3個、満タン
	Carbonation     *string    `json:"carbonation"`     // 炭酸: OK、NG
	MixerPreference *string    `json:"mixerPreference"` // 割物の好み（テキスト）
	FavoriteMixerID *uint      `json:"favoriteMixerId"` // 好きな割物（商品メニューID）
	Smokes          *bool      `json:"smokes"`          // タバコを吸うか
	TobaccoType     *string    `json:"tobaccoType"`     // タバコの種類: 紙タバコ、アイコス、両方
	Memos           Memos      `gorm:"type:json" json:"memos"`
	CreatedAt       time.Time  `json:"createdAt"`
	UpdatedAt       time.Time  `json:"updatedAt"`
	DeletedAt       *time.Time `gorm:"index" json:"-"`

	// リレーション
	User      *User `gorm:"foreignKey:UserID" json:"-"`
	TantoCast *Cast `gorm:"foreignKey:TantoCastID" json:"tantoCast,omitempty"`
}

// TableName テーブル名を指定
func (Hime) TableName() string {
	return "hime"
}
