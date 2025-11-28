package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/hostnote/server/internal/models"
	"gorm.io/gorm"
)

// ヘルパー関数
func parseTime(timeStr string) time.Time {
	if timeStr == "" {
		return time.Time{}
	}

	// RFC3339形式を試す
	t, err := time.Parse(time.RFC3339, timeStr)
	if err == nil {
		return t
	}
	// ISO8601形式（タイムゾーンなし）を試す
	t, err = time.Parse("2006-01-02T15:04:05", timeStr)
	if err == nil {
		return t
	}
	// datetime-local形式（YYYY-MM-DDTHH:mm）を試す
	t, err = time.Parse("2006-01-02T15:04", timeStr)
	if err == nil {
		return t
	}
	// タイムゾーン付き形式を試す
	t, err = time.Parse("2006-01-02T15:04:05Z07:00", timeStr)
	if err == nil {
		return t
	}
	// すべて失敗した場合はゼロ値を返す
	return time.Time{}
}

func parseStringPtr(v interface{}) *string {
	if v == nil {
		return nil
	}
	if str, ok := v.(string); ok && str != "" {
		return &str
	}
	return nil
}

func parseSalesInfo(v interface{}) *models.SalesInfo {
	if v == nil {
		return nil
	}
	bytes, err := json.Marshal(v)
	if err != nil {
		return nil
	}
	var salesInfo models.SalesInfo
	if err := json.Unmarshal(bytes, &salesInfo); err != nil {
		return nil
	}
	return &salesInfo
}

type TableHandler struct {
	db *gorm.DB
}

func NewTableHandler(db *gorm.DB) *TableHandler {
	return &TableHandler{db: db}
}

// List 卓記録一覧を取得（ページネーション対応）
func (h *TableHandler) List(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "認証が必要です"})
		return
	}

	// クエリパラメータからページネーション情報を取得
	limit := 50 // デフォルトは50件
	if limitStr := c.Query("limit"); limitStr != "" {
		if parsedLimit := parseInt(limitStr); parsedLimit > 0 && parsedLimit <= 200 {
			limit = parsedLimit
		}
	}
	offset := 0
	if offsetStr := c.Query("offset"); offsetStr != "" {
		if parsedOffset := parseInt(offsetStr); parsedOffset >= 0 {
			offset = parsedOffset
		}
	}

	var records []models.TableRecord
	query := h.db.Where("user_id = ?", userID).Order("datetime DESC")
	
	// 件数制限を適用
	if err := query.Limit(limit).Offset(offset).Find(&records).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if len(records) == 0 {
		c.JSON(http.StatusOK, []interface{}{})
		return
	}

	// 全てのtable_idを収集
	tableIDs := make([]uint, len(records))
	for i, record := range records {
		tableIDs[i] = record.ID
	}

	// 一括で関連データを取得（Select最適化）
	// 姫リストを一括取得
	var tableHimes []models.TableHime
	h.db.Select("table_id, hime_id").Where("table_id IN ?", tableIDs).Find(&tableHimes)

	// キャストリストを一括取得
	var tableCasts []models.TableCast
	h.db.Select("table_id, cast_id, role").Where("table_id IN ?", tableIDs).Find(&tableCasts)

	// HimeIDとCastIDを収集
	himeIDs := make(map[uint]bool)
	castIDs := make(map[uint]bool)
	for _, th := range tableHimes {
		himeIDs[th.HimeID] = true
	}
	for _, tc := range tableCasts {
		castIDs[tc.CastID] = true
	}

	// Himeを一括取得（必要なフィールドのみ、ユーザーIDでフィルタリング）
	himeIDList := make([]uint, 0, len(himeIDs))
	for id := range himeIDs {
		himeIDList = append(himeIDList, id)
	}
	var himes []models.Hime
	if len(himeIDList) > 0 {
		h.db.Select("id, name, photo_url").Where("user_id = ? AND id IN ?", userID, himeIDList).Find(&himes)
	}
	himeMap := make(map[uint]models.Hime, len(himes))
	for _, hime := range himes {
		himeMap[hime.ID] = hime
	}

	// Castを一括取得（必要なフィールドのみ、ユーザーIDでフィルタリング）
	castIDList := make([]uint, 0, len(castIDs))
	for id := range castIDs {
		castIDList = append(castIDList, id)
	}
	var casts []models.Cast
	if len(castIDList) > 0 {
		h.db.Select("id, name, photo_url").Where("user_id = ? AND id IN ?", userID, castIDList).Find(&casts)
	}
	castMap := make(map[uint]models.Cast, len(casts))
	for _, cast := range casts {
		castMap[cast.ID] = cast
	}

	// table_idごとにグループ化
	tableHimeMap := make(map[uint][]models.TableHime)
	for _, th := range tableHimes {
		tableHimeMap[th.TableID] = append(tableHimeMap[th.TableID], th)
	}

	tableCastMap := make(map[uint][]models.TableCast)
	for _, tc := range tableCasts {
		tableCastMap[tc.TableID] = append(tableCastMap[tc.TableID], tc)
	}

	// 結果を構築
	result := make([]map[string]interface{}, len(records))
	for i, record := range records {
		var salesInfo interface{} = nil
		if record.SalesInfo != nil {
			salesInfo = record.SalesInfo
		}

		recordMap := map[string]interface{}{
			"id":          record.ID,
			"datetime":    record.Datetime,
			"tableNumber": record.TableNumber,
			"memo":        record.Memo,
			"salesInfo":   salesInfo,
			"createdAt":   record.CreatedAt,
			"updatedAt":   record.UpdatedAt,
		}

		// 姫リストを構築
		himeList := make([]map[string]interface{}, 0)
		if tableHimes, ok := tableHimeMap[record.ID]; ok {
			for _, th := range tableHimes {
				if hime, ok := himeMap[th.HimeID]; ok {
					himeList = append(himeList, map[string]interface{}{
						"id":       hime.ID,
						"name":     hime.Name,
						"photoUrl": hime.PhotoURL,
					})
				}
			}
		}
		recordMap["himeList"] = himeList

		// メインキャストを取得
		var mainCast *map[string]interface{} = nil
		if tableCasts, ok := tableCastMap[record.ID]; ok {
			for _, tc := range tableCasts {
				if tc.Role == "main" {
					if cast, ok := castMap[tc.CastID]; ok {
						mainCast = &map[string]interface{}{
							"id":       cast.ID,
							"name":     cast.Name,
							"photoUrl": cast.PhotoURL,
						}
						break
					}
				}
			}
		}
		if mainCast != nil {
			recordMap["mainCast"] = *mainCast
		} else {
			recordMap["mainCast"] = nil
		}

		// ヘルプキャストを構築
		helpCastList := make([]map[string]interface{}, 0)
		if tableCasts, ok := tableCastMap[record.ID]; ok {
			for _, tc := range tableCasts {
				if tc.Role == "help" {
					if cast, ok := castMap[tc.CastID]; ok {
						helpCastList = append(helpCastList, map[string]interface{}{
							"id":       cast.ID,
							"name":     cast.Name,
							"photoUrl": cast.PhotoURL,
						})
					}
				}
			}
		}
		recordMap["helpCasts"] = helpCastList

		result[i] = recordMap
	}

	c.JSON(http.StatusOK, result)
}

// buildTableRecordMap 卓記録のマップを構築（共通処理、最適化版）
func (h *TableHandler) buildTableRecordMap(record models.TableRecord, userID uint) map[string]interface{} {
	recordMap := map[string]interface{}{
		"id":          record.ID,
		"datetime":    record.Datetime,
		"tableNumber": record.TableNumber,
		"memo":        record.Memo,
		"salesInfo":   record.SalesInfo,
		"createdAt":   record.CreatedAt,
		"updatedAt":   record.UpdatedAt,
	}

	// 関連データを一括取得（Select最適化）
	var tableHimes []models.TableHime
	h.db.Select("table_id, hime_id").Where("table_id = ?", record.ID).Find(&tableHimes)

	var tableCasts []models.TableCast
	h.db.Select("table_id, cast_id, role").Where("table_id = ?", record.ID).Find(&tableCasts)

	if len(tableHimes) == 0 && len(tableCasts) == 0 {
		recordMap["himeList"] = []interface{}{}
		recordMap["mainCast"] = nil
		recordMap["helpCasts"] = []interface{}{}
		return recordMap
	}

	// HimeIDとCastIDを収集
	himeIDs := make([]uint, 0, len(tableHimes))
	castIDs := make([]uint, 0, len(tableCasts))
	for _, th := range tableHimes {
		himeIDs = append(himeIDs, th.HimeID)
	}
	for _, tc := range tableCasts {
		castIDs = append(castIDs, tc.CastID)
	}

	// Himeを一括取得（必要なフィールドのみ、ユーザーIDでフィルタリング）
	var himes []models.Hime
	if len(himeIDs) > 0 {
		h.db.Select("id, name, photo_url").Where("user_id = ? AND id IN ?", userID, himeIDs).Find(&himes)
	}
	himeMap := make(map[uint]models.Hime, len(himes))
	for _, hime := range himes {
		himeMap[hime.ID] = hime
	}

	// Castを一括取得（必要なフィールドのみ、ユーザーIDでフィルタリング）
	var casts []models.Cast
	if len(castIDs) > 0 {
		h.db.Select("id, name, photo_url").Where("user_id = ? AND id IN ?", userID, castIDs).Find(&casts)
	}
	castMap := make(map[uint]models.Cast, len(casts))
	for _, cast := range casts {
		castMap[cast.ID] = cast
	}

	// 姫リストを構築
	himeList := make([]map[string]interface{}, 0, len(tableHimes))
	for _, th := range tableHimes {
		if hime, ok := himeMap[th.HimeID]; ok {
			himeList = append(himeList, map[string]interface{}{
				"id":       hime.ID,
				"name":     hime.Name,
				"photoUrl": hime.PhotoURL,
			})
		}
	}
	recordMap["himeList"] = himeList

	// メインキャストを取得
	var mainCast *map[string]interface{} = nil
	for _, tc := range tableCasts {
		if tc.Role == "main" {
			if cast, ok := castMap[tc.CastID]; ok {
				mainCast = &map[string]interface{}{
					"id":       cast.ID,
					"name":     cast.Name,
					"photoUrl": cast.PhotoURL,
				}
				break
			}
		}
	}
	if mainCast != nil {
		recordMap["mainCast"] = *mainCast
	} else {
		recordMap["mainCast"] = nil
	}

	// ヘルプキャストを構築
	helpCastList := make([]map[string]interface{}, 0, len(tableCasts))
	for _, tc := range tableCasts {
		if tc.Role == "help" {
			if cast, ok := castMap[tc.CastID]; ok {
				helpCastList = append(helpCastList, map[string]interface{}{
					"id":       cast.ID,
					"name":     cast.Name,
					"photoUrl": cast.PhotoURL,
				})
			}
		}
	}
	recordMap["helpCasts"] = helpCastList

	return recordMap
}

// Get 卓記録を取得
func (h *TableHandler) Get(c *gin.Context) {
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

	var record models.TableRecord
	if err := h.db.Where("user_id = ? AND id = ?", userID, id).First(&record).Error; err != nil {
		if handleDBError(c, err, "Table record not found") {
			return
		}
	}

	recordMap := h.buildTableRecordMap(record, userID)
	c.JSON(http.StatusOK, recordMap)
}

// Create 卓記録を作成
func (h *TableHandler) Create(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "認証が必要です"})
		return
	}

	var requestData map[string]interface{}
	if err := c.ShouldBindJSON(&requestData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// トランザクション開始
	tx := h.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// テーブル記録を作成
	datetimeStr, ok := requestData["datetime"].(string)
	if !ok {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid datetime format"})
		return
	}

	record := models.TableRecord{
		UserID:      userID,
		Datetime:    parseTime(datetimeStr),
		TableNumber: parseStringPtr(requestData["tableNumber"]),
		Memo:        parseStringPtr(requestData["memo"]),
		SalesInfo:   parseSalesInfo(requestData["salesInfo"]),
	}

	if err := tx.Create(&record).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 姫の関連を作成（ユーザーIDでフィルタリング）
	if himeIds, ok := requestData["himeIds"].([]interface{}); ok {
		for _, himeId := range himeIds {
			var himeIdUint uint
			switch v := himeId.(type) {
			case float64:
				himeIdUint = uint(v)
			case int:
				himeIdUint = uint(v)
			default:
				continue
			}
			// 指定された姫が現在のユーザーのものか確認
			var hime models.Hime
			if err := tx.Where("user_id = ? AND id = ?", userID, himeIdUint).First(&hime).Error; err != nil {
				// ユーザーの姫でない場合はスキップ
				continue
			}
			tableHime := models.TableHime{
				TableID: record.ID,
				HimeID:  himeIdUint,
			}
			if err := tx.Create(&tableHime).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
		}
	}

	// メインキャストの関連を作成（ユーザーIDでフィルタリング）
	if mainCastId, ok := requestData["mainCastId"].(float64); ok && mainCastId > 0 {
		// 指定されたキャストが現在のユーザーのものか確認
		var cast models.Cast
		if err := tx.Where("user_id = ? AND id = ?", userID, uint(mainCastId)).First(&cast).Error; err == nil {
			tableCast := models.TableCast{
				TableID: record.ID,
				CastID:  uint(mainCastId),
				Role:    "main",
			}
			if err := tx.Create(&tableCast).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
		}
	}

	// ヘルプキャストの関連を作成（ユーザーIDでフィルタリング）
	if helpCastIds, ok := requestData["helpCastIds"].([]interface{}); ok {
		for _, castId := range helpCastIds {
			var castIdUint uint
			switch v := castId.(type) {
			case float64:
				castIdUint = uint(v)
			case int:
				castIdUint = uint(v)
			default:
				continue
			}
			// 指定されたキャストが現在のユーザーのものか確認
			var cast models.Cast
			if err := tx.Where("user_id = ? AND id = ?", userID, castIdUint).First(&cast).Error; err != nil {
				// ユーザーのキャストでない場合はスキップ
				continue
			}
			tableCast := models.TableCast{
				TableID: record.ID,
				CastID:  castIdUint,
				Role:    "help",
			}
			if err := tx.Create(&tableCast).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
		}
	}

	// 来店履歴を自動追加（卓記録に参加している各姫について）
	if himeIds, ok := requestData["himeIds"].([]interface{}); ok {
		// 卓記録の日付を取得（日付のみ、時刻は無視）
		visitDate := time.Date(
			record.Datetime.Year(),
			record.Datetime.Month(),
			record.Datetime.Day(),
			0, 0, 0, 0,
			record.Datetime.Location(),
		)
		// 翌日の0時（同日の終わり）
		nextDay := visitDate.AddDate(0, 0, 1)

		// 各姫について来店履歴を作成（同日の来店履歴が既に存在する場合はスキップ）
		for _, himeId := range himeIds {
			var himeIdUint uint
			switch v := himeId.(type) {
			case float64:
				himeIdUint = uint(v)
			case int:
				himeIdUint = uint(v)
			default:
				continue
			}

			// 同日の来店履歴が既に存在するかチェック（日付範囲でチェック、ユーザーIDでフィルタリング）
			var existingVisit models.VisitRecord
			err := tx.Where("user_id = ? AND hime_id = ? AND visit_date >= ? AND visit_date < ?", userID, himeIdUint, visitDate, nextDay).
				First(&existingVisit).Error
			if err == nil {
				// 既に存在する場合はスキップ
				continue
			}
			if err != gorm.ErrRecordNotFound {
				// その他のエラーの場合はロールバック
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			// 来店履歴を作成
			visitRecord := models.VisitRecord{
				UserID:    userID,
				HimeID:    himeIdUint,
				VisitDate: visitDate,
				Memo:      nil,
			}
			if err := tx.Create(&visitRecord).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
		}
	}

	tx.Commit()

	// 作成したレコードを取得して返す
	var createdRecord models.TableRecord
	if err := h.db.Where("user_id = ? AND id = ?", userID, record.ID).First(&createdRecord).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve created record"})
		return
	}

	recordMap := h.buildTableRecordMap(createdRecord, userID)
	c.JSON(http.StatusCreated, recordMap)
}

// Update 卓記録を更新
func (h *TableHandler) Update(c *gin.Context) {
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

	var record models.TableRecord
	if err := h.db.Where("user_id = ? AND id = ?", userID, id).First(&record).Error; err != nil {
		if handleDBError(c, err, "Table record not found") {
			return
		}
	}

	var requestData map[string]interface{}
	if err := c.ShouldBindJSON(&requestData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// トランザクション開始
	tx := h.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// テーブル記録を更新（部分更新対応）
	// datetimeフィールドがある場合のみ更新
	if datetimeStr, ok := requestData["datetime"].(string); ok && datetimeStr != "" {
		parsedTime := parseTime(datetimeStr)
		// パースに失敗した場合（ゼロ値）はエラーを返す
		if parsedTime.IsZero() {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid datetime format"})
			return
		}
		record.Datetime = parsedTime
	}
	// tableNumberフィールドがある場合のみ更新
	if tableNumber, ok := requestData["tableNumber"]; ok {
		record.TableNumber = parseStringPtr(tableNumber)
	}
	// memoフィールドがある場合のみ更新
	if memo, ok := requestData["memo"]; ok {
		record.Memo = parseStringPtr(memo)
	}
	// salesInfoフィールドがある場合のみ更新
	if salesInfo, ok := requestData["salesInfo"]; ok {
		record.SalesInfo = parseSalesInfo(salesInfo)
	}

	if err := tx.Save(&record).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 既存の関連を削除
	tx.Where("table_id = ?", record.ID).Delete(&models.TableHime{})
	tx.Where("table_id = ?", record.ID).Delete(&models.TableCast{})

	// 姫の関連を作成（ユーザーIDでフィルタリング）
	if himeIds, ok := requestData["himeIds"].([]interface{}); ok {
		for _, himeId := range himeIds {
			var himeIdUint uint
			switch v := himeId.(type) {
			case float64:
				himeIdUint = uint(v)
			case int:
				himeIdUint = uint(v)
			default:
				continue
			}
			// 指定された姫が現在のユーザーのものか確認
			var hime models.Hime
			if err := tx.Where("user_id = ? AND id = ?", userID, himeIdUint).First(&hime).Error; err != nil {
				// ユーザーの姫でない場合はスキップ
				continue
			}
			tableHime := models.TableHime{
				TableID: record.ID,
				HimeID:  himeIdUint,
			}
			if err := tx.Create(&tableHime).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
		}
	}

	// メインキャストの関連を作成（ユーザーIDでフィルタリング）
	if mainCastId, ok := requestData["mainCastId"].(float64); ok && mainCastId > 0 {
		// 指定されたキャストが現在のユーザーのものか確認
		var cast models.Cast
		if err := tx.Where("user_id = ? AND id = ?", userID, uint(mainCastId)).First(&cast).Error; err == nil {
			tableCast := models.TableCast{
				TableID: record.ID,
				CastID:  uint(mainCastId),
				Role:    "main",
			}
			if err := tx.Create(&tableCast).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
		}
	}

	// ヘルプキャストの関連を作成（ユーザーIDでフィルタリング）
	if helpCastIds, ok := requestData["helpCastIds"].([]interface{}); ok {
		for _, castId := range helpCastIds {
			var castIdUint uint
			switch v := castId.(type) {
			case float64:
				castIdUint = uint(v)
			case int:
				castIdUint = uint(v)
			default:
				continue
			}
			// 指定されたキャストが現在のユーザーのものか確認
			var cast models.Cast
			if err := tx.Where("user_id = ? AND id = ?", userID, castIdUint).First(&cast).Error; err != nil {
				// ユーザーのキャストでない場合はスキップ
				continue
			}
			tableCast := models.TableCast{
				TableID: record.ID,
				CastID:  castIdUint,
				Role:    "help",
			}
			if err := tx.Create(&tableCast).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
		}
	}

	tx.Commit()

	// 更新したレコードを取得して返す（トランザクション内で取得）
	recordMap := h.buildTableRecordMap(record, userID)
	c.JSON(http.StatusOK, recordMap)
}

// Delete 卓記録を削除
func (h *TableHandler) Delete(c *gin.Context) {
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

	if err := h.db.Where("user_id = ? AND id = ?", userID, id).Delete(&models.TableRecord{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Deleted"})
}

// BulkCreate 複数の卓記録を一括作成
func (h *TableHandler) BulkCreate(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "認証が必要です"})
		return
	}

	var records []models.TableRecord
	if err := c.ShouldBindJSON(&records); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// IDを無視（自動生成）、ユーザーIDを設定
	for i := range records {
		records[i].ID = 0
		records[i].UserID = userID
	}

	if err := h.db.Create(&records).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, records)
}

// CreateTableHime 卓と姫の関連を作成
func (h *TableHandler) CreateTableHime(c *gin.Context) {
	var tableHime models.TableHime
	if err := c.ShouldBindJSON(&tableHime); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// IDを無視（自動生成）
	tableHime.ID = 0

	if err := h.db.Create(&tableHime).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, tableHime)
}

// BulkCreateTableHime 複数の卓と姫の関連を一括作成
func (h *TableHandler) BulkCreateTableHime(c *gin.Context) {
	var tableHimes []models.TableHime
	if err := c.ShouldBindJSON(&tableHimes); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// IDを無視（自動生成）
	for i := range tableHimes {
		tableHimes[i].ID = 0
	}

	if err := h.db.Create(&tableHimes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, tableHimes)
}

// CreateTableCast 卓とキャストの関連を作成
func (h *TableHandler) CreateTableCast(c *gin.Context) {
	var tableCast models.TableCast
	if err := c.ShouldBindJSON(&tableCast); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// IDを無視（自動生成）
	tableCast.ID = 0

	if err := h.db.Create(&tableCast).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, tableCast)
}

// BulkCreateTableCast 複数の卓とキャストの関連を一括作成
func (h *TableHandler) BulkCreateTableCast(c *gin.Context) {
	var tableCasts []models.TableCast
	if err := c.ShouldBindJSON(&tableCasts); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// IDを無視（自動生成）
	for i := range tableCasts {
		tableCasts[i].ID = 0
	}

	if err := h.db.Create(&tableCasts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, tableCasts)
}
