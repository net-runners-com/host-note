package main

import (
	"flag"
	"log"

	"github.com/hostnote/server/internal/config"
	"github.com/hostnote/server/internal/database"
	"github.com/hostnote/server/internal/seed"
)

func main() {
	force := flag.Bool("force", false, "truncate existing data before seeding")
	masterOnly := flag.Bool("master-only", false, "seed only master data (Settings, Menus)")
	demoOnly := flag.Bool("demo-only", false, "seed only demo data (Users, Casts, Himes, etc.)")
	flag.Parse()

	if err := config.Load(); err != nil {
		log.Fatalf("failed to load config: %v", err)
	}

	db, err := database.Connect()
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}

	if err := database.Migrate(db); err != nil {
		log.Fatalf("failed to run migrations: %v", err)
	}

	opts := seed.Options{Force: *force}

	if *masterOnly {
		// マスターデータのみシード
		if err := seed.RunMasterData(db, opts); err != nil {
			log.Fatalf("failed to seed master data: %v", err)
		}
	} else if *demoOnly {
		// テストデータのみシード
		if err := seed.RunDemoData(db, opts); err != nil {
			log.Fatalf("failed to seed demo data: %v", err)
		}
	} else {
		// 両方シード（デフォルト動作）
		if err := seed.Run(db, opts); err != nil {
			log.Fatalf("failed to seed database: %v", err)
		}
	}
}
