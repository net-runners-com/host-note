package services

import (
	"fmt"
	"log"
	"strconv"
	"time"

	"github.com/hostnote/server/internal/models"
	"gorm.io/gorm"
)

// NotificationScheduler 通知スケジューラー
type NotificationScheduler struct {
	db *gorm.DB
}

// NewNotificationScheduler 通知スケジューラーを作成
func NewNotificationScheduler(db *gorm.DB) *NotificationScheduler {
	return &NotificationScheduler{db: db}
}

// Start 通知スケジューラーを開始（1分ごとにチェック）
func (ns *NotificationScheduler) Start() {
	ticker := time.NewTicker(1 * time.Minute)
	go func() {
		for range ticker.C {
			ns.checkAndSendNotifications()
		}
	}()
	log.Println("✅ Notification scheduler started")
}

// checkAndSendNotifications 通知をチェックして送信
func (ns *NotificationScheduler) checkAndSendNotifications() {
	// 来店予定通知をチェック
	ns.checkVisitNotifications()
	// 誕生日通知をチェック
	ns.checkBirthdayNotifications()
}

// checkVisitNotifications 来店予定通知をチェック
func (ns *NotificationScheduler) checkVisitNotifications() {
	now := time.Now()
	
	// 通知設定を取得（デフォルト: 30分前）
	notificationMinutes := 30
	var setting models.Setting
	if err := ns.db.Where("key = ?", "visit_notification_minutes").First(&setting).Error; err == nil {
		if minutes, err := parseInt(setting.Value); err == nil && minutes > 0 {
			notificationMinutes = minutes
		}
	}

	// 通知を送信すべき時間範囲を計算
	notificationTime := now.Add(time.Duration(notificationMinutes) * time.Minute)
	startTime := notificationTime.Add(-1 * time.Minute) // 1分のバッファ
	endTime := notificationTime.Add(1 * time.Minute)

	// 通知未送信の来店予定を取得
	var schedules []models.Schedule
	if err := ns.db.
		Where("scheduled_datetime >= ? AND scheduled_datetime <= ? AND notification_sent = ?", startTime, endTime, false).
		Preload("Hime").
		Preload("User").
		Find(&schedules).Error; err != nil {
		log.Printf("Error fetching schedules for notification: %v", err)
		return
	}

	for _, schedule := range schedules {
		// ユーザーのプッシュトークンを取得
		var tokens []models.PushToken
		if err := ns.db.Where("user_id = ?", schedule.UserID).Find(&tokens).Error; err != nil {
			log.Printf("Error fetching push tokens for user %d: %v", schedule.UserID, err)
			continue
		}

		if len(tokens) == 0 {
			continue
		}

		// 通知を送信
		himeName := "不明"
		if schedule.Hime != nil {
			himeName = schedule.Hime.Name
		}

		title := "来店予定のお知らせ"
		body := himeName + "さんの来店予定が" + formatDuration(notificationMinutes) + "後です"
		
		tokenStrings := make([]string, len(tokens))
		for i, t := range tokens {
			tokenStrings[i] = t.Token
		}

		data := map[string]string{
			"type":       "visit",
			"scheduleId": fmt.Sprintf("%d", schedule.ID),
			"himeId":     fmt.Sprintf("%d", schedule.HimeID),
		}

		if err := SendNotificationToMultiple(tokenStrings, title, body, data); err != nil {
			log.Printf("Error sending visit notification: %v", err)
			continue
		}

		// 通知送信済みフラグを更新
		schedule.NotificationSent = true
		if err := ns.db.Save(&schedule).Error; err != nil {
			log.Printf("Error updating schedule notification_sent flag: %v", err)
		}
	}
}

// checkBirthdayNotifications 誕生日通知をチェック
func (ns *NotificationScheduler) checkBirthdayNotifications() {
	now := time.Now()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())

	// 通知設定を取得（デフォルト: 1日前）
	notificationDays := 1
	var setting models.Setting
	if err := ns.db.Where("key = ?", "birthday_notification_days").First(&setting).Error; err == nil {
		if days, err := parseInt(setting.Value); err == nil && days >= 0 {
			notificationDays = days
		}
	}

	// 通知を送信すべき日付を計算
	targetDate := today.AddDate(0, 0, notificationDays)
	targetMonth := int(targetDate.Month())
	targetDay := targetDate.Day()

	// 今日が通知日でない場合はスキップ
	if notificationDays > 0 && (now.Month() != time.Month(targetMonth) || now.Day() != targetDay) {
		return
	}

	// 誕生日が該当日の姫を取得
	var himes []models.Hime
	if err := ns.db.
		Where("birthday IS NOT NULL AND birthday != ''").
		Preload("User").
		Find(&himes).Error; err != nil {
		log.Printf("Error fetching himes for birthday notification: %v", err)
		return
	}

	// 誕生日が該当日のキャストを取得
	var casts []models.Cast
	if err := ns.db.
		Where("birthday IS NOT NULL AND birthday != '' AND user_id IS NOT NULL").
		Preload("User").
		Find(&casts).Error; err != nil {
		log.Printf("Error fetching casts for birthday notification: %v", err)
		return
	}

	// 誕生日が該当日の人物をフィルタリング
	birthdayPeople := []struct {
		name   string
		userID uint
	}{}

	for _, hime := range himes {
		if hime.Birthday != nil && *hime.Birthday != "" {
			birthday, err := time.Parse("2006-01-02", *hime.Birthday)
			if err != nil {
				continue
			}
			if int(birthday.Month()) == targetMonth && birthday.Day() == targetDay {
				birthdayPeople = append(birthdayPeople, struct {
					name   string
					userID uint
				}{name: hime.Name, userID: hime.UserID})
			}
		}
	}

	for _, cast := range casts {
		if cast.Birthday != nil && *cast.Birthday != "" && cast.UserID != nil {
			birthday, err := time.Parse("2006-01-02", *cast.Birthday)
			if err != nil {
				continue
			}
			if int(birthday.Month()) == targetMonth && birthday.Day() == targetDay {
				birthdayPeople = append(birthdayPeople, struct {
					name   string
					userID uint
				}{name: cast.Name, userID: *cast.UserID})
			}
		}
	}

	// ユーザーごとに通知を送信
	userNotifications := make(map[uint][]string)
	for _, person := range birthdayPeople {
		userNotifications[person.userID] = append(userNotifications[person.userID], person.name)
	}

	for userID, names := range userNotifications {
		// ユーザーのプッシュトークンを取得
		var tokens []models.PushToken
		if err := ns.db.Where("user_id = ?", userID).Find(&tokens).Error; err != nil {
			log.Printf("Error fetching push tokens for user %d: %v", userID, err)
			continue
		}

		if len(tokens) == 0 {
			continue
		}

		// 通知を送信
		title := "誕生日のお知らせ"
		body := ""
		if notificationDays == 0 {
			body = "今日は" + names[0] + "さんの誕生日です！"
		} else {
			body = names[0] + "さんの誕生日まであと" + formatDays(notificationDays) + "です"
		}
		if len(names) > 1 {
			body += fmt.Sprintf("（他%d名）", len(names)-1)
		}

		tokenStrings := make([]string, len(tokens))
		for i, t := range tokens {
			tokenStrings[i] = t.Token
		}

		data := map[string]string{
			"type": "birthday",
		}

		if err := SendNotificationToMultiple(tokenStrings, title, body, data); err != nil {
			log.Printf("Error sending birthday notification: %v", err)
		}
	}
}

// parseInt 文字列を整数に変換
func parseInt(s string) (int, error) {
	return strconv.Atoi(s)
}

// formatDuration 分を文字列に変換
func formatDuration(minutes int) string {
	if minutes < 60 {
		return fmt.Sprintf("%d分", minutes)
	}
	hours := minutes / 60
	mins := minutes % 60
	if mins == 0 {
		return fmt.Sprintf("%d時間", hours)
	}
	return fmt.Sprintf("%d時間%d分", hours, mins)
}

// formatDays 日数を文字列に変換
func formatDays(days int) string {
	return fmt.Sprintf("%d日", days)
}

