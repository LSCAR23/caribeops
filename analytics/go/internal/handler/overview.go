package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"time"

	"caribeops/analytics/internal/service"
)

// OverviewProvider is the single behavior the overview endpoint needs.
// *service.OverviewService satisfies it implicitly; tests stub it in ~10
// lines instead of faking the six-method repository.
type OverviewProvider interface {
	GetOverview(ctx context.Context, from, to time.Time) (service.Overview, error)
}

// parseDateRange parses optional ?from=/?to= query params (YYYY-MM-DD).
// Empty values are unbounded; from after to is an error.
func parseDateRange(query url.Values) (from, to time.Time, err error) {
	from, err = parseDateParam(query.Get("from"), "from")
	if err != nil {
		return time.Time{}, time.Time{}, err
	}
	to, err = parseDateParam(query.Get("to"), "to")
	if err != nil {
		return time.Time{}, time.Time{}, err
	}
	if !from.IsZero() && !to.IsZero() && from.After(to) {
		return time.Time{}, time.Time{}, fmt.Errorf("invalid date range: from is after to")
	}
	return from, to, nil
}

// NewOverviewHandler serves GET /analytics/overview from the provider: 200
// with the overview JSON on success; on failure the detail is logged
// server-side and the client gets a generic 500 (full error mapping is
// D4-16's task — internals never leak here).
func NewOverviewHandler(provider OverviewProvider) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		from, to, err := parseDateRange(r.URL.Query())
		if err != nil {
			writeAnalyticsBadRequest(w, err.Error())
			return
		}
		overview, err := provider.GetOverview(r.Context(), from, to)
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
