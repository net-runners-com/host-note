package handlers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/hostnote/server/internal/models"
	"gorm.io/gorm"
)

type SettingHandler struct {
	db *gorm.DB
}

func NewSettingHandler(db *gorm.DB) *SettingHandler {
	return &SettingHandler{db: db}
}

// List 設定一覧を取得
func (h *SettingHandler) List(c *gin.Context) {
	var settings []models.Setting
	if err := h.db.Find(&settings).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, settings)
}

// Get 設定を取得
func (h *SettingHandler) Get(c *gin.Context) {
	key := c.Param("key")

	var setting models.Setting
	if err := h.db.Where("`key` = ?", key).First(&setting).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Setting not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, setting)
}

// Create 設定を作成
func (h *SettingHandler) Create(c *gin.Context) {
	var setting models.Setting
	if err := c.ShouldBindJSON(&setting); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 既に存在するかチェック
	var existing models.Setting
	if err := h.db.Where("`key` = ?", setting.Key).First(&existing).Error; err == nil {
		// 既に存在する場合は既存の設定を返す（409 Conflict）
		c.JSON(http.StatusConflict, existing)
		return
	}

	if err := h.db.Create(&setting).Error; err != nil {
		// MySQLの重複エラー（1062）を検出
		errMsg := err.Error()
		if strings.Contains(errMsg, "Duplicate entry") || strings.Contains(errMsg, "1062") {
			// 既存の設定を取得して返す
			if err := h.db.Where("`key` = ?", setting.Key).First(&existing).Error; err == nil {
				c.JSON(http.StatusConflict, existing)
				return
			}
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": errMsg})
		return
	}
	c.JSON(http.StatusCreated, setting)
}

// Update 設定を更新
func (h *SettingHandler) Update(c *gin.Context) {
	key := c.Param("key")

	var setting models.Setting
	if err := h.db.Where("`key` = ?", key).First(&setting).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Setting not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if err := c.ShouldBindJSON(&setting); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.db.Save(&setting).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, setting)
}

// Delete 設定を削除
func (h *SettingHandler) Delete(c *gin.Context) {
	key := c.Param("key")

	if err := h.db.Delete(&models.Setting{}, "`key` = ?", key).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Deleted"})
}

// BulkCreate 複数の設定を一括作成
func (h *SettingHandler) BulkCreate(c *gin.Context) {
	var settings []models.Setting
	if err := c.ShouldBindJSON(&settings); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.db.Create(&settings).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, settings)
}
