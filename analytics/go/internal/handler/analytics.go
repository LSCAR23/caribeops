package handler

import (
	"context"
	"encoding/json"
	"log"
	"net/http"

	"caribeops/analytics/internal/repository"
)

// DefaultTopLimit caps GET /analytics/top-businesses until D4-15 wires
// ?limit=.
const DefaultTopLimit = 10

// AnalyticsProvider is the grouped-query surface the D4-14 endpoints need.
// *repository.Postgres satisfies it; tests fake its three methods. If
// coordination logic ever belongs between repository and HTTP, a service can
// interpose behind this same interface without touching the handlers.
type AnalyticsProvider interface {
	BusinessesByCategory(ctx context.Context) ([]repository.CategoryCount, error)
	ReviewsByMonth(ctx context.Context) ([]repository.MonthlyReviews, error)
	TopBusinesses(ctx context.Context, limit int) ([]repository.TopBusiness, error)
}

func writeAnalyticsJSON(w http.ResponseWriter, route string, value any) {
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(value); err != nil {
		log.Printf("%s: write response: %v", route, err)
	}
}

func writeAnalyticsError(w http.ResponseWriter, route, message string, err error) {
	log.Printf("%s: %v", route, err)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusInternalServerError)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": message})
}

// NewBusinessesByCategoryHandler serves GET
// /analytics/businesses-by-category. Failures log server-side; the client
// gets a generic 500 (full error mapping is D4-16's task).
func NewBusinessesByCategoryHandler(provider AnalyticsProvider) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		rows, err := provider.BusinessesByCategory(r.Context())
		if err != nil {
			writeAnalyticsError(w, "businesses-by-category", "businesses by category unavailable", err)
			return
		}
		writeAnalyticsJSON(w, "businesses-by-category", rows)
	})
}

// NewReviewsByMonthHandler serves GET /analytics/reviews-by-month with the
// same failure contract as its sibling endpoints.
func NewReviewsByMonthHandler(provider AnalyticsProvider) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		rows, err := provider.ReviewsByMonth(r.Context())
		if err != nil {
			writeAnalyticsError(w, "reviews-by-month", "reviews by month unavailable", err)
			return
		}
		writeAnalyticsJSON(w, "reviews-by-month", rows)
	})
}

// NewTopBusinessesHandler serves GET /analytics/top-businesses at the
// default limit with the same failure contract as its sibling endpoints.
func NewTopBusinessesHandler(provider AnalyticsProvider) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		rows, err := provider.TopBusinesses(r.Context(), DefaultTopLimit)
		if err != nil {
			writeAnalyticsError(w, "top-businesses", "top businesses unavailable", err)
			return
		}
		writeAnalyticsJSON(w, "top-businesses", rows)
	})
}
