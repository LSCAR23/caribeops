package main

import (
	"encoding/json"
	"log"
	"net/http"
)

func main() {
	log.Println("Analytics API listening on :8080")
	if err := http.ListenAndServe(":8080", newHandler()); err != nil {
		log.Fatal(err)
	}
}

func newHandler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(map[string]string{"status": "ok"}); err != nil {
			log.Printf("write health response: %v", err)
		}
	})

	return mux
}
