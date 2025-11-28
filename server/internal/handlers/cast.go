package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/hostnote/server/internal/models"
	"gorm.io/gorm"
)

type CastHandler struct {
	db *gorm.DB
}

func NewCastHandler(db *gorm.DB) *CastHandler {
	return &CastHandler{db: db}
}

// List キャスト一覧を取得（ページネーション対応）
func (h *CastHandler) List(c *gin.Context) {
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

	var casts []models.Cast
	query := h.db.Where("user_id = ?", userID).Order("created_at DESC")
	
	// 件数制限を適用
	if err := query.Limit(limit).Offset(offset).Find(&casts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, casts)
}

// Get キャストを取得
func (h *CastHandler) Get(c *gin.Context) {
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

	var cast models.Cast
	if err := h.db.Where("user_id = ? AND id = ?", userID, id).First(&cast).Error; err != nil {
		if handleDBError(c, err, "Cast not found") {
			return
		}
	}
	c.JSON(http.StatusOK, cast)
}

// Create キャストを作成
func (h *CastHandler) Create(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "認証が必要です"})
		return
	}

	var cast models.Cast
	if err := c.ShouldBindJSON(&cast); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// IDを無視（自動生成）
	cast.ID = 0
	// ユーザーIDを設定
	cast.UserID = &userID

	if err := h.db.Create(&cast).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, cast)
}

// Update キャストを更新（最適化版）
func (h *CastHandler) Update(c *gin.Context) {
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

	var cast models.Cast
	if err := h.db.Where("user_id = ? AND id = ?", userID, id).First(&cast).Error; err != nil {
		if handleDBError(c, err, "Cast not found") {
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

	// memosフィールドがある場合、Memos型に変換
	if memosData, ok := convertedData["Memos"]; ok {
		if memosArray, ok := memosData.([]interface{}); ok {
			var memos models.Memos
			jsonBytes, err := json.Marshal(memosArray)
			if err == nil {
				if err := json.Unmarshal(jsonBytes, &memos); err == nil {
					convertedData["Memos"] = memos
				}
			}
		}
	}

	// 部分更新（Select最適化）
	if err := h.db.Model(&cast).Updates(convertedData).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 更新後のデータを取得
	if err := h.db.Where("user_id = ? AND id = ?", userID, id).First(&cast).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve updated record"})
		return
	}

	c.JSON(http.StatusOK, cast)
}

// Delete キャストを削除
func (h *CastHandler) Delete(c *gin.Context) {
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

	if err := h.db.Where("user_id = ? AND id = ?", userID, id).Delete(&models.Cast{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Deleted"})
}

// BulkCreate 複数のキャストを一括作成
func (h *CastHandler) BulkCreate(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "認証が必要です"})
		return
	}

	var casts []models.Cast
	if err := c.ShouldBindJSON(&casts); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// IDを無視（自動生成）、ユーザーIDを設定
	for i := range casts {
		casts[i].ID = 0
		casts[i].UserID = &userID
	}

	if err := h.db.Create(&casts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, casts)
}
