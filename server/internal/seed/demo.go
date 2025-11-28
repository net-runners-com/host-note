package seed

import (
	"errors"
	"fmt"
	"log"
	"math"
	"math/rand"
	"time"

	"github.com/google/uuid"
	"github.com/hostnote/server/internal/models"
	"gorm.io/gorm"
)

const (
	targetCastCount     = 20
	targetHimeCount     = 50
	targetTableCount    = 100
	targetScheduleCount = 30
	targetVisitCount    = 80
)

var (
	castFamilyNames = []string{"如月", "天城", "一ノ瀬", "桐生", "鳳条", "神城", "高峰", "蓮水"}
	castGivenNames  = []string{"蓮", "零", "大和", "隼人", "蒼", "玲央", "旬", "圭"}
	himeFamilyNames = []string{"佐伯", "白石", "桜井", "水瀬", "橘", "綾瀬", "星野", "篠原"}
	himeGivenNames  = []string{"美咲", "彩花", "瑠璃", "楓", "紗良", "雫", "陽菜", "凛"}
	memoTopics      = []string{"シャンパン", "映画", "旅行", "音楽", "スイーツ", "香水", "ペット", "スポーツ"}
	hobbies         = []string{"ダーツ", "カラオケ", "ゴルフ", "カフェ巡り", "アニメ", "ライブ", "ゲーム", "ヨガ"}
	drinks          = []string{"シャンパン", "ワイン", "テキーラ", "ウイスキー", "焼酎", "日本酒"}
	mixers          = []string{"ソーダ割り", "ロック", "水割り", "緑茶割り", "ウーロン割り"}
	cocktails       = []string{"キールロワイヤル", "ベルベットキティ", "ミモザ", "ベリーニ", "シャンパンタワー", "スペシャルボトル"}
	snsBases        = []string{"hostnote", "tokyo_host", "noir_staff", "club_star", "velvet_team", "night_life"}
	scheduleActs    = []string{"同伴", "アフター", "バースデーイベント", "ボトル開栓", "周年イベント"}
	visitTypes      = []string{"normal", "first", "shimei"}
	songTitles      = []string{"Endless Night", "Butterfly", "Lapis", "Eclipse", "Mirage"}
	artists         = []string{"Shion", "Luna", "Kaito", "Rei", "Asuka"}
	addressAreas    = []string{"銀座", "歌舞伎町", "六本木", "麻布", "渋谷", "恵比寿"}
	memoEndings     = []string{"次回は新作ボトルを提案する", "甘いカクテルが好き", "海外旅行の話題が鉄板", "サプライズに弱い"}
)

// RunDemoData テストデータをシードする
func RunDemoData(db *gorm.DB, opts Options) error {
	rand.Seed(time.Now().UnixNano())

	if opts.Force {
		log.Println("⚠️  Force option enabled: truncating demo data tables before seeding")
		if err := truncateDemoTables(db); err != nil {
			return fmt.Errorf("truncate demo tables: %w", err)
		}
	}

	return db.Transaction(func(tx *gorm.DB) error {
		user, err := ensureDemoUser(tx)
		if err != nil {
			return err
		}

		casts, err := ensureCasts(tx, user)
		if err != nil {
			return err
		}

		himes, err := ensureHimes(tx, casts, user)
		if err != nil {
			return err
		}

		if err := ensureSchedules(tx, himes, user); err != nil {
			return err
		}

		if err := ensureVisits(tx, himes, user); err != nil {
			return err
		}

		if err := ensureTables(tx, himes, casts, user); err != nil {
			return err
		}

		log.Println("✅ Demo data is ready. You can log in with username \"demo\" and password \"password123\".")
		return nil
	})
}

// truncateDemoTables テストデータ用のテーブルのみを削除
func truncateDemoTables(db *gorm.DB) error {
	// 外部キー制約を無効化
	if err := db.Exec("SET FOREIGN_KEY_CHECKS = 0").Error; err != nil {
		return err
	}

	// テストデータ用のテーブルのみを削除（マスターデータは残す）
	tables := []string{
		"table_cast",
		"table_hime",
		"table_record",
		"visit_record",
		"schedule",
		"push_tokens",
		"oauth_account",
		"hime",
		"cast",
		"user",
	}

	for _, table := range tables {
		// DELETE FROMを使用（TRUNCATEは外部キー制約があると失敗する場合がある）
		if err := db.Exec(fmt.Sprintf("DELETE FROM %s", table)).Error; err != nil {
			// テーブルが存在しない場合はスキップ
			if !errors.Is(err, gorm.ErrRecordNotFound) {
				log.Printf("⚠️  Skipping delete for %s: %v", table, err)
			}
		}
	}

	// 外部キー制約を再有効化
	return db.Exec("SET FOREIGN_KEY_CHECKS = 1").Error
}

func ensureDemoUser(db *gorm.DB) (*models.User, error) {
	var user models.User
	if err := db.Where("username = ?", "demo").First(&user).Error; err != nil {
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, err
		}

		email := "demo@example.com"
		password := "password123"
		user = models.User{
			Username: "demo",
			Email:    &email,
			Password: &password, // hashed by BeforeCreate
		}

		if err := db.Create(&user).Error; err != nil {
			return nil, err
		}

		log.Println("• Created demo user (username: demo, password: password123)")
	}

	return &user, nil
}

func ensureCasts(db *gorm.DB, user *models.User) ([]models.Cast, error) {
	var casts []models.Cast
	if err := db.Find(&casts).Error; err != nil {
		return nil, err
	}

	myCastExists := false
	for _, c := range casts {
		if c.UserID != nil && *c.UserID == user.ID {
			myCastExists = true
			break
		}
	}

	if !myCastExists {
		cast := randomCast(randomCastName())
		cast.UserID = ptr(user.ID)
		if err := db.Create(&cast).Error; err != nil {
			return nil, err
		}
		casts = append(casts, cast)
	}

	for len(casts) < targetCastCount {
		cast := randomCast(randomCastName())
		if err := db.Create(&cast).Error; err != nil {
			return nil, err
		}
		casts = append(casts, cast)
	}

	return casts, nil
}

func ensureHimes(db *gorm.DB, casts []models.Cast, user *models.User) ([]models.Hime, error) {
	if len(casts) == 0 {
		return nil, errors.New("no casts available to attach hime data")
	}

	var himes []models.Hime
	if err := db.Find(&himes).Error; err != nil {
		return nil, err
	}

	for len(himes) < targetHimeCount {
		tanto := casts[rand.Intn(len(casts))]
		hime := randomHime(tanto.ID)
		hime.UserID = user.ID
		if err := db.Create(&hime).Error; err != nil {
			return nil, err
		}
		himes = append(himes, hime)
	}

	return himes, nil
}

func ensureSchedules(db *gorm.DB, himes []models.Hime, user *models.User) error {
	if len(himes) == 0 {
		return nil
	}

	var count int64
	if err := db.Model(&models.Schedule{}).Count(&count).Error; err != nil {
		return err
	}

	for int(count) < targetScheduleCount {
		hime := himes[rand.Intn(len(himes))]
		// 過去7日から未来30日間の範囲でランダムに日時を生成
		daysAhead := randRange(-7, 30)
		startHour := randRange(18, 24)
		datetime := time.Now().AddDate(0, 0, daysAhead).Truncate(24 * time.Hour).Add(time.Duration(startHour) * time.Hour)
		memo := randomScheduleMemo(hime.Name)
		schedule := models.Schedule{
			UserID:            user.ID,
			HimeID:            hime.ID,
			ScheduledDatetime: datetime,
			Memo:              ptr(memo),
		}

		if err := db.Create(&schedule).Error; err != nil {
			return err
		}
		count++
	}

	return nil
}

func ensureVisits(db *gorm.DB, himes []models.Hime, user *models.User) error {
	if len(himes) == 0 {
		return nil
	}

	var count int64
	if err := db.Model(&models.VisitRecord{}).Count(&count).Error; err != nil {
		return err
	}

	for int(count) < targetVisitCount {
		hime := himes[rand.Intn(len(himes))]
		// 過去90日間の範囲でランダムに来店日を生成
		visitDate := time.Now().AddDate(0, 0, -randRange(1, 90)).Add(time.Duration(randRange(19, 25)) * time.Hour)
		memo := randomVisitMemo()
		visit := models.VisitRecord{
			UserID:    user.ID,
			HimeID:    hime.ID,
			VisitDate: visitDate,
			Memo:      ptr(memo),
		}

		if err := db.Create(&visit).Error; err != nil {
			return err
		}
		count++
	}

	return nil
}

func ensureTables(db *gorm.DB, himes []models.Hime, casts []models.Cast, user *models.User) error {
	if len(himes) == 0 || len(casts) == 0 {
		return nil
	}

	// メニューを取得（共通データのためuser_idでフィルタしない）
	var menus []models.Menu
	if err := db.Find(&menus).Error; err != nil {
		return err
	}

	var count int64
	if err := db.Model(&models.TableRecord{}).Count(&count).Error; err != nil {
		return err
	}

	for int(count) < targetTableCount {
		// 過去90日間の範囲でランダムに日時を生成
		tableRecord := randomTableRecord(menus)
		tableRecord.UserID = user.ID
		if err := db.Create(&tableRecord).Error; err != nil {
			return err
		}

		himeCount := clamp(randRange(1, 4), len(himes))
		for _, hime := range pickRandom(himes, himeCount) {
			link := models.TableHime{
				TableID: tableRecord.ID,
				HimeID:  hime.ID,
			}
			if err := db.Create(&link).Error; err != nil {
				return err
			}
		}

		castCount := clamp(randRange(1, 3), len(casts))
		selectedCasts := pickRandom(casts, castCount)
		for idx, cast := range selectedCasts {
			role := "main"
			if idx > 0 {
				role = "help"
			}
			link := models.TableCast{
				TableID: tableRecord.ID,
				CastID:  cast.ID,
				Role:    role,
			}
			if err := db.Create(&link).Error; err != nil {
				return err
			}
		}

		count++
	}

	return nil
}

func randomCast(name string) models.Cast {
	photo := randomPhotoURL("cast")
	return models.Cast{
		Name:              name,
		PhotoURL:          ptr(photo),
		Photos:            models.Photos{photo},
		SnsInfo:           randomSnsInfo(),
		Birthday:          randomBirthday(),
		ChampagneCallSong: ptr(randomSong()),
		Memos:             randomMemos(),
	}
}

func randomHime(tantoCastID uint) models.Hime {
	photo := randomPhotoURL("hime")
	return models.Hime{
		Name:             randomHimeName(),
		PhotoURL:         ptr(photo),
		Photos:           models.Photos{photo},
		SnsInfo:          randomSnsInfo(),
		Birthday:         randomBirthday(),
		IsFirstVisit:     rand.Intn(2) == 0,
		TantoCastID:      ptr(tantoCastID),
		DrinkPreference:  ptr(randomChoice(drinks)),
		MixerPreference:  ptr(randomChoice(mixers)),
		Memos:            randomMemos(),
	}
}

func randomTableRecord(menus []models.Menu) models.TableRecord {
	tableNumber := fmt.Sprintf("T-%02d", randRange(1, 30))
	memo := randomTableMemo()
	// 過去90日間の範囲でランダムに日時を生成
	date := time.Now().Add(-time.Duration(randRange(1, 90)) * 24 * time.Hour).Add(time.Duration(randRange(18, 26)) * time.Hour)

	return models.TableRecord{
		Datetime:    date,
		TableNumber: ptr(tableNumber),
		Memo:        ptr(memo),
		SalesInfo:   buildSalesInfo(menus),
	}
}

func buildSalesInfo(menus []models.Menu) *models.SalesInfo {
	orderCount := randRange(1, 5)
	items := make([]models.OrderItem, 0, orderCount)
	var ordersTotal float64

	// メニューが存在する場合はメニューから選択、存在しない場合はランダム生成
	if len(menus) > 0 {
		for i := 0; i < orderCount; i++ {
			menu := menus[rand.Intn(len(menus))]
			qty := randRange(1, 3)
			amount := float64(qty) * menu.Price
			items = append(items, models.OrderItem{
				Name:      menu.Name,
				Quantity:  qty,
				UnitPrice: menu.Price,
				Amount:    amount,
			})
			ordersTotal += amount
		}
	} else {
		// メニューが存在しない場合は従来の方法で生成
		for i := 0; i < orderCount; i++ {
			qty := randRange(1, 3)
			unitPrice := float64(randRange(12, 45)) * 1000
			amount := float64(qty) * unitPrice
			items = append(items, models.OrderItem{
				Name:      randomChoice(cocktails),
				Quantity:  qty,
				UnitPrice: unitPrice,
				Amount:    amount,
			})
			ordersTotal += amount
		}
	}

	tableCharge := 5000.0
	shimeiFee := 3000.0
	subtotal := ordersTotal + tableCharge + shimeiFee
	taxRate := 0.1
	tax := math.Round(subtotal*taxRate*100) / 100
	total := subtotal + tax

	return &models.SalesInfo{
		TableCharge: tableCharge,
		OrderItems:  items,
		VisitType:   randomChoice(visitTypes),
		StayHours:   randomStayHours(),
		ShimeiFee:   shimeiFee,
		Subtotal:    subtotal,
		TaxRate:     taxRate,
		Tax:         tax,
		Total:       total,
	}
}

func randomMemos() models.Memos {
	count := randRange(1, 2)
	memos := make(models.Memos, 0, count)
	for i := 0; i < count; i++ {
		memos = append(memos, models.Memo{
			ID:        uuid.NewString(),
			Content:   randomMemoSentence(),
			CreatedAt: time.Now().Add(-time.Duration(randRange(1, 90)) * 24 * time.Hour).Format(time.RFC3339),
		})
	}
	return memos
}

func randomSnsInfo() *models.SnsInfo {
	twitterHandle := randomUsername()
	instaHandle := randomUsername()
	lineHandle := fmt.Sprintf("line_%d", randRange(1000, 9999))

	return &models.SnsInfo{
		Twitter: &models.SnsAccount{
			Username: ptr(twitterHandle),
			URL:      ptr(fmt.Sprintf("https://twitter.com/%s", twitterHandle)),
		},
		Instagram: &models.SnsAccount{
			Username: ptr(instaHandle),
			URL:      ptr(fmt.Sprintf("https://instagram.com/%s", instaHandle)),
		},
		Line: &models.SnsAccount{
			Username: ptr(lineHandle),
			URL:      ptr("https://line.me"),
		},
	}
}

func randomBirthday() *string {
	start := time.Now().AddDate(-40, 0, 0).Unix()
	end := time.Now().AddDate(-20, 0, 0).Unix()
	value := time.Unix(rand.Int63n(end-start)+start, 0).Format("2006-01-02")
	return ptr(value)
}

func randomCastName() string {
	return fmt.Sprintf("%s %s", randomChoice(castFamilyNames), randomChoice(castGivenNames))
}

func randomHimeName() string {
	return fmt.Sprintf("%s %s", randomChoice(himeFamilyNames), randomChoice(himeGivenNames))
}

func randomPhotoURL(prefix string) string {
	return fmt.Sprintf("https://picsum.photos/seed/%s-%d/400/400", prefix, rand.Int63())
}

func randomSong() string {
	return fmt.Sprintf("%s / %s", randomChoice(songTitles), randomChoice(artists))
}

func randomScheduleMemo(name string) string {
	return fmt.Sprintf("%s様と%s（%s集合）", name, randomChoice(scheduleActs), randomChoice(addressAreas))
}

func randomVisitMemo() string {
	return fmt.Sprintf("%sを開けて%sで乾杯", randomChoice(drinks), randomChoice(scheduleActs))
}

func randomTableMemo() string {
	return fmt.Sprintf("%sと%sの話題で盛り上がった。%s。", randomChoice(memoTopics), randomChoice(hobbies), randomChoice(memoEndings))
}

func randomMemoSentence() string {
	return fmt.Sprintf("%sが好きで、最近は%sに夢中。", randomChoice(memoTopics), randomChoice(hobbies))
}

func randomStayHours() float64 {
	return float64(randRange(10, 35)) / 10
}

func randomUsername() string {
	return fmt.Sprintf("%s_%d", randomChoice(snsBases), randRange(100, 9999))
}

func randRange(min, max int) int {
	if max <= min {
		return min
	}
	return rand.Intn(max-min+1) + min
}

func randomChoice(values []string) string {
	if len(values) == 0 {
		return ""
	}
	return values[rand.Intn(len(values))]
}

func pickRandom[T any](items []T, count int) []T {
	if count >= len(items) {
		copied := make([]T, len(items))
		copy(copied, items)
		return copied
	}

	perm := rand.Perm(len(items))
	result := make([]T, 0, count)
	for i := 0; i < count; i++ {
		result = append(result, items[perm[i]])
	}
	return result
}

func clamp(value, max int) int {
	if max <= 0 {
		return 0
	}
	if value > max {
		return max
	}
	if value < 1 {
		return 1
	}
	return value
}

func ptr[T any](v T) *T {
	return &v
}

