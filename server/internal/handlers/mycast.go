package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/hostnote/server/internal/models"
	"gorm.io/gorm"
)

type MyCastHandler struct {
	db *gorm.DB
}

func NewMyCastHandler(db *gorm.DB) *MyCastHandler {
	return &MyCastHandler{db: db}
}

// Get 現在のユーザー自身のキャスト情報を取得
func (h *MyCastHandler) Get(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "認証が必要です"})
		return
	}

	var cast models.Cast
	if err := h.db.Where("user_id = ?", userID).First(&cast).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "キャスト情報が見つかりません"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "キャスト情報の取得に失敗しました"})
		return
	}

	c.JSON(http.StatusOK, cast)
}

// Create 現在のユーザー自身のキャスト情報を作成
func (h *MyCastHandler) Create(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "認証が必要です"})
		return
	}

	// 既にキャスト情報が存在するかチェック
	var existingCast models.Cast
	if err := h.db.Where("user_id = ?", userID).First(&existingCast).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "既にキャスト情報が登録されています"})
		return
	}

	var cast models.Cast
	if err := c.ShouldBindJSON(&cast); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	uid := userID.(uint)
	cast.UserID = &uid
	cast.ID = 0 // IDを無視（自動生成）

	if err := h.db.Create(&cast).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "キャスト情報の作成に失敗しました"})
		return
	}

	c.JSON(http.StatusCreated, cast)
}

// Update 現在のユーザー自身のキャスト情報を更新
func (h *MyCastHandler) Update(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "認証が必要です"})
		return
	}

	var cast models.Cast
	if err := h.db.Where("user_id = ?", userID).First(&cast).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "キャスト情報が見つかりません"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "キャスト情報の取得に失敗しました"})
		return
	}

	var updateData map[string]interface{}
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// JSONのキー名（camelCase）をモデルのフィールド名（PascalCase）に変換
	fieldNameMap := map[string]string{
		"photoUrl":          "PhotoURL",
		"snsInfo":           "SnsInfo",
		"name":              "Name",
		"photos":            "Photos",
		"birthday":          "Birthday",
		"age":               "Age",
		"champagneCallSong": "ChampagneCallSong",
		"drinkPreference":   "DrinkPreference",
		"favoriteDrinkId":   "FavoriteDrinkID",
		"ice":               "Ice",
		"carbonation":       "Carbonation",
		"favoriteMixerId":   "FavoriteMixerID",
		"smokes":            "Smokes",
		"tobaccoType":       "TobaccoType",
		"memos":             "Memos",
	}

	// キー名を変換
	convertedData := make(map[string]interface{})
	for key, value := range updateData {
		if fieldName, ok := fieldNameMap[key]; ok {
			convertedData[fieldName] = value
		} else {
			convertedData[key] = value
		}
	}

	// snsInfoフィールドがある場合、SnsInfo型に変換
	if snsInfoData, ok := convertedData["SnsInfo"]; ok {
		if snsInfoMap, ok := snsInfoData.(map[string]interface{}); ok {
			var snsInfo models.SnsInfo
			jsonBytes, err := json.Marshal(snsInfoMap)
			if err == nil {
				if err := json.Unmarshal(jsonBytes, &snsInfo); err == nil {
					convertedData["SnsInfo"] = &snsInfo
				}
			}
		} else if snsInfoData == nil {
			convertedData["SnsInfo"] = (*models.SnsInfo)(nil)
		}
	}

	// photosフィールドがある場合、Photos型に変換
	if photosData, ok := convertedData["Photos"]; ok {
		if photosArray, ok := photosData.([]interface{}); ok {
			photos := make(models.Photos, len(photosArray))
			for i, v := range photosArray {
				if str, ok := v.(string); ok {
					photos[i] = str
				}
			}
			convertedData["Photos"] = photos
		}
	}

	// memosフィールドがある場合、Memos型に変換
	if memosData, ok := convertedData["Memos"]; ok {
		if memosData == nil {
			convertedData["Memos"] = models.Memos{}
		} else if memosArray, ok := memosData.([]interface{}); ok {
			var memos models.Memos
			jsonBytes, err := json.Marshal(memosArray)
			if err == nil {
				if err := json.Unmarshal(jsonBytes, &memos); err == nil {
					convertedData["Memos"] = memos
				} else {
					// アンマーシャルに失敗した場合は、元のデータを削除してエラーを回避
					delete(convertedData, "Memos")
				}
			} else {
				// マーシャルに失敗した場合は、元のデータを削除してエラーを回避
				delete(convertedData, "Memos")
			}
		} else {
			// []interface{}でない場合は、元のデータを削除してエラーを回避
			delete(convertedData, "Memos")
		}
	}

	// UserIDは変更しない
	uid := userID.(uint)
	convertedData["UserID"] = &uid
	convertedData["ID"] = cast.ID

	if err := h.db.Model(&cast).Updates(convertedData).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "キャスト情報の更新に失敗しました"})
		return
	}

	// 更新後のデータを取得
	if err := h.db.Where("user_id = ?", userID).First(&cast).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新後のデータの取得に失敗しました"})
		return
	}

	c.JSON(http.StatusOK, cast)
}

// Check 現在のユーザー自身のキャスト情報が存在するかチェック
func (h *MyCastHandler) Check(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "認証が必要です"})
		return
	}

	var count int64
	h.db.Model(&models.Cast{}).Where("user_id = ?", userID).Count(&count)

	c.JSON(http.StatusOK, gin.H{
		"exists": count > 0,
	})
}
