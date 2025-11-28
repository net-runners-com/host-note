package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/hostnote/server/internal/models"
	"gorm.io/gorm"
)

type VisitHandler struct {
	db *gorm.DB
}

func NewVisitHandler(db *gorm.DB) *VisitHandler {
	return &VisitHandler{db: db}
}

// List 来店記録一覧を取得（最適化版）
func (h *VisitHandler) List(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "認証が必要です"})
		return
	}

	var visits []models.VisitRecord
	if err := h.db.
		Where("user_id = ?", userID).
		Preload("Hime", func(db *gorm.DB) *gorm.DB {
			return db.Select("id, name, photo_url").Where("user_id = ?", userID)
		}).
		Order("visit_date DESC").
		Find(&visits).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, visits)
}

// Get 来店記録を取得
func (h *VisitHandler) Get(c *gin.Context) {
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

	var visit models.VisitRecord
	if err := h.db.
		Where("user_id = ? AND id = ?", userID, id).
		Preload("Hime", func(db *gorm.DB) *gorm.DB {
			return db.Select("id, name, photo_url").Where("user_id = ?", userID)
		}).
		First(&visit).Error; err != nil {
		if handleDBError(c, err, "Visit record not found") {
			return
		}
	}
	c.JSON(http.StatusOK, visit)
}

// Create 来店記録を作成
func (h *VisitHandler) Create(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "認証が必要です"})
		return
	}

	var visit models.VisitRecord
	if err := c.ShouldBindJSON(&visit); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// IDを無視（自動生成）
	visit.ID = 0
	// ユーザーIDを設定
	visit.UserID = userID

	if err := h.db.Create(&visit).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, visit)
}

// Update 来店記録を更新
func (h *VisitHandler) Update(c *gin.Context) {
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

	var visit models.VisitRecord
	if err := h.db.Where("user_id = ? AND id = ?", userID, id).First(&visit).Error; err != nil {
		if handleDBError(c, err, "Visit record not found") {
			return
		}
	}

	var updateData map[string]interface{}
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// JSONのキー名（camelCase）をモデルのフィールド名（PascalCase）に変換
	fieldNameMap := map[string]string{
		"himeId":    "HimeID",
		"visitDate": "VisitDate",
		"memo":      "Memo",
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

	if err := h.db.Model(&visit).Updates(convertedData).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 更新後のデータを取得
	if err := h.db.Where("user_id = ? AND id = ?", userID, id).First(&visit).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新後のデータの取得に失敗しました"})
		return
	}
	c.JSON(http.StatusOK, visit)
}

// Delete 来店記録を削除
func (h *VisitHandler) Delete(c *gin.Context) {
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

	if err := h.db.Where("user_id = ? AND id = ?", userID, id).Delete(&models.VisitRecord{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Deleted"})
}

// BulkCreate 複数の来店記録を一括作成
func (h *VisitHandler) BulkCreate(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "認証が必要です"})
		return
	}

	var visits []models.VisitRecord
	if err := c.ShouldBindJSON(&visits); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// IDを無視（自動生成）、ユーザーIDを設定
	for i := range visits {
		visits[i].ID = 0
		visits[i].UserID = userID
	}

	if err := h.db.Create(&visits).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, visits)
}
