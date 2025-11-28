package services

import (
	"testing"
)

// TestNotificationScheduler 通知スケジューラーの基本動作をテスト
func TestNotificationScheduler(t *testing.T) {
	// このテストは実際のデータベース接続が必要なため、
	// 統合テストとして実装する必要があります
	t.Skip("Skipping test that requires database connection")
}

// TestFormatDuration 時間フォーマットのテスト
func TestFormatDuration(t *testing.T) {
	tests := []struct {
		minutes int
		want    string
	}{
		{30, "30分"},
		{60, "1時間"},
		{90, "1時間30分"},
		{120, "2時間"},
		{150, "2時間30分"},
	}

	for _, tt := range tests {
		got := formatDuration(tt.minutes)
		if got != tt.want {
			t.Errorf("formatDuration(%d) = %v, want %v", tt.minutes, got, tt.want)
		}
	}
}

// TestFormatDays 日数フォーマットのテスト
func TestFormatDays(t *testing.T) {
	tests := []struct {
		days int
		want string
	}{
		{0, "0日"},
		{1, "1日"},
		{7, "7日"},
		{30, "30日"},
	}

	for _, tt := range tests {
		got := formatDays(tt.days)
		if got != tt.want {
			t.Errorf("formatDays(%d) = %v, want %v", tt.days, got, tt.want)
		}
	}
}

// TestParseInt 整数パースのテスト
func TestParseInt(t *testing.T) {
	tests := []struct {
		input string
		want  int
		err   bool
	}{
		{"30", 30, false},
		{"1", 1, false},
		{"0", 0, false},
		{"abc", 0, true},
		{"", 0, true},
	}

	for _, tt := range tests {
		got, err := parseInt(tt.input)
		if (err != nil) != tt.err {
			t.Errorf("parseInt(%q) error = %v, wantErr %v", tt.input, err, tt.err)
			continue
		}
		if !tt.err && got != tt.want {
			t.Errorf("parseInt(%q) = %v, want %v", tt.input, got, tt.want)
		}
	}
}
