package handler

import (
	"context"
	"encoding/json"
	"log"
	"net/http"

	"caribeops/analytics/internal/service"
)

// OverviewProvider is the single behavior the overview endpoint needs.
// *service.OverviewService satisfies it implicitly; tests stub it in ~10
// lines instead of faking the six-method repository.
type OverviewProvider interface {
	GetOverview(ctx context.Context) (service.Overview, error)
}

// NewOverviewHandler serves GET /analytics/overview from the provider: 200
// with the overview JSON on success; on failure the detail is logged
// server-side and the client gets a generic 500 (full error mapping is
// D4-16's task — internals never leak here).
func NewOverviewHandler(provider OverviewProvider) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		overview, err := provider.GetOverview(r.Context())
		if err != nil {
			log.Printf("overview: %v", err)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			_ = json.NewEncoder(w).Encode(map[string]string{"error": "overview unavailable"})
			return
		}
		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(overview); err != nil {
			log.Printf("write overview response: %v", err)
		}
	})
}
