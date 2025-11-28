package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/hostnote/server/internal/models"
	"gorm.io/gorm"
)

type ScheduleHandler struct {
	db *gorm.DB
}

func NewScheduleHandler(db *gorm.DB) *ScheduleHandler {
	return &ScheduleHandler{db: db}
}

// List スケジュール一覧を取得（最適化版）
func (h *ScheduleHandler) List(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "認証が必要です"})
		return
	}

	var schedules []models.Schedule
	if err := h.db.
		Where("user_id = ?", userID).
		Preload("Hime", func(db *gorm.DB) *gorm.DB {
			return db.Select("id, name, photo_url").Where("user_id = ?", userID)
		}).
		Order("scheduled_datetime DESC").
		Find(&schedules).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, schedules)
}

// Get スケジュールを取得
func (h *ScheduleHandler) Get(c *gin.Context) {
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

	var schedule models.Schedule
	if err := h.db.
		Where("user_id = ? AND id = ?", userID, id).
		Preload("Hime", func(db *gorm.DB) *gorm.DB {
			return db.Select("id, name, photo_url").Where("user_id = ?", userID)
		}).
		First(&schedule).Error; err != nil {
		if handleDBError(c, err, "Schedule not found") {
			return
		}
	}
	c.JSON(http.StatusOK, schedule)
}

// Create スケジュールを作成
func (h *ScheduleHandler) Create(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "認証が必要です"})
		return
	}

	var schedule models.Schedule
	if err := c.ShouldBindJSON(&schedule); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// IDを無視（自動生成）
	schedule.ID = 0
	// ユーザーIDを設定
	schedule.UserID = userID

	if err := h.db.Create(&schedule).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, schedule)
}

// Update スケジュールを更新
func (h *ScheduleHandler) Update(c *gin.Context) {
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

	var schedule models.Schedule
	if err := h.db.Where("user_id = ? AND id = ?", userID, id).First(&schedule).Error; err != nil {
		if handleDBError(c, err, "Schedule not found") {
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
		"himeId":            "HimeID",
		"scheduledDatetime": "ScheduledDatetime",
		"memo":              "Memo",
		"notificationSent":  "NotificationSent",
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

	if err := h.db.Model(&schedule).Updates(convertedData).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 更新後のデータを取得
	if err := h.db.Where("user_id = ? AND id = ?", userID, id).First(&schedule).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新後のデータの取得に失敗しました"})
		return
	}
	c.JSON(http.StatusOK, schedule)
}

// Delete スケジュールを削除
func (h *ScheduleHandler) Delete(c *gin.Context) {
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

	if err := h.db.Where("user_id = ? AND id = ?", userID, id).Delete(&models.Schedule{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Deleted"})
}

// BulkCreate 複数のスケジュールを一括作成
func (h *ScheduleHandler) BulkCreate(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "認証が必要です"})
		return
	}

	var schedules []models.Schedule
	if err := c.ShouldBindJSON(&schedules); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// IDを無視（自動生成）、ユーザーIDを設定
	for i := range schedules {
		schedules[i].ID = 0
		schedules[i].UserID = userID
	}

	if err := h.db.Create(&schedules).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, schedules)
}
