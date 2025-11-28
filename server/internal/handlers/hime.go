package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/hostnote/server/internal/models"
	"gorm.io/gorm"
)

type HimeHandler struct {
	db *gorm.DB
}

func NewHimeHandler(db *gorm.DB) *HimeHandler {
	return &HimeHandler{db: db}
}

// List 姫一覧を取得（最適化版、ページネーション対応）
func (h *HimeHandler) List(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "認証が必要です"})
		return
	}

	// クエリパラメータからページネーション情報を取得
	limit := 100 // デフォルトは100件
	if limitStr := c.Query("limit"); limitStr != "" {
		if parsedLimit := parseInt(limitStr); parsedLimit > 0 && parsedLimit <= 500 {
			limit = parsedLimit
		}
	}
	offset := 0
	if offsetStr := c.Query("offset"); offsetStr != "" {
		if parsedOffset := parseInt(offsetStr); parsedOffset >= 0 {
			offset = parsedOffset
		}
	}

	var himes []models.Hime
	query := h.db.
		Where("user_id = ?", userID).
		Preload("TantoCast", func(db *gorm.DB) *gorm.DB {
			return db.Select("id, name, photo_url").Where("user_id = ?", userID)
		}).
		Order("created_at DESC")
	
	// 件数制限を適用
	if err := query.Limit(limit).Offset(offset).Find(&himes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, himes)
}

// Get 姫を取得
func (h *HimeHandler) Get(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "認証が必要です"})
		return
	}

	id, err := parseID(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var hime models.Hime
	if err := h.db.
		Where("user_id = ? AND id = ?", userID, id).
		Preload("TantoCast", func(db *gorm.DB) *gorm.DB {
			return db.Select("id, name, photo_url").Where("user_id = ?", userID)
		}).
		First(&hime).Error; err != nil {
		if handleDBError(c, err, "Hime not found") {
			return
		}
	}
	c.JSON(http.StatusOK, hime)
}

// Create 姫を作成
func (h *HimeHandler) Create(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "認証が必要です"})
		return
	}

	var hime models.Hime
	if err := c.ShouldBindJSON(&hime); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// IDを無視（自動生成）
	hime.ID = 0
	// ユーザーIDを設定
	hime.UserID = userID

	if err := h.db.Create(&hime).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, hime)
}

// Update 姫を更新（最適化版）
func (h *HimeHandler) Update(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "認証が必要です"})
		return
	}

	id, err := parseID(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var hime models.Hime
	if err := h.db.Where("user_id = ? AND id = ?", userID, id).First(&hime).Error; err != nil {
		if handleDBError(c, err, "Hime not found") {
			return
		}
	}

	var updateData map[string]interface{}
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// JSONのキー名（camelCase）をモデルのフィールド名（PascalCase）に変換
	// GORMが自動的に正しいカラム名に変換してくれる
	fieldNameMap := map[string]string{
		"photoUrl":        "PhotoURL",
		"snsInfo":         "SnsInfo",
		"drinkPreference": "DrinkPreference",
		"favoriteDrinkId": "FavoriteDrinkID",
		"ice":             "Ice",
		"carbonation":     "Carbonation",
		"mixerPreference": "MixerPreference",
		"favoriteMixerId": "FavoriteMixerID",
		"smokes":          "Smokes",
		"tobaccoType":     "TobaccoType",
		"tantoCastId":     "TantoCastID",
		"isFirstVisit":    "IsFirstVisit",
		"birthday":        "Birthday",
		"age":             "Age",
		"name":            "Name",
		"photos":          "Photos",
		"memos":           "Memos",
	}

	// キー名を変換
	convertedData := make(map[string]interface{})
	for key, value := range updateData {
		if fieldName, ok := fieldNameMap[key]; ok {
			convertedData[fieldName] = value
		} else {
			// マッピングがない場合はそのまま使用
			convertedData[key] = value
		}
	}

	// snsInfoフィールドがある場合、SnsInfo型に変換
	if snsInfoData, ok := convertedData["SnsInfo"]; ok {
		if snsInfoMap, ok := snsInfoData.(map[string]interface{}); ok {
			var snsInfo models.SnsInfo
			// JSONに変換してからパース
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

	// 更新を実行
	if err := h.db.Model(&hime).Updates(convertedData).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 更新後のデータを取得（Preload付き）
	if err := h.db.
		Where("user_id = ? AND id = ?", userID, id).
		Preload("TantoCast", func(db *gorm.DB) *gorm.DB {
			return db.Select("id, name, photo_url").Where("user_id = ?", userID)
		}).
		First(&hime).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve updated record"})
		return
	}

	c.JSON(http.StatusOK, hime)
}

// Delete 姫を削除
func (h *HimeHandler) Delete(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "認証が必要です"})
		return
	}

	id, err := parseID(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	if err := h.db.Where("user_id = ? AND id = ?", userID, id).Delete(&models.Hime{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Deleted"})
}

// BulkCreate 複数の姫を一括作成
func (h *HimeHandler) BulkCreate(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "認証が必要です"})
		return
	}

	var himes []models.Hime
	if err := c.ShouldBindJSON(&himes); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// IDを無視（自動生成）、ユーザーIDを設定
	for i := range himes {
		himes[i].ID = 0
		himes[i].UserID = userID
	}

	if err := h.db.Create(&himes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, himes)
}
