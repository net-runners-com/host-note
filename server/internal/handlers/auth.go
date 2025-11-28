package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/hostnote/server/internal/config"
	"github.com/hostnote/server/internal/models"
	"golang.org/x/crypto/bcrypt"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"gorm.io/gorm"
)

type AuthHandler struct {
	db *gorm.DB
}

func NewAuthHandler(db *gorm.DB) *AuthHandler {
	return &AuthHandler{db: db}
}

type RegisterRequest struct {
	Username string `json:"username" binding:"required,min=3,max=50"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type AuthResponse struct {
	Token string    `json:"token"`
	User  *UserInfo `json:"user"`
}

type UserInfo struct {
	ID       uint    `json:"id"`
	Username string  `json:"username"`
	Email    *string `json:"email"`
}

type ChangePasswordRequest struct {
	CurrentPassword string `json:"currentPassword" binding:"required"`
	NewPassword     string `json:"newPassword" binding:"required,min=6"`
}

type UpdateEmailRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type DeleteAccountRequest struct {
	// パスワード確認は不要
}

// Register ユーザー登録
func (h *AuthHandler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ユーザー名の重複チェック
	var existingUser models.User
	if err := h.db.Where("username = ?", req.Username).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "このユーザー名は既に使用されています"})
		return
	}

	if err := h.db.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "このメールアドレスは既に使用されています"})
		return
	}

	// ユーザー作成
	password := req.Password
	user := models.User{
		Username: req.Username,
		Email:    &req.Email,
		Password: &password, // BeforeCreateフックでハッシュ化される
	}

	if err := h.db.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ユーザー作成に失敗しました"})
		return
	}

	// JWTトークンを生成
	token, err := generateToken(user.ID, user.Username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "トークン生成に失敗しました"})
		return
	}

	c.JSON(http.StatusCreated, AuthResponse{
		Token: token,
		User: &UserInfo{
			ID:       user.ID,
			Username: user.Username,
			Email:    user.Email,
		},
	})
}

// Login ログイン
func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ユーザーを検索
	var user models.User
	if err := h.db.Where("username = ?", req.Username).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "ユーザー名またはパスワードが正しくありません"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ログインに失敗しました"})
		return
	}

	// パスワードを検証
	if !user.CheckPassword(req.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "ユーザー名またはパスワードが正しくありません"})
		return
	}

	// JWTトークンを生成
	token, err := generateToken(user.ID, user.Username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "トークン生成に失敗しました"})
		return
	}

	c.JSON(http.StatusOK, AuthResponse{
		Token: token,
		User: &UserInfo{
			ID:       user.ID,
			Username: user.Username,
			Email:    user.Email,
		},
	})
}

// Me 現在のユーザー情報を取得
func (h *AuthHandler) Me(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "認証が必要です"})
		return
	}

	var user models.User
	if err := h.db.First(&user, userID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "ユーザーが見つかりません"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ユーザー情報の取得に失敗しました"})
		return
	}

	c.JSON(http.StatusOK, UserInfo{
		ID:       user.ID,
		Username: user.Username,
		Email:    user.Email,
	})
}

// ChangePassword パスワードを変更
func (h *AuthHandler) ChangePassword(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "認証が必要です"})
		return
	}

	var req ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := h.db.First(&user, userID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "ユーザーが見つかりません"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ユーザー情報の取得に失敗しました"})
		return
	}

	if !user.CheckPassword(req.CurrentPassword) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "現在のパスワードが正しくありません"})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "パスワードの更新に失敗しました"})
		return
	}

	hashedStr := string(hashedPassword)
	if err := h.db.Model(&user).Update("password", hashedStr).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "パスワードの更新に失敗しました"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "パスワードを変更しました"})
}

// UpdateEmail メールアドレスを更新
func (h *AuthHandler) UpdateEmail(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "認証が必要です"})
		return
	}

	var req UpdateEmailRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := h.db.First(&user, userID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "ユーザーが見つかりません"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ユーザー情報の取得に失敗しました"})
		return
	}

	if !user.CheckPassword(req.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "パスワードが正しくありません"})
		return
	}

	var existing models.User
	if err := h.db.Where("email = ? AND id != ?", req.Email, user.ID).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "このメールアドレスは既に使用されています"})
		return
	}

	user.Email = &req.Email
	if err := h.db.Model(&user).Update("email", req.Email).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "メールアドレスの更新に失敗しました"})
		return
	}

	c.JSON(http.StatusOK, UserInfo{
		ID:       user.ID,
		Username: user.Username,
		Email:    user.Email,
	})
}

// DeleteAccount アカウントを削除
func (h *AuthHandler) DeleteAccount(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "認証が必要です"})
		return
	}

	// リクエストボディは空でも可（パスワード確認不要）
	var req DeleteAccountRequest
	_ = c.ShouldBindJSON(&req) // エラーは無視（空のJSONでもOK）

	var user models.User
	if err := h.db.First(&user, userID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "ユーザーが見つかりません"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ユーザー情報の取得に失敗しました"})
		return
	}

	// トランザクション内で関連データを削除
	// 外部キー制約を考慮して、子テーブルから親テーブルへ削除する順序が重要
	err := h.db.Transaction(func(tx *gorm.DB) error {
		// 1. 中間テーブル（外部キー制約のないテーブル）を削除
		// TableHime, TableCastはTableRecordに依存しているため、後で削除

		// 2. TableRecordに関連する中間テーブルを削除
		var tableRecords []models.TableRecord
		if err := tx.Where("user_id = ?", user.ID).Find(&tableRecords).Error; err != nil {
			return fmt.Errorf("卓記録の取得に失敗: %w", err)
		}
		for _, tr := range tableRecords {
			// TableHimeを削除
			if err := tx.Where("table_id = ?", tr.ID).Delete(&models.TableHime{}).Error; err != nil {
				return fmt.Errorf("TableHimeの削除に失敗: %w", err)
			}
			// TableCastを削除
			if err := tx.Where("table_id = ?", tr.ID).Delete(&models.TableCast{}).Error; err != nil {
				return fmt.Errorf("TableCastの削除に失敗: %w", err)
			}
		}

		// 3. user_idを参照するテーブルを削除（外部キー制約がある）
		// TableRecordを削除
		if err := tx.Where("user_id = ?", user.ID).Delete(&models.TableRecord{}).Error; err != nil {
			return fmt.Errorf("卓記録の削除に失敗: %w", err)
		}

		// VisitRecordを削除
		if err := tx.Where("user_id = ?", user.ID).Delete(&models.VisitRecord{}).Error; err != nil {
			return fmt.Errorf("来店記録の削除に失敗: %w", err)
		}

		// Scheduleを削除
		if err := tx.Where("user_id = ?", user.ID).Delete(&models.Schedule{}).Error; err != nil {
			return fmt.Errorf("スケジュールの削除に失敗: %w", err)
		}

		// Himeを削除
		if err := tx.Where("user_id = ?", user.ID).Delete(&models.Hime{}).Error; err != nil {
			return fmt.Errorf("姫の削除に失敗: %w", err)
		}

		// Castを削除（user_idがNULL可だが、該当するレコードを削除）
		if err := tx.Where("user_id = ?", user.ID).Delete(&models.Cast{}).Error; err != nil {
			return fmt.Errorf("キャストの削除に失敗: %w", err)
		}

		// 4. OAuthアカウントを削除
		if err := tx.Where("user_id = ?", user.ID).Delete(&models.OAuthAccount{}).Error; err != nil {
			return fmt.Errorf("OAuthアカウントの削除に失敗: %w", err)
		}

		// 5. プッシュトークンを削除
		if err := tx.Where("user_id = ?", user.ID).Delete(&models.PushToken{}).Error; err != nil {
			return fmt.Errorf("プッシュトークンの削除に失敗: %w", err)
		}

		// 6. 最後にユーザーを論理削除（soft delete）
		if err := tx.Delete(&user).Error; err != nil {
			return fmt.Errorf("ユーザーの削除に失敗: %w", err)
		}

		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("アカウントの削除に失敗しました: %v", err)})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "アカウントを削除しました"})
}

// generateToken JWTトークンを生成
func generateToken(userID uint, username string) (string, error) {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "your-secret-key-change-in-production" // 本番環境では必ず変更
	}

	claims := jwt.MapClaims{
		"userID":   userID,
		"username": username,
		"exp":      time.Now().Add(time.Hour * 24 * 7).Unix(), // 7日間有効
		"iat":      time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

// GoogleOAuthConfig Google OAuth設定を取得
func getGoogleOAuthConfig() *oauth2.Config {
	return &oauth2.Config{
		ClientID:     config.AppConfig.GoogleClientID,
		ClientSecret: config.AppConfig.GoogleClientSecret,
		RedirectURL:  config.AppConfig.GoogleRedirectURL,
		Scopes: []string{
			"https://www.googleapis.com/auth/userinfo.email",
			"https://www.googleapis.com/auth/userinfo.profile",
		},
		Endpoint: google.Endpoint,
	}
}

// GoogleUserInfo Googleから取得したユーザー情報
type GoogleUserInfo struct {
	ID            string `json:"id"`
	Email         string `json:"email"`
	VerifiedEmail bool   `json:"verified_email"`
	Name          string `json:"name"`
	Picture       string `json:"picture"`
}

// GoogleLogin Google OAuth認証の開始
func (h *AuthHandler) GoogleLogin(c *gin.Context) {
	oauthConfig := getGoogleOAuthConfig()
	if oauthConfig.ClientID == "" || oauthConfig.ClientSecret == "" {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Google OAuthが設定されていません",
			"debug": gin.H{
				"clientID":     oauthConfig.ClientID,
				"clientSecret": oauthConfig.ClientSecret != "",
				"redirectURL":  oauthConfig.RedirectURL,
			},
		})
		return
	}

	// CSRF対策のstateを生成
	state := generateStateToken()
	// stateをセッションやクッキーに保存（簡易的にクッキーを使用）
	c.SetCookie("oauth_state", state, 600, "/", "", false, true)

	// Google認証URLにリダイレクト
	url := oauthConfig.AuthCodeURL(state, oauth2.AccessTypeOffline)
	c.Redirect(http.StatusTemporaryRedirect, url)
}

// GoogleCallbackRequest フロントエンドから送信されるGoogleアクセストークン
type GoogleCallbackRequest struct {
	AccessToken string `json:"accessToken" binding:"required"`
}

// GoogleCallbackFromFrontend フロントエンドから送信されたGoogleアクセストークンを処理
func (h *AuthHandler) GoogleCallbackFromFrontend(c *gin.Context) {
	var req GoogleCallbackRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "アクセストークンが必要です"})
		return
	}

	// Googleアクセストークンでユーザー情報を取得
	client := &http.Client{}
	reqGoogle, err := http.NewRequest("GET", "https://www.googleapis.com/oauth2/v2/userinfo", nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "リクエストの作成に失敗しました"})
		return
	}
	reqGoogle.Header.Set("Authorization", "Bearer "+req.AccessToken)

	resp, err := client.Do(reqGoogle)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ユーザー情報の取得に失敗しました"})
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Googleアクセストークンが無効です"})
		return
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ユーザー情報の読み込みに失敗しました"})
		return
	}

	var googleUser GoogleUserInfo
	if err := json.Unmarshal(body, &googleUser); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ユーザー情報の解析に失敗しました"})
		return
	}

	// 既存のOAuthAccountを検索
	var oauthAccount models.OAuthAccount
	err = h.db.Where("provider = ? AND provider_id = ?", "google", googleUser.ID).
		First(&oauthAccount).Error

	var user models.User

	if err == nil {
		// 既存ユーザー: OAuthAccountが見つかった
		if err := h.db.First(&user, oauthAccount.UserID).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ユーザー情報の取得に失敗しました"})
			return
		}
	} else if err == gorm.ErrRecordNotFound {
		// 新規ユーザーまたは既存ユーザーにOAuthアカウントを追加
		// メールアドレスで既存ユーザーを検索
		var existingUser models.User
		if googleUser.Email != "" {
			h.db.Where("email = ?", googleUser.Email).First(&existingUser)
		}

		if existingUser.ID != 0 {
			// 既存ユーザーにOAuthアカウントを紐付け
			user = existingUser
			oauthAccount = models.OAuthAccount{
				UserID:        user.ID,
				Provider:      "google",
				ProviderID:    googleUser.ID,
				ProviderEmail: &googleUser.Email,
			}
			if err := h.db.Create(&oauthAccount).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "OAuthアカウントの作成に失敗しました"})
				return
			}
		} else {
			// 新規ユーザーを作成
			username := generateUsernameFromEmail(h.db, googleUser.Email, googleUser.Name)
			user = models.User{
				Username: username,
				Email:    &googleUser.Email,
				Password: nil, // OAuthユーザーはパスワード不要
			}
			if err := h.db.Create(&user).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "ユーザー作成に失敗しました"})
				return
			}

			oauthAccount = models.OAuthAccount{
				UserID:        user.ID,
				Provider:      "google",
				ProviderID:    googleUser.ID,
				ProviderEmail: &googleUser.Email,
			}
			if err := h.db.Create(&oauthAccount).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "OAuthアカウントの作成に失敗しました"})
				return
			}
		}
	} else {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "データベースエラー"})
		return
	}

	// JWTトークンを生成
	jwtToken, err := generateToken(user.ID, user.Username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "トークン生成に失敗しました"})
		return
	}

	c.JSON(http.StatusOK, AuthResponse{
		Token: jwtToken,
		User: &UserInfo{
			ID:       user.ID,
			Username: user.Username,
			Email:    user.Email,
		},
	})
}

// GoogleCallback Google OAuth認証のコールバック（サーバーサイドフロー用）
func (h *AuthHandler) GoogleCallback(c *gin.Context) {
	// stateの検証
	stateCookie, err := c.Cookie("oauth_state")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "stateが無効です"})
		return
	}

	state := c.Query("state")
	if state == "" || state != stateCookie {
		c.JSON(http.StatusBadRequest, gin.H{"error": "stateが一致しません"})
		return
	}

	// クッキーを削除
	c.SetCookie("oauth_state", "", -1, "/", "", false, true)

	code := c.Query("code")
	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "認証コードが取得できませんでした"})
		return
	}

	oauthConfig := getGoogleOAuthConfig()

	// 認証コードをアクセストークンに交換
	token, err := oauthConfig.Exchange(context.Background(), code)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "トークンの取得に失敗しました"})
		return
	}

	// アクセストークンでユーザー情報を取得
	client := oauthConfig.Client(context.Background(), token)
	resp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ユーザー情報の取得に失敗しました"})
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ユーザー情報の読み込みに失敗しました"})
		return
	}

	var googleUser GoogleUserInfo
	if err := json.Unmarshal(body, &googleUser); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ユーザー情報の解析に失敗しました"})
		return
	}

	// 既存のOAuthAccountを検索
	var oauthAccount models.OAuthAccount
	err = h.db.Where("provider = ? AND provider_id = ?", "google", googleUser.ID).
		First(&oauthAccount).Error

	var user models.User

	if err == nil {
		// 既存ユーザー: OAuthAccountが見つかった
		if err := h.db.First(&user, oauthAccount.UserID).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ユーザー情報の取得に失敗しました"})
			return
		}
	} else if err == gorm.ErrRecordNotFound {
		// 新規ユーザーまたは既存ユーザーにOAuthアカウントを追加
		// メールアドレスで既存ユーザーを検索
		var existingUser models.User
		if googleUser.Email != "" {
			h.db.Where("email = ?", googleUser.Email).First(&existingUser)
		}

		if existingUser.ID != 0 {
			// 既存ユーザーにOAuthアカウントを紐付け
			user = existingUser
			oauthAccount = models.OAuthAccount{
				UserID:        user.ID,
				Provider:      "google",
				ProviderID:    googleUser.ID,
				ProviderEmail: &googleUser.Email,
			}
			if err := h.db.Create(&oauthAccount).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "OAuthアカウントの作成に失敗しました"})
				return
			}
		} else {
			// 新規ユーザーを作成
			username := generateUsernameFromEmail(h.db, googleUser.Email, googleUser.Name)
			user = models.User{
				Username: username,
				Email:    &googleUser.Email,
				Password: nil, // OAuthユーザーはパスワード不要
			}
			if err := h.db.Create(&user).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "ユーザー作成に失敗しました"})
				return
			}

			oauthAccount = models.OAuthAccount{
				UserID:        user.ID,
				Provider:      "google",
				ProviderID:    googleUser.ID,
				ProviderEmail: &googleUser.Email,
			}
			if err := h.db.Create(&oauthAccount).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "OAuthアカウントの作成に失敗しました"})
				return
			}
		}
	} else {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "データベースエラー"})
		return
	}

	// JWTトークンを生成
	jwtToken, err := generateToken(user.ID, user.Username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "トークン生成に失敗しました"})
		return
	}

	// フロントエンドにリダイレクト（トークンをクエリパラメータで渡す）
	// 本番環境では、より安全な方法（HTTP-only cookieなど）を使用することを推奨
	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:5173"
	}
	c.Redirect(http.StatusTemporaryRedirect, fmt.Sprintf("%s/auth/callback?token=%s", frontendURL, jwtToken))
}

// generateStateToken CSRF対策用のstateトークンを生成
func generateStateToken() string {
	// 簡易的な実装（本番環境ではより安全な方法を使用）
	return fmt.Sprintf("%d", time.Now().UnixNano())
}

// generateUsernameFromEmail メールアドレスや名前からユーザー名を生成（重複チェック付き）
func generateUsernameFromEmail(db *gorm.DB, email, name string) string {
	var baseUsername string

	if name != "" {
		// 名前からユーザー名を生成（スペースを削除、小文字に変換）
		baseUsername = strings.ToLower(strings.ReplaceAll(name, " ", ""))
		// 英数字とアンダースコアのみを許可
		baseUsername = strings.Map(func(r rune) rune {
			if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') || r == '_' {
				return r
			}
			return '_'
		}, baseUsername)
	} else {
		// メールアドレスの@より前の部分を使用
		parts := strings.Split(email, "@")
		if len(parts) > 0 {
			baseUsername = parts[0]
		} else {
			baseUsername = fmt.Sprintf("user_%d", time.Now().Unix())
		}
	}

	// 既存ユーザー名と重複しないようにチェック
	username := baseUsername
	counter := 1
	for {
		var existingUser models.User
		if err := db.Where("username = ?", username).First(&existingUser).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				// ユーザー名が使用可能
				break
			}
			// その他のエラー
			return fmt.Sprintf("user_%d", time.Now().Unix())
		}
		// 重複している場合は番号を追加
		username = fmt.Sprintf("%s%d", baseUsername, counter)
		counter++
		// 無限ループ防止（最大100回）
		if counter > 100 {
			return fmt.Sprintf("user_%d", time.Now().Unix())
		}
	}

	return username
}
