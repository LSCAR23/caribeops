package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"caribeops/analytics/internal/config"
	"caribeops/analytics/internal/db"
	"caribeops/analytics/internal/handler"
	"caribeops/analytics/internal/repository"
	"caribeops/analytics/internal/service"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatal(err)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	pool, err := db.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatal(err)
	}
	defer pool.Close()
	overview := service.NewOverviewService(repository.NewPostgres(pool))
	log.Println("Analytics API listening on :" + cfg.Port)
	if err := http.ListenAndServe(":"+cfg.Port, newHandler(overview)); err != nil {
		log.Fatal(err)
	}
}

func newHandler(overview handler.OverviewProvider) http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(map[string]string{"status": "ok"}); err != nil {
			log.Printf("write health response: %v", err)
		}
	})
	mux.Handle("GET /analytics/overview", handler.NewOverviewHandler(overview))

	return mux
}
